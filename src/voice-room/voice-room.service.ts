import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createWorker, types as mtypes } from 'mediasoup';
import type {
  Worker,
  Router,
  RtpCapabilities,
  WebRtcTransport,
  WebRtcTransportOptions,
  Producer,
  Consumer,
  RtpParameters,
  DtlsParameters,
  MediaKind,
  AppData,
} from 'mediasoup/node/lib/types';
import {
  VoiceRoom,
  VoicePeer,
  Direction,
  JoinResult,
} from './types/voice-room.types';

@Injectable()
export class VoiceRoomService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VoiceRoomService.name);
  private worker!: Worker;
  private rooms = new Map<string, VoiceRoom>();

  async onModuleInit() {
    this.worker = await createWorker({
      logLevel: 'warn',
      rtcMinPort: Number(process.env.MEDIASOUP_RTC_MIN_PORT ?? 40000),
      rtcMaxPort: Number(process.env.MEDIASOUP_RTC_MAX_PORT ?? 49999),
    });

    this.worker.on('died', () => {
      this.logger.error('mediasoup worker died');
      process.exit(1);
    });

    this.logger.log('Mediasoup worker up');
  }

  async onModuleDestroy() {
    for (const room of this.rooms.values()) {
      try { room.router.close(); } catch {}
    }
    this.rooms.clear();
    try { this.worker?.close(); } catch {}
  }

  // ---- Room lifecycle ----
  private async createRoom(roomId: string): Promise<VoiceRoom> {
    const router: Router = await this.worker.createRouter({
      mediaCodecs: [
        { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
      ],
    });

    const audioLevelObserver = await router.createAudioLevelObserver({
      maxEntries: 3,
      threshold: -70,
      interval: 800,
    });

    const voiceRoom: VoiceRoom = {
      id: roomId,
      hostId: undefined,
      locked: false,
      router,
      audioLevelObserver,
      peers: new Map<string, VoicePeer>(),
      bannedPeerIds: new Set<string>(),
    };

    this.rooms.set(roomId, voiceRoom);
    this.logger.log(`Room created: ${roomId}`);
    return voiceRoom;
  }

  private getOrCreateRoom(roomId: string) {
    return this.rooms.get(roomId) ?? this.createRoom(roomId);
  }

  getParticipants(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.peers.values()).map(p => ({
      id: p.id,
      username: p.username,
      muted: p.muted,
      isHost: room.hostId === p.id,
    }));
  }

  private webRtcListenIps(): mtypes.TransportListenIp[] {
    const ip = process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0';
    const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || undefined;
    return [{ ip, announcedIp }];
  }

  // ---- Core ops ----
  async join(roomId: string, username: string, clientId: string): Promise<JoinResult> {
    const room = await this.getOrCreateRoom(roomId);

    if (room.bannedPeerIds.has(clientId)) {
      throw new Error('banned');
    }

    if (room.locked && room.peers.size > 0) {
      // Kilitliyse, yalnızca mevcut host (veya odada olan) yeniden bağlanabilsin
      if (room.hostId && room.hostId !== clientId && !room.peers.has(clientId)) {
        throw new Error('room-locked');
      }
    }

    // Reconnect temizliği
    if (room.peers.has(clientId)) {
      await this.leave(roomId, clientId);
    }

    const peer: VoicePeer = {
      id: clientId,
      username,
      muted: false,
      rtpCapabilities: undefined,
      transports: new Map<string, WebRtcTransport<AppData>>(),
      producers: new Map<string, Producer<AppData>>(),
      consumers: new Map<string, Consumer<AppData>>(),
    };

    room.peers.set(clientId, peer);

    if (!room.hostId) {
      room.hostId = clientId;
    }

    // Not: active-speakers publish’ünü gateway üstlenebilir; burada observer zaten kurulu.
    return {
      roomId,
      clientId,
      isHost: room.hostId === clientId,
      routerRtpCapabilities: room.router.rtpCapabilities as RtpCapabilities,
      participants: this.getParticipants(roomId),
      locked: room.locked,
    };
  }

  async leave(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: true };

    const peer = room.peers.get(clientId);
    if (!peer) return { ok: true };

    // Close mediasoup entities
    for (const c of peer.consumers.values()) { try { c.close(); } catch {} }
    for (const p of peer.producers.values()) {
      try {
        await room.audioLevelObserver.removeProducer({ producerId: p.id });
      } catch {}
      try { p.close(); } catch {}
    }
    for (const t of peer.transports.values()) { try { t.close(); } catch {} }

    room.peers.delete(clientId);

    // Host devret
    if (room.hostId === clientId) {
      const next = Array.from(room.peers.values())[0];
      room.hostId = next?.id;
    }

    // Oda boşsa kapat
    if (room.peers.size === 0) {
      try { room.audioLevelObserver.close(); } catch {}
      try { room.router.close(); } catch {}
      this.rooms.delete(roomId);
      this.logger.log(`Room closed: ${roomId}`);
    }

    return { ok: true };
  }

  async transferHost(roomId: string, byPeerId: string, targetPeerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    if (room.hostId !== byPeerId) throw new Error('not-host');
    if (!room.peers.has(targetPeerId)) throw new Error('peer-not-found');

    room.hostId = targetPeerId;
    return { ok: true, hostId: room.hostId };
  }

  async lockRoom(roomId: string, byPeerId: string, locked: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    if (room.hostId !== byPeerId) throw new Error('not-host');

    room.locked = locked;
    return { ok: true, locked };
  }

  async kickPeer(roomId: string, byPeerId: string, targetPeerId: string, ban = false) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    if (room.hostId !== byPeerId) throw new Error('not-host');
    if (!room.peers.has(targetPeerId)) throw new Error('peer-not-found');

    await this.leave(roomId, targetPeerId);
    if (ban) room.bannedPeerIds.add(targetPeerId);
    return { ok: true, banned: ban };
  }

  // ---- WebRTC ops ----
  async createWebRtcTransport(roomId: string, clientId: string, direction: Direction) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    const peer = room.peers.get(clientId);
    if (!peer) throw new Error('peer-not-found');

    const options: WebRtcTransportOptions = {
      listenIps: this.webRtcListenIps(),
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 800_000,
      appData: { peerId: clientId, direction },
    };

    const transport = await room.router.createWebRtcTransport(options);

    transport.on('dtlsstatechange', (state) => {
      if (state === 'closed') transport.close();
    });

    // Typesafe: 'close' olayını observer üzerinden dinleyelim
    transport.observer.on('close', () => {
      this.logger.warn(`transport closed: ${transport.id}`);
    });

    peer.transports.set(transport.id, transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async connectWebRtcTransport(roomId: string, clientId: string, transportId: string, dtlsParameters: DtlsParameters) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    const peer = room.peers.get(clientId);
    if (!peer) throw new Error('peer-not-found');

    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error('transport-not-found');

    await transport.connect({ dtlsParameters });
    return { ok: true };
  }

  async produce(roomId: string, clientId: string, transportId: string, kind: MediaKind, rtpParameters: RtpParameters) {
    if (kind !== 'audio') throw new Error('only-audio-supported');

    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    const peer = room.peers.get(clientId);
    if (!peer) throw new Error('peer-not-found');

    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error('transport-not-found');

    const producer: Producer<AppData> = await transport.produce({
      kind,
      rtpParameters,
      appData: { peerId: clientId },
    });

    producer.on('transportclose', () => producer.close());
    producer.observer.on('close', async () => {
      try {
        await room.audioLevelObserver.removeProducer({ producerId: producer.id });
      } catch {}
    });

    peer.producers.set(producer.id, producer);

    // Aktif konuşmacı için observer’a ekle
    await room.audioLevelObserver.addProducer({ producerId: producer.id });

    return { producerId: producer.id };
  }

  async consume(roomId: string, clientId: string, transportId: string, producerId: string, rtpCapabilities?: RtpCapabilities) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    const peer = room.peers.get(clientId);
    if (!peer) throw new Error('peer-not-found');

    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error('transport-not-found');

    const peerCapabilities = rtpCapabilities ?? peer.rtpCapabilities;
    if (!peerCapabilities) throw new Error('missing-rtp-capabilities');
    peer.rtpCapabilities = peerCapabilities;

    if (!room.router.canConsume({ producerId, rtpCapabilities: peerCapabilities })) {
      throw new Error('cannot-consume');
    }

    const consumer: Consumer<AppData> = await transport.consume({
      producerId,
      rtpCapabilities: peerCapabilities,
      paused: true, // client resume eder
      appData: { peerId: clientId },
    });

    consumer.on('transportclose', () => consumer.close());
    consumer.on('producerclose', () => consumer.close());

    peer.consumers.set(consumer.id, consumer);

    return {
      consumerId: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      producerPaused: false,
    };
  }

  async resumeConsumer(roomId: string, clientId: string, consumerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');
    const peer = room.peers.get(clientId);
    if (!peer) throw new Error('peer-not-found');

    const consumer = peer.consumers.get(consumerId);
    if (!consumer) throw new Error('consumer-not-found');

    await consumer.resume();
    return { ok: true };
  }

  async setMute(roomId: string, clientId: string, muted: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('room-not-found');

    const peer = room.peers.get(clientId);
    if (!peer) throw new Error('peer-not-found');

    peer.muted = muted;

    for (const p of peer.producers.values()) {
      if (muted && !p.paused) await p.pause();
      if (!muted && p.paused) await p.resume();
    }

    return { ok: true };
  }
}
