import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../notification.entity';
import { TaskDependency } from '../../task/task-dependency.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TaskCompletedInterceptor implements NestInterceptor {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(TaskDependency)
    private readonly dependencyRepo: Repository<TaskDependency>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (result) => {
        if (result?.status === 'completed' && result?.id) {
          const dependents = await this.dependencyRepo.find({
            where: { dependencyId: result.id },
            relations: ['task', 'task.assignedTo'],
          });

          for (const dependent of dependents) {
            if (dependent.task?.assignedTo) {
              await this.notificationService.createNotification({
                user: dependent.task.assignedTo,
                task: dependent.task,
                message: `Bağlı olduğun görev "${result.title}" tamamlandı.`,
                type: NotificationType.TASK_DEPENDENCY_READY,
              });
            }
          }
        }
      }),
    );
  }
}
