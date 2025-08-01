import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
import { Task } from '../../task/task.entity';
import { User } from '../../user/user.entity';

@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  constructor(private readonly notificationService: NotificationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          if (result?.assignedTo && result?.title) {
            const task: Task = result;
            const creator: User = request.user;

            if (task.assignedTo.id !== creator?.id) {
              await this.notificationService.createNotification({
                user: task.assignedTo,
                message: `${creator?.firstName ?? 'Birisi'}, sana "${task.title}" adında bir görev atadı.`,
              });
            }
          }
        } catch (err) {
          console.error('[CommentNewInterceptor] Bildirim gönderilirken hata:', err);
        }
      }),
    );
  }
}
