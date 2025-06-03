// src/notification/notification.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { Task } from '../task/task.entity';
import { User } from '../user/user.entity';

@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  constructor(private readonly notificationService: NotificationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async (comment) => {
        // Comment instance döner
        // task, author alanları eager olmalı veya yoksa find ile çekilmeli

        // Notifi edilecek kullanıcı(lar)ı bul
        // Sadece atanmış kullanıcı ve yazarı dışındaki diğer kişiler (proje ihtiyacına göre)
        const task: Task = comment.task;
        const author: User = comment.author;

        // Şimdilik sadece assignedTo'ya notification atalım (ve yazar kendiyse bildirim atlama)
        if (task.assignedTo && task.assignedTo.id !== author.id) {
          await this.notificationService.createNotification({
            user: task.assignedTo,
            task,
            message: `Task "${task.title}" için yeni yorum: "${comment.content.slice(0, 40)}..."`,
          });
        }

        // Ekstra: task'ın takipçi, bağımlı task user'ları gibi kişiler varsa onlar da eklenir
      }),
    );
  }
}
