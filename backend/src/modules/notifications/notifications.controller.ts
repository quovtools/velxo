import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name)

  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(SupabaseJwtGuard)
  async getNotifications(@CurrentUserId() userId: string) {
    try {
      const notifications = await this.notificationsService.getNotifications(userId)
      return ApiResponseDto.ok(notifications, 'Notifications retrieved')
    } catch (error) {
      this.logger.error('Error fetching notifications:', error)
      throw error
    }
  }

  @Get('unread')
  @UseGuards(SupabaseJwtGuard)
  async getUnreadNotifications(@CurrentUserId() userId: string) {
    try {
      const notifications = await this.notificationsService.getUnreadNotifications(userId)
      return ApiResponseDto.ok(notifications, 'Unread notifications retrieved')
    } catch (error) {
      this.logger.error('Error fetching unread notifications:', error)
      throw error
    }
  }

  @Patch(':id/read')
  @UseGuards(SupabaseJwtGuard)
  async markAsRead(@Param('id') notificationId: string, @CurrentUserId() userId: string) {
    try {
      const notification = await this.notificationsService.markAsRead(notificationId, userId)
      return ApiResponseDto.ok(notification, 'Notification marked as read')
    } catch (error) {
      this.logger.error('Error marking notification as read:', error)
      throw error
    }
  }

  @Patch('mark-all-read')
  @UseGuards(SupabaseJwtGuard)
  async markAllAsRead(@CurrentUserId() userId: string) {
    try {
      await this.notificationsService.markAllAsRead(userId)
      return ApiResponseDto.ok(null, 'All notifications marked as read')
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(SupabaseJwtGuard)
  async deleteNotification(@Param('id') notificationId: string, @CurrentUserId() userId: string) {
    try {
      await this.notificationsService.deleteNotification(notificationId, userId)
      return ApiResponseDto.ok(null, 'Notification deleted')
    } catch (error) {
      this.logger.error('Error deleting notification:', error)
      throw error
    }
  }

  @Post('push/subscribe')
  @UseGuards(SupabaseJwtGuard)
  async subscribePush(@CurrentUserId() userId: string, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) {
    try {
      await this.notificationsService.subscribePush(userId, body)
      return ApiResponseDto.ok({ success: true }, 'Subscribed to push notifications')
    } catch (error) {
      this.logger.error('Error subscribing to push:', error)
      throw error
    }
  }

  @Delete('push/unsubscribe')
  @UseGuards(SupabaseJwtGuard)
  async unsubscribePush(@CurrentUserId() userId: string, @Body('endpoint') endpoint: string) {
    try {
      await this.notificationsService.unsubscribePush(userId, endpoint)
      return ApiResponseDto.ok({ success: true }, 'Unsubscribed from push notifications')
    } catch (error) {
      this.logger.error('Error unsubscribing from push:', error)
      throw error
    }
  }

  @Get('push/vapid-key')
  async getVapidKey() {
    return ApiResponseDto.ok({ publicKey: process.env.VAPID_PUBLIC_KEY || '' }, 'VAPID key retrieved')
  }

  @Get('preferences')
  @UseGuards(SupabaseJwtGuard)
  async getPreferences(@CurrentUserId() userId: string) {
    try {
      const prefs = await this.notificationsService.getPreferences(userId)
      return ApiResponseDto.ok(prefs, 'Preferences retrieved')
    } catch (error) {
      this.logger.error('Error fetching preferences:', error)
      throw error
    }
  }

  @Patch('preferences')
  @UseGuards(SupabaseJwtGuard)
  async updatePreferences(@CurrentUserId() userId: string, @Body() prefs: Record<string, boolean>) {
    try {
      const updated = await this.notificationsService.updatePreferences(userId, prefs)
      return ApiResponseDto.ok(updated, 'Preferences updated')
    } catch (error) {
      this.logger.error('Error updating preferences:', error)
      throw error
    }
  }
}
