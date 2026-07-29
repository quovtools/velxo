import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Logger,
} from '@nestjs/common'
import { LiveChatService } from './live-chat.service'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('live-chat')
export class LiveChatController {
  private readonly logger = new Logger(LiveChatController.name)

  constructor(private liveChatService: LiveChatService) {}

  // ─── Visitor endpoints (no auth required) ───────────────────────────────

  /** POST /live-chat/start — visitor starts or retrieves their session */
  @Post('start')
  async startChat(
    @Body() body: {
      visitorId: string
      visitorName?: string
      visitorEmail?: string
      subject?: string
    },
  ) {
    try {
      const chat = await this.liveChatService.getOrCreateSession(body.visitorId, body)
      return ApiResponseDto.ok(chat, 'Chat session ready')
    } catch (error) {
      this.logger.error('Error starting chat:', error)
      throw error
    }
  }

  /** POST /live-chat/send — visitor sends a message */
  @Post('send')
  async visitorSend(
    @Body() body: { visitorId: string; content: string },
  ) {
    try {
      const msg = await this.liveChatService.visitorSend(body.visitorId, body.content)
      return ApiResponseDto.ok(msg, 'Message sent')
    } catch (error) {
      this.logger.error('Error sending visitor message:', error)
      throw error
    }
  }

  /** GET /live-chat/poll?visitorId=…&since=… — visitor polls for new messages */
  @Get('poll')
  async visitorPoll(
    @Query('visitorId') visitorId: string,
    @Query('since') since?: string,
  ) {
    try {
      const result = await this.liveChatService.visitorPoll(visitorId, since)
      return ApiResponseDto.ok(result, 'Polled')
    } catch (error) {
      this.logger.error('Error polling chat:', error)
      throw error
    }
  }

  // ─── Admin endpoints (require x-admin-password header) ──────────────────

  /** GET /live-chat/admin/chats — list all chats */
  @Get('admin/chats')
  @UseGuards(AdminPasswordGuard)
  async adminGetChats(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const chats = await this.liveChatService.adminGetChats(
        status,
        limit ? parseInt(limit) : 50,
      )
      return ApiResponseDto.ok(chats, 'Chats retrieved')
    } catch (error) {
      this.logger.error('Error fetching admin chats:', error)
      throw error
    }
  }

  /** GET /live-chat/admin/unread — unread message count for badge */
  @Get('admin/unread')
  @UseGuards(AdminPasswordGuard)
  async adminUnreadCount() {
    try {
      const count = await this.liveChatService.adminUnreadCount()
      return ApiResponseDto.ok({ count }, 'Unread count retrieved')
    } catch (error) {
      this.logger.error('Error fetching unread count:', error)
      throw error
    }
  }

  /** GET /live-chat/admin/chats/:chatId — full thread */
  @Get('admin/chats/:chatId')
  @UseGuards(AdminPasswordGuard)
  async adminGetThread(@Param('chatId') chatId: string) {
    try {
      const chat = await this.liveChatService.adminGetThread(chatId)
      return ApiResponseDto.ok(chat, 'Thread retrieved')
    } catch (error) {
      this.logger.error('Error fetching chat thread:', error)
      throw error
    }
  }

  /** POST /live-chat/admin/chats/:chatId/reply — admin sends a reply */
  @Post('admin/chats/:chatId/reply')
  @UseGuards(AdminPasswordGuard)
  async adminReply(
    @Param('chatId') chatId: string,
    @Body('content') content: string,
  ) {
    try {
      const msg = await this.liveChatService.adminSend(chatId, content)
      return ApiResponseDto.ok(msg, 'Reply sent')
    } catch (error) {
      this.logger.error('Error sending admin reply:', error)
      throw error
    }
  }

  /** PATCH /live-chat/admin/chats/:chatId/status — update status */
  @Patch('admin/chats/:chatId/status')
  @UseGuards(AdminPasswordGuard)
  async adminSetStatus(
    @Param('chatId') chatId: string,
    @Body('status') status: string,
  ) {
    try {
      const chat = await this.liveChatService.adminSetStatus(chatId, status)
      return ApiResponseDto.ok(chat, 'Status updated')
    } catch (error) {
      this.logger.error('Error updating chat status:', error)
      throw error
    }
  }
}
