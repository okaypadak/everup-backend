import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
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
        console.log('[TaskCompletedInterceptor] Interceptor triggered for task:', result?.id);

        if (result?.status === 'Completed' && result?.id) {
          console.log('[TaskCompletedInterceptor] Task marked as completed:', result.title);

          const dependents = await this.dependencyRepo.find({
            where: {
              dependsOn: { id: result.id },
            } as any,
            relations: ['task', 'task.assignedTo'],
          });

          if (!dependents || dependents.length === 0) {
            console.log('[TaskCompletedInterceptor] No dependent tasks found. Skipping notification.');
            return;
          }

          console.log(`[TaskCompletedInterceptor] Found ${dependents.length} dependent tasks.`);

          for (const dependent of dependents) {
            if (dependent.task?.assignedTo) {
              console.log(`[TaskCompletedInterceptor] Notifying user ID ${dependent.task.assignedTo.id}`);
              await this.notificationService.createNotification({
                user: dependent.task.assignedTo,
                message: `Bağlı olduğun görev "${result.title}" tamamlandı.`,
              });
            }
          }
        }
      }),
    );
  }
}
