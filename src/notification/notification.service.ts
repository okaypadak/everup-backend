import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../user/user.entity';
import { Task } from '../task/task.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async findNotificationsForUser(user: User): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(
    notificationId: number,
    user: User,
  ): Promise<Notification | null> {
    const notif = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: user.id } },
    });
    if (!notif) return null;
    notif.isRead = true;
    return this.notificationRepo.save(notif);
  }

  async createNotification(params: {
    user: User;
    message: string;
  }) {
    const notif = this.notificationRepo.create({
      user: params.user,
      message: params.message,
    });
    return this.notificationRepo.save(notif);
  }
}
