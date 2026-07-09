import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ForbiddenException,
} from '@nestjs/common'
import { MessagesService } from './messages.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { CreateConversationDto } from './dto/create-conversation.dto'

@Controller('messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name)

  constructor(private messagesService: MessagesService) {}

  @Get()
  @UseGuards(SupabaseJwtGuard)
  async getConversations(@CurrentUserId() userId: string, @Query('limit') limit?: number) {
    try {
      const conversations = await this.messagesService.getConversations(userId, limit)
      return ApiResponseDto.ok(conversations, 'Conversations retrieved')
    } catch (error) {
      this.logger.error('Error fetching conversations:', error)
      throw error
    }
  }

  @Get('unread-count')
  @UseGuards(SupabaseJwtGuard)
  async getUnreadCount(@CurrentUserId() userId: string) {
    try {
      const result = await this.messagesService.getUnreadCount(userId)
      return ApiResponseDto.ok(result, 'Unread count retrieved')
    } catch (error) {
      this.logger.error('Error fetching unread count:', error)
      throw error
    }
  }

  @Post('conversation')
  @UseGuards(SupabaseJwtGuard)
  async createConversation(
    @CurrentUserId() userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    try {
      const { buyerId, sellerId, orderId } = await this.messagesService.resolveParticipants(userId, dto)
      if (buyerId === sellerId) {
        throw new ForbiddenException('You cannot start a conversation with yourself')
      }
      const conversation = await this.messagesService.getOrCreateConversation(buyerId, sellerId, orderId)
      return ApiResponseDto.ok(conversation, 'Conversation ready')
    } catch (error) {
      this.logger.error('Error creating conversation:', error)
      throw error
    }
  }

  @Get('conversation/:conversationId')
  @UseGuards(SupabaseJwtGuard)
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUserId() userId: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const messages = await this.messagesService.getConversationMessages(conversationId, userId, limit)
      return ApiResponseDto.ok(messages, 'Messages retrieved')
    } catch (error) {
      this.logger.error('Error fetching messages:', error)
      throw error
    }
  }

  @Post('conversation/:conversationId/send')
  @UseGuards(SupabaseJwtGuard)
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUserId() senderId: string,
    @Body('content') content: string,
    @Body('attachments') attachments?: string[],
  ) {
    try {
      const message = await this.messagesService.sendMessage(
        conversationId,
        senderId,
        content,
        attachments,
      )
      return ApiResponseDto.ok(message, 'Message sent successfully')
    } catch (error) {
      this.logger.error('Error sending message:', error)
      throw error
    }
  }

  @Patch('conversation/:conversationId/mark-read')
  @UseGuards(SupabaseJwtGuard)
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUserId() userId: string,
  ) {
    try {
      await this.messagesService.markMessagesAsRead(conversationId, userId)
      return ApiResponseDto.ok(null, 'Messages marked as read')
    } catch (error) {
      this.logger.error('Error marking messages as read:', error)
      throw error
    }
  }

  @Delete('message/:messageId')
  @UseGuards(SupabaseJwtGuard)
  async deleteMessage(@Param('messageId') messageId: string, @CurrentUserId() userId: string) {
    try {
      await this.messagesService.deleteMessage(messageId, userId)
      return ApiResponseDto.ok(null, 'Message deleted')
    } catch (error) {
      this.logger.error('Error deleting message:', error)
      throw error
    }
  }

  @Patch('conversation/:conversationId/block')
  @UseGuards(SupabaseJwtGuard)
  async blockConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUserId() userId: string,
  ) {
    try {
      const conversation = await this.messagesService.blockConversation(conversationId, userId)
      return ApiResponseDto.ok(conversation, 'Conversation blocked')
    } catch (error) {
      this.logger.error('Error blocking conversation:', error)
      throw error
    }
  }
}
