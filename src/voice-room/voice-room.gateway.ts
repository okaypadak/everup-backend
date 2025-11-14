import {
  WebSocketGateway, WebSocketServer,
  OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, WebSocket } from 'ws';
import { VoiceRoomService } from './voice-room.service';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JwtUser } from './types/voice-room.types';
import { extractTokenFromRequest } from '../auth/utils/auth-token.util';

type AnyJson = Record<string, any>;

@WebSocketGateway({ path: '/ws/voice', cors: { origin: true, credentials: true } })
export class VoiceRoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(VoiceRoomGateway.name);

  private sockets = new Map<WebSocket, {
    clientId: string;
    roomId?: string;
    username?: string;
    user?: JwtUser;
    lastSeenAt: number;
    msgCountWindow: { ts: number; count: number }; // rate limit
  }>();

  constructor(private readonly voice: VoiceRoomService) {}

  afterInit() {
    this.logger.log('VoiceRoomGateway initialized');
  }

  // JWT doğrulama (connection upgrade isteğinde header veya cookie)
  handleConnection(client: WebSocket, req: any) {
    const clientId = randomUUID();
    const meta = {
      clientId,
      lastSeenAt: Date.now(),
      msgCountWindow: { ts: Date.now(), count: 0 },
    } as any;

    try {
      const token = extractTokenFromRequest(req);
      if (!token) {
        throw new Error('no-auth');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtUser;
      meta.user = decoded;
      meta.username = decoded.name || decoded.email || `user-${clientId.slice(0, 6)}`;
    } catch (e) {
      client.close(4401, 'unauthorized');
      return;
    }

    this.sockets.set(client, meta);
    this.send(client, { type: 'connected', data: { clientId, user: meta.user } });

    client.on('message', async (raw) => {
      // Basit rate limit: 20 mesaj / 5 sn
      const now = Date.now();
      const win = this.sockets.get(client)?.msgCountWindow!;
      if (now - win.ts > 5000) { win.ts = now; win.count = 0; }
      win.count++;
      if (win.count > 20) {
        this.send(client, { type: 'error', data: { code: 'rate-limit', message: 'Too many messages' } });
        return;
      }

      try {
        const msg = JSON.parse(raw.toString()) as { type: string; data?: AnyJson };
        await this.handleMessage(client, msg.type, msg.data || {});
      } catch (e: any) {
        this.send(client, { type: 'error', data: { message: e?.message ?? 'bad-message' } });
      }
    });

    client.on('pong', () => {
      const m = this.sockets.get(client);
      if (m) m.lastSeenAt = Date.now();
    });

    // Heartbeat
    const interval = setInterval(() => {
      if (client.readyState !== client.OPEN) { clearInterval(interval); return; }
      const m = this.sockets.get(client);
      if (!m) return;
      if (Date.now() - m.lastSeenAt > 15000) { client.terminate(); clearInterval(interval); return; }
      client.ping();
    }, 5000);

    client.on('close', () => clearInterval(interval));
  }

  async handleDisconnect(client: WebSocket) {
    const meta = this.sockets.get(client);
    if (!meta) return;
    if (meta.roomId) await this.voice.leave(meta.roomId, meta.clientId);
    this.sockets.delete(client);
  }

  // ---- Message router
  private async handleMessage(client: WebSocket, type: string, data: AnyJson) {
    const meta = this.sockets.get(client);
    if (!meta) return;

    try {
      switch (type) {
        case 'ping': {
          this.send(client, { type: 'pong', data: { t: Date.now() } });
          return;
        }

        case 'join': {
          const { roomId, username } = data as { roomId: string; username?: string };
          const name = username || meta.username || `user-${meta.clientId.slice(0, 6)}`;
          const result = await this.voice.join(roomId, name, meta.clientId);
          meta.roomId = roomId;
          meta.username = name;
          this.send(client, { type: 'joined', data: result });
          this.broadcast(roomId, {
            type: 'participants',
            data: { participants: this.voice.getParticipants(roomId), locked: result.locked },
          });
          return;
        }

        case 'create-transport': {
          const { roomId, direction } = data as { roomId: string; direction: 'send' | 'recv' };
          const transportInfo = await this.voice.createWebRtcTransport(roomId, meta.clientId, direction);
          this.send(client, { type: 'transport-created', data: { direction, ...transportInfo } });
          return;
        }

        case 'connect-transport': {
          const { roomId, transportId, dtlsParameters } = data as any;
          await this.voice.connectWebRtcTransport(roomId, meta.clientId, transportId, dtlsParameters);
          this.send(client, { type: 'transport-connected', data: { transportId } });
          return;
        }

        case 'produce': {
          const { roomId, transportId, kind, rtpParameters } = data as any;
          const { producerId } = await this.voice.produce(roomId, meta.clientId, transportId, kind, rtpParameters);
          this.send(client, { type: 'produced', data: { producerId } });
          this.broadcast(roomId, { type: 'new-producer', data: { producerId, peerId: meta.clientId } });
          return;
        }

        case 'consume': {
          const { roomId, transportId, producerId, rtpCapabilities } = data as any;
          const payload = await this.voice.consume(roomId, meta.clientId, transportId, producerId, rtpCapabilities);
          this.send(client, { type: 'consumed', data: payload });
          return;
        }

        case 'resume-consumer': {
          const { roomId, consumerId } = data as any;
          await this.voice.resumeConsumer(roomId, meta.clientId, consumerId);
          this.send(client, { type: 'consumer-resumed', data: { consumerId } });
          return;
        }

        case 'set-mute': {
          const { roomId, muted } = data as { roomId: string; muted: boolean };
          await this.voice.setMute(roomId, meta.clientId, muted);
          this.broadcast(roomId, { type: 'peer-updated', data: { peerId: meta.clientId, muted } });
          return;
        }

        // ---- Yönetim (sadece host)
        case 'transfer-host': {
          const { roomId, targetPeerId } = data as any;
          const res = await this.voice.transferHost(roomId, meta.clientId, targetPeerId);
          this.broadcast(roomId, { type: 'host-changed', data: { hostId: res.hostId } });
          this.broadcast(roomId, { type: 'participants', data: { participants: this.voice.getParticipants(roomId) } });
          return;
        }

        case 'lock-room': {
          const { roomId } = data as any;
          const res = await this.voice.lockRoom(roomId, meta.clientId, true);
          this.broadcast(roomId, { type: 'room-locked', data: { locked: res.locked } });
          return;
        }

        case 'unlock-room': {
          const { roomId } = data as any;
          const res = await this.voice.lockRoom(roomId, meta.clientId, false);
          this.broadcast(roomId, { type: 'room-locked', data: { locked: res.locked } });
          return;
        }

        case 'kick-peer': {
          const { roomId, targetPeerId, ban } = data as { roomId: string; targetPeerId: string; ban?: boolean };
          const res = await this.voice.kickPeer(roomId, meta.clientId, targetPeerId, !!ban);
          this.broadcast(roomId, { type: 'peer-kicked', data: { peerId: targetPeerId, banned: res.banned } });
          // Hedef socket’ı kapat
          for (const [sock, sMeta] of this.sockets) {
            if (sMeta.clientId === targetPeerId) {
              this.send(sock, { type: 'kicked', data: { roomId, banned: res.banned } });
              sock.close(4403, 'kicked');
            }
          }
          this.broadcast(roomId, { type: 'participants', data: { participants: this.voice.getParticipants(roomId) } });
          return;
        }

        case 'participants': {
          const { roomId } = data as any;
          this.send(client, { type: 'participants', data: { participants: this.voice.getParticipants(roomId) } });
          return;
        }

        case 'leave': {
          const { roomId } = data as any;
          await this.voice.leave(roomId, meta.clientId);
          meta.roomId = undefined;
          this.send(client, { type: 'left', data: { ok: true } });
          this.broadcast(roomId, { type: 'participants', data: { participants: this.voice.getParticipants(roomId) } });
          return;
        }

        default:
          this.send(client, { type: 'error', data: { message: `unknown-type: ${type}` } });
      }
    } catch (err: any) {
      this.send(client, { type: 'error', data: { message: err?.message ?? 'failed' } });
    }
  }

  private send(client: WebSocket, msg: AnyJson) {
    if (client.readyState === client.OPEN) client.send(JSON.stringify(msg));
  }

  private broadcast(roomId: string, msg: AnyJson) {
    const str = JSON.stringify(msg);
    for (const [sock, meta] of this.sockets.entries()) {
      if (meta.roomId === roomId && sock.readyState === sock.OPEN) sock.send(str);
    }
  }
}
