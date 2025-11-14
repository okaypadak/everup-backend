import { Controller, Get, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { extractTokenFromRequest } from '../auth/utils/auth-token.util';

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

  @Post('ws-token')
  async issueWsToken(@Req() req: Request) {
    const sessionToken = extractTokenFromRequest(req as any);
    if (!sessionToken) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    let payload: Record<string, any>;
    try {
      payload = jwt.verify(sessionToken, process.env.JWT_SECRET as string) as Record<string, any>;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const { iat, exp, ...claims } = payload;
    const ttlSeconds = Number(process.env.VOICE_WS_TOKEN_TTL_SECONDS ?? 300);

    const voiceToken = jwt.sign(
      {
        ...claims,
        voice: true,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: ttlSeconds },
    );

    return { token: voiceToken, expiresIn: ttlSeconds };
  }
}
