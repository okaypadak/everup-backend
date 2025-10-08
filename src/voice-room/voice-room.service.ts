import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RtpCapabilities,
  RtpCodecCapability,
  WebRtcTransport,
  Worker,
  Router,
  Producer,
  Consumer,
  DtlsParameters,
  RtpParameters,
  DataProducer,
  DataConsumer,
  IceParameters,
  IceCandidate,
  SctpParameters,
} from 'mediasoup/node/lib/types';
import { createWorker, types as mediasoupTypes } from 'mediasoup';
import { VoiceRoomStateDto } from './dto/voice-room-state.dto';

interface VoiceRoom {
  id: string;
  router: Router;
  audioLevelObserver: mediasoupTypes.AudioLevelObserver;
  peers: Map<string, VoiceRoomPeer>;
}

interface VoiceRoomPeer {
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  dataProducers: Map<string, DataProducer>;
  dataConsumers: Map<string, DataConsumer>;
}

export type TransportDirection = 'send' | 'recv';

export interface TransportInfo {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  sctpParameters?: SctpParameters;
}

@Injectable()
export class VoiceRoomService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VoiceRoomService.name);
  private worker: Worker | null = null;
  private readonly rooms = new Map<string, VoiceRoom>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureWorker();
  }

  async onModuleDestroy(): Promise<void> {
    for (const room of this.rooms.values()) {
      room.audioLevelObserver.close();
      room.router.close();
    }
    this.rooms.clear();

    if (this.worker) {
      this.worker.close();
      this.worker = null;
    }
  }

  async getRouterRtpCapabilities(roomId: string): Promise<RtpCapabilities> {
    const room = await this.getOrCreateRoom(roomId);
    return room.router.rtpCapabilities;
  }

  async createWebRtcTransport(
    roomId: string,
    peerId: string,
    direction: TransportDirection,
  ): Promise<TransportInfo> {
    const room = await this.getOrCreateRoom(roomId);
    const peer = this.getOrCreatePeer(room, peerId);

    const transport = await room.router.createWebRtcTransport({
      listenIps: [
        {
          ip: this.configService.get<string>('MEDIASOUP_LISTEN_IP', '0.0.0.0'),
          announcedIp:
            this.configService.get<string>('MEDIASOUP_ANNOUNCED_IP') ??
            undefined,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: Number(
        this.configService.get<number>('MEDIASOUP_INITIAL_BITRATE', 600_000),
      ),
      appData: {
        peerId,
        roomId,
        direction,
      },
    });

    peer.transports.set(transport.id, transport);

    transport.on('dtlsstatechange', (state) => {
      if (state === 'closed' || state === 'failed') {
        this.logger.warn(
          `DTLS state changed to ${state} for transport ${transport.id}`,
        );
        transport.close();
        peer.transports.delete(transport.id);
      }
    });

    transport.on('close', () => {
      peer.transports.delete(transport.id);
    });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    };
  }

  async connectWebRtcTransport(
    roomId: string,
    peerId: string,
    transportId: string,
    dtlsParameters: DtlsParameters,
  ): Promise<void> {
    const transport = this.getTransport(roomId, peerId, transportId);
    await transport.connect({ dtlsParameters });
  }

  async produce(
    roomId: string,
    peerId: string,
    transportId: string,
    kind: mediasoupTypes.MediaKind,
    rtpParameters: RtpParameters,
  ): Promise<Producer> {
    const transport = this.getTransport(roomId, peerId, transportId);

    if (transport.appData.direction !== 'send') {
      throw new BadRequestException('Transport is not configured for sending');
    }

    const producer = await transport.produce({ kind, rtpParameters });

    const peer = this.getPeer(roomId, peerId);
    peer.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      producer.close();
      peer.producers.delete(producer.id);
    });

    producer.on('close', () => {
      peer.producers.delete(producer.id);
    });

    return producer;
  }

  async consume(
    roomId: string,
    peerId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<Consumer> {
    const room = await this.getOrCreateRoom(roomId);
    const peer = this.getPeer(roomId, peerId);
    const producer = this.getProducer(roomId, producerId);

    if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities })) {
      throw new BadRequestException(
        'Client cannot consume the specified producer',
      );
    }

    const recvTransport = Array.from(peer.transports.values()).find(
      (transport) => transport.appData.direction === 'recv',
    );

    if (!recvTransport) {
      throw new BadRequestException(
        'No receiving transport available for peer',
      );
    }

    const consumer = await recvTransport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: producer.kind === 'video',
    });

    peer.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      consumer.close();
      peer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      consumer.close();
      peer.consumers.delete(consumer.id);
    });

    return consumer;
  }

  getRoomState(roomId: string): VoiceRoomStateDto {
    const room = this.rooms.get(roomId);

    if (!room) {
      return {
        roomId,
        peers: [],
      };
    }

    return {
      roomId,
      peers: Array.from(room.peers.entries()).map(([peerId, peer]) => ({
        peerId,
        producers: Array.from(peer.producers.values()).map((producer) => ({
          id: producer.id,
          kind: producer.kind,
        })),
        consumers: Array.from(peer.consumers.values()).map((consumer) => ({
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
        })),
      })),
    };
  }

  async closePeer(roomId: string, peerId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const peer = room.peers.get(peerId);
    if (!peer) {
      return;
    }

    for (const consumer of peer.consumers.values()) {
      consumer.close();
    }
    for (const producer of peer.producers.values()) {
      producer.close();
    }
    for (const transport of peer.transports.values()) {
      transport.close();
    }
    for (const dataConsumer of peer.dataConsumers.values()) {
      dataConsumer.close();
    }
    for (const dataProducer of peer.dataProducers.values()) {
      dataProducer.close();
    }

    room.peers.delete(peerId);

    if (room.peers.size === 0) {
      this.logger.log(`Closing empty room ${roomId}`);
      room.audioLevelObserver.close();
      room.router.close();
      this.rooms.delete(roomId);
    }
  }

  private async ensureWorker(): Promise<void> {
    if (this.worker) {
      return;
    }

    const logLevel = this.configService.get<mediasoupTypes.LogLevel>(
      'MEDIASOUP_LOG_LEVEL',
      'warn',
    );
    const logTags = (
      this.configService.get<string>('MEDIASOUP_LOG_TAGS', '') || ''
    )
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => Boolean(tag)) as mediasoupTypes.LogTag[];

    this.worker = await createWorker({
      rtcMinPort: Number(
        this.configService.get<number>('MEDIASOUP_RTC_MIN_PORT', 40000),
      ),
      rtcMaxPort: Number(
        this.configService.get<number>('MEDIASOUP_RTC_MAX_PORT', 49999),
      ),
      logLevel,
      logTags,
    });

    this.worker.on('died', async () => {
      this.logger.error('Mediasoup worker died, recreating worker');
      this.worker = null;
      setTimeout(
        () => this.ensureWorker().catch((error) => this.logger.error(error)),
        1000,
      );
    });
  }

  private async getOrCreateRoom(roomId: string): Promise<VoiceRoom> {
    await this.ensureWorker();
    if (!this.worker) {
      throw new Error('Mediasoup worker is not available');
    }

    let room = this.rooms.get(roomId);
    if (room) {
      return room;
    }

    const router = await this.worker.createRouter({
      mediaCodecs: this.getMediaCodecs(),
    });

    const audioLevelObserver = await router.createAudioLevelObserver({
      maxEntries: 1,
      threshold: -80,
      interval: 800,
    });

    room = {
      id: roomId,
      router,
      audioLevelObserver,
      peers: new Map(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  private getOrCreatePeer(room: VoiceRoom, peerId: string): VoiceRoomPeer {
    let peer = room.peers.get(peerId);
    if (!peer) {
      peer = {
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        dataProducers: new Map(),
        dataConsumers: new Map(),
      };
      room.peers.set(peerId, peer);
    }
    return peer;
  }

  private getPeer(roomId: string, peerId: string): VoiceRoomPeer {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const peer = room.peers.get(peerId);
    if (!peer) {
      throw new NotFoundException('Peer not found in room');
    }

    return peer;
  }

  private getTransport(
    roomId: string,
    peerId: string,
    transportId: string,
  ): WebRtcTransport {
    const peer = this.getPeer(roomId, peerId);
    const transport = peer.transports.get(transportId);
    if (!transport) {
      throw new NotFoundException('Transport not found');
    }
    return transport;
  }

  private getProducer(roomId: string, producerId: string): Producer {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    for (const peer of room.peers.values()) {
      const producer = peer.producers.get(producerId);
      if (producer) {
        return producer;
      }
    }

    throw new NotFoundException('Producer not found in room');
  }

  private getMediaCodecs(): RtpCodecCapability[] {
    const opus: RtpCodecCapability = {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
      parameters: {
        useinbandfec: 1,
      },
    };

    return [opus];
  }
}
