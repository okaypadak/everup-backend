import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './project/project.module';
import { CustomerModule } from './customer/customer.module';

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
      dropSchema: true,
    }),
    UserModule,
    AuthModule,
    TaskModule,
    ProjectModule,
    CommentModule,
    NotificationModule,
    CustomerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
