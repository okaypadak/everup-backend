import { Notification } from '../notification.entity';
import { Expose } from 'class-transformer';

export class ResponseNotificationDto {
  @Expose()
  id: number;

  @Expose()
  message: string;

  @Expose()
  type: string;

  @Expose()
  isRead: boolean;

  @Expose()
  createdAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.message = notification.message;
    this.isRead = notification.isRead;
    this.createdAt = notification.createdAt;
  }
}
