import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationType, NotificationPriority } from '@prisma/client';

@ApiTags('MA / Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('ma/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'is_read', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
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
      is_read:
        is_read === 'true' ? true : is_read === 'false' ? false : undefined,
      notification_type: type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return {
      success: true,
      data: notifications,
    };
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const user_id = req.user.userId;
    const count = await this.notificationService.getUnreadCount(user_id);

    return {
      success: true,
      data: { count },
    };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String })
  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const user_id = req.user.userId;
    const notification = await this.notificationService.markAsRead(
      parseInt(id),
      user_id,
    );

    return {
      success: true,
      data: notification,
    };
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    const user_id = req.user.userId;
    await this.notificationService.markAllAsRead(user_id);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: String })
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
