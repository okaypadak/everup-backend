import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Task } from '../task/task.entity';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationType } from './notification.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class NotificationScheduler {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 8 * * *') // her sabah saat 08:00'de çalışır
  async sendDeadlineReminders() {
    const now = dayjs();
    const tomorrow = now.add(1, 'day').endOf('day');

    const tasks = await this.taskRepo.find({
      where: {
        deadline: Between(now.toDate(), tomorrow.toDate()),
        status: Not('completed'),
      },
      relations: ['assignedTo'],
    });

    for (const task of tasks) {
      if (task.assignedTo) {
        await this.notificationService.createNotification({
          user: task.assignedTo,
          task,
          message: `Görev "${task.title}" için son teslim tarihi yaklaşıyor.`,
          type: NotificationType.DEADLINE_REMINDER,
        });
      }
    }
  }
}
