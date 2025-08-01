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
export class CommentNewInterceptor implements NestInterceptor {
  constructor(private readonly notificationService: NotificationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          if (result?.task && result?.content && result?.author) {
            const task: Task = result.task;
            const author: User = result.author;

            if (task.assignedTo && task.assignedTo.id !== author.id) {
              await this.notificationService.createNotification({
                user: task.assignedTo,
                message: `Task "${task.title}" için yeni yorum: "${result.content.slice(0, 40)}..."`,
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
