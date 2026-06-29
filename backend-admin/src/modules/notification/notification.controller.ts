import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationType, NotificationPriority } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('is_read') is_read?: string,
    @Query('type') type?: NotificationType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user_id = req.user.userId;
    const notifications = await this.notificationService.findByUserId(user_id, {
      is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
      notification_type: type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const user_id = req.user.userId;
    const count = await this.notificationService.getUnreadCount(user_id);

    return {
      success: true,
      data: { count },
    };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const user_id = req.user.userId;
    const notification = await this.notificationService.markAsRead(parseInt(id), user_id);

    return {
      success: true,
      data: notification,
    };
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    const user_id = req.user.userId;
    await this.notificationService.markAllAsRead(user_id);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const user_id = req.user.userId;
    await this.notificationService.delete(parseInt(id), user_id);

    return {
      success: true,
      message: 'Notification deleted',
    };
  }
}

