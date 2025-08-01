import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Task, TaskStatus } from '../task/task.entity';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '../notification/notification.service';
import * as dayjs from 'dayjs';
import { Not } from 'typeorm';
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
        status: Not(TaskStatus.COMPLETED),
      },
      relations: ['assignedTo'],
    });

    for (const task of tasks) {
      if (task.assignedTo) {
        await this.notificationService.createNotification({
          user: task.assignedTo,
          message: `Görev "${task.title}" için son teslim tarihi yaklaşıyor.`,
        });
      }
    }
  }
}
