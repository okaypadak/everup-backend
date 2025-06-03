import { Controller, Get, Req, UseGuards, Patch, Param, UseInterceptors } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseNotificationDto } from './dto/response-notification.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Kullanıcıya özel bildirimler
  @Get('mine')
  async myNotifications(@Req() req): Promise<ResponseNotificationDto[]> {
    return this.notificationService.findNotificationsForUser(req.user);
  }

  // Bildirimi okundu olarak işaretle
  @Patch(':id/read')
  async markAsRead(@Param('id') id: number, @Req() req) {
    const updated = await this.notificationService.markAsRead(Number(id), req.user);
    return updated
      ? { success: true }
      : { success: false, error: 'Böyle bir bildirim yok veya size ait değil' };
  }
}
