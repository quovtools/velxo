import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { SupportService } from './support.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { SupportTicketCategory } from '@prisma/client'

@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name)

  constructor(private supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(SupabaseJwtGuard)
  async createTicket(
    @CurrentUserId() userId: string,
    @Body('subject') subject: string,
    @Body('category') category: SupportTicketCategory,
    @Body('priority') priority?: string,
  ) {
    try {
      const ticket = await this.supportService.createTicket(userId, subject, category, priority)
      return ApiResponseDto.ok(ticket, 'Support ticket created')
    } catch (error) {
      this.logger.error('Error creating support ticket:', error)
      throw error
    }
  }

  @Post('complaints')
  @UseGuards(SupabaseJwtGuard)
  async createComplaint(
    @CurrentUserId() userId: string,
    @Body('orderId') orderId: string,
    @Body('description') description: string,
    @Body('category') category?: SupportTicketCategory,
  ) {
    try {
      const ticket = await this.supportService.createOrderComplaint(
        userId,
        orderId,
        description,
        category,
      )
      return ApiResponseDto.ok(ticket, 'Complaint filed successfully')
    } catch (error) {
      this.logger.error('Error filing complaint:', error)
      throw error
    }
  }

  @Get('tickets/me')
  @UseGuards(SupabaseJwtGuard)
  async getMyTickets(@CurrentUserId() userId: string, @Query('limit') limit?: number) {
    try {
      const tickets = await this.supportService.getUserTickets(userId, limit)
      return ApiResponseDto.ok(tickets, 'User tickets retrieved')
    } catch (error) {
      this.logger.error('Error fetching user tickets:', error)
      throw error
    }
  }

  @Get('tickets/:id')
  @UseGuards(SupabaseJwtGuard)
  async getTicket(@Param('id') ticketId: string, @CurrentUserId() userId: string) {
    try {
      const ticket = await this.supportService.getTicketById(ticketId)
      return ApiResponseDto.ok(ticket, 'Ticket retrieved')
    } catch (error) {
      this.logger.error('Error fetching ticket:', error)
      throw error
    }
  }

  @Get('tickets')
  @UseGuards(SupabaseJwtGuard)
  async getOpenTickets(@Query('limit') limit?: number) {
    try {
      const tickets = await this.supportService.getOpenTickets(limit)
      return ApiResponseDto.ok(tickets, 'Open tickets retrieved')
    } catch (error) {
      this.logger.error('Error fetching open tickets:', error)
      throw error
    }
  }

  @Patch('tickets/:id/assign')
  @UseGuards(SupabaseJwtGuard)
  async assignTicket(
    @Param('id') ticketId: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    try {
      const ticket = await this.supportService.assignTicket(ticketId, assigneeId)
      return ApiResponseDto.ok(ticket, 'Ticket assigned')
    } catch (error) {
      this.logger.error('Error assigning ticket:', error)
      throw error
    }
  }

  @Patch('tickets/:id/resolve')
  @UseGuards(SupabaseJwtGuard)
  async resolveTicket(
    @Param('id') ticketId: string,
    @Body('resolutionNotes') resolutionNotes: string,
  ) {
    try {
      const ticket = await this.supportService.resolveTicket(ticketId, resolutionNotes)
      return ApiResponseDto.ok(ticket, 'Ticket resolved')
    } catch (error) {
      this.logger.error('Error resolving ticket:', error)
      throw error
    }
  }

  @Get('stats')
  @UseGuards(SupabaseJwtGuard)
  async getStats() {
    try {
      const stats = await this.supportService.getTicketStats()
      return ApiResponseDto.ok(stats, 'Support stats retrieved')
    } catch (error) {
      this.logger.error('Error fetching support stats:', error)
      throw error
    }
  }
}
