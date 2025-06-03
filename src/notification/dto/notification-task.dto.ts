import { Expose } from 'class-transformer';

export class NotificationTaskDto {
  @Expose() id: number;
  @Expose() title: string;
}
