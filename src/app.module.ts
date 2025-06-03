import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';

// Veritabanı bağlantı ayarları örnektir, .env ile yönetebilirsin.
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'proje',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    AuthModule,
    TaskModule,
    CommentModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
