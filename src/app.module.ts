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
      synchronize: false,
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
