import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // WebSocket (mediasoup signaling için gerekli)
  app.useWebSocketAdapter(new WsAdapter(app));

  // CORS (JWT + WS için güvenli varsayılanlar)
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Global Validation + Serialization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,               // DTO dönüşümleri
      forbidNonWhitelisted: true,    // ekstra field’ları reddet
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Graceful shutdown (container/k8s için)
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 9120);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  const url = await app.getUrl();
  console.log(`[BOOT] API listening at ${url}`);
  console.log(`[BOOT] WS path: ${url.replace(/^http/, 'ws')}/ws/voice`);
}
bootstrap();
