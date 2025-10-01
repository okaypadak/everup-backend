import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';
import { ProjectModule } from './project/project.module';
import { CustomerModule } from './customer/customer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentModule } from './document/document.module';
import { TaskLabelModule } from './task/task-label.module';
import { SprintModule } from './sprint/sprint.module';
import { MeetingModule } from './meeting/meeting.module';
import { VoiceRoomModule } from './voice-room/voice-room.module';

console.log('✅ ENV VALUES ------------------');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_SSL:', process.env.DB_SSL);
console.log('--------------------------------');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASS || 'sifre123',
      database: process.env.DB_NAME || 'everup',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: false,
      ssl: process.env.DB_SSL === 'true',
      extra: process.env.DB_SSL === 'true'
        ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
        : {},
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/everUp'),
    UserModule,
    AuthModule,
    TaskModule,
    TaskLabelModule,
    ProjectModule,
    CommentModule,
    NotificationModule,
    CustomerModule,
    DocumentModule,
    SprintModule,
    MeetingModule,
    VoiceRoomModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
