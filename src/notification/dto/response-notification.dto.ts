import { Expose, Type } from 'class-transformer';
import { NotificationTaskDto } from './notification-task.dto';

export class ResponseNotificationDto {
  @Expose() id: number;
  @Expose() message: string;
  @Expose() isRead: boolean;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => NotificationTaskDto)
  task: NotificationTaskDto;
}
