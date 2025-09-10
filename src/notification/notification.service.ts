import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../user/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

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

  async createNotification(params: { user: User; message: string }) {
    try {
      this.logger.log('[NotificationService] createNotification started');
      this.logger.log(`  User ID: ${params.user?.id}`);
      this.logger.log(`  Message: ${params.message}`);

      const notif = this.notificationRepo.create({
        user: params.user,
        message: params.message,
      });

      const saved = await this.notificationRepo.save(notif);

      this.logger.log(
        `[NotificationService] Notification saved with ID: ${saved.id}`,
      );
      return saved;
    } catch (error) {
      this.logger.error('[NotificationService] HATA:', error);
      throw error;
    }
  }
}
