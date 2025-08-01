import { Controller, Get, Req, Patch, Param, UseInterceptors } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ResponseNotificationDto } from './dto/response-notification.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('mine')
  async myNotifications(@Req() req): Promise<ResponseNotificationDto[]> {
    const notifs = await this.notificationService.findNotificationsForUser(req.user);
    return notifs.map(n => new ResponseNotificationDto(n));
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
