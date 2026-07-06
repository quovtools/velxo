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
import { DisputesService } from './disputes.service'
import { CreateDisputeDto } from './dto/create-dispute.dto'
import { ResolveDisputeDto } from './dto/resolve-dispute.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('disputes')
export class DisputesController {
  private readonly logger = new Logger(DisputesController.name)

  constructor(private disputesService: DisputesService) {}

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createDispute(@CurrentUserId() initiatorId: string, @Body() dto: CreateDisputeDto) {
    try {
      const dispute = await this.disputesService.createDispute(initiatorId, dto)
      return ApiResponseDto.ok(dispute, 'Dispute created successfully')
    } catch (error) {
      this.logger.error('Error creating dispute:', error)
      throw error
    }
  }

  @Get('open')
  async getOpenDisputes(@Query('limit') limit?: number) {
    try {
      const disputes = await this.disputesService.getOpenDisputes(limit)
      return ApiResponseDto.ok(disputes, 'Open disputes retrieved')
    } catch (error) {
      this.logger.error('Error fetching disputes:', error)
      throw error
    }
  }

  @Get(':id')
  async getDisputeById(@Param('id') disputeId: string) {
    try {
      const dispute = await this.disputesService.getDisputeById(disputeId)
      return ApiResponseDto.ok(dispute, 'Dispute retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching dispute:', error)
      throw error
    }
  }

  @Patch(':id/resolve')
  @UseGuards(SupabaseJwtGuard)
  async resolveDispute(
    @Param('id') disputeId: string,
    @CurrentUserId() resolverId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    try {
      const dispute = await this.disputesService.resolveDispute(disputeId, resolverId, dto)
      return ApiResponseDto.ok(dispute, 'Dispute resolved successfully')
    } catch (error) {
      this.logger.error('Error resolving dispute:', error)
      throw error
    }
  }

  @Post(':id/messages')
  @UseGuards(SupabaseJwtGuard)
  async addMessage(
    @Param('id') disputeId: string,
    @CurrentUserId() senderId: string,
    @Body('content') content: string,
    @Body('attachments') attachments?: string[],
  ) {
    try {
      const message = await this.disputesService.addDisputeMessage(
        disputeId,
        senderId,
        content,
        attachments,
      )
      return ApiResponseDto.ok(message, 'Message added successfully')
    } catch (error) {
      this.logger.error('Error adding message:', error)
      throw error
    }
  }
}
