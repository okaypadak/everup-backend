import { Controller, Get, Query } from '@nestjs/common';
import * as crypto from 'crypto';

type IceServer = { urls: string | string[]; username?: string; credential?: string };

@Controller('voice')
export class VoiceRoomController {
  @Get('health')
  health() {
    return { ok: true, time: Date.now() };
  }

  @Get('ice')
  getIce(@Query('uid') uid?: string) {
    const urls = (process.env.TURN_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
    const servers: IceServer[] = [];

    const stunUrls = urls.filter(u => u.startsWith('stun:'));
    if (stunUrls.length) servers.push({ urls: stunUrls });

    const turnUrls = urls.filter(u => u.startsWith('turn:'));
    if (process.env.TURN_REST_SECRET) {
      const ttl = Number(process.env.TURN_USERNAME_TTL_SECONDS || 3600);
      const username = `${Math.floor(Date.now() / 1000) + ttl}:${uid || 'user'}`;
      const hmac = crypto.createHmac('sha1', process.env.TURN_REST_SECRET).update(username).digest('base64');
      if (turnUrls.length) servers.push({ urls: turnUrls, username, credential: hmac });
    } else if (process.env.TURN_STATIC_USERNAME && process.env.TURN_STATIC_PASSWORD) {
      const username = process.env.TURN_STATIC_USERNAME;
      const credential = process.env.TURN_STATIC_PASSWORD;
      if (turnUrls.length) servers.push({ urls: turnUrls, username, credential });
    } else {
      if (turnUrls.length) servers.push({ urls: turnUrls }); // credentials yoksa yine döndür
    }

    return { iceServers: servers };
  }
}
