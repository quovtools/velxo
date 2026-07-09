import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common'
import { Request } from 'express'
import { EscrowService } from './escrow.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { PrismaService } from '@/common/services/prisma.service'
import { ForbiddenException, NotFoundException } from '@/common/exceptions/custom-exceptions'

@Controller('escrow')
export class EscrowController {
  private readonly logger = new Logger(EscrowController.name)

  constructor(
    private escrowService: EscrowService,
    private prisma: PrismaService,
  ) {}

  @Get('order/:orderId')
  @UseGuards(SupabaseJwtGuard)
  async getEscrowForOrder(
    @Param('orderId') orderId: string,
    @CurrentUserId() userId?: string,
  ) {
    try {
      const result = await this.escrowService.getEscrowForOrder(orderId, userId)
      return ApiResponseDto.ok(result, 'Escrow and payment details retrieved')
    } catch (error) {
      this.logger.error('Error fetching escrow for order:', error)
      throw error
    }
  }

  @Post('order/:orderId/pay')
  @UseGuards(SupabaseJwtGuard)
  async generatePaymentLink(
    @Param('orderId') orderId: string,
    @CurrentUserId() userId: string,
  ) {
    try {
      const result = await this.escrowService.generatePaymentLink(orderId, userId)
      return ApiResponseDto.ok(result, 'Payment link generated')
    } catch (error) {
      this.logger.error('Error generating payment link:', error)
      throw error
    }
  }

  @Get('history')
  @UseGuards(SupabaseJwtGuard)
  async getEscrowHistory() {
    try {
      const history = await this.escrowService.getEscrowHistory()
      return ApiResponseDto.ok(history, 'Escrow history retrieved')
    } catch (error) {
      this.logger.error('Error fetching escrow history:', error)
      throw error
    }
  }

  @Get(':orderId')
  @UseGuards(SupabaseJwtGuard)
  async getEscrowStatus(@Param('orderId') orderId: string) {
    try {
      const escrow = await this.escrowService.getEscrowStatus(orderId)
      return ApiResponseDto.ok(escrow, 'Escrow status retrieved')
    } catch (error) {
      this.logger.error('Error fetching escrow status:', error)
      throw error
    }
  }

  @Patch(':orderId/release')
  @UseGuards(SupabaseJwtGuard)
  async releaseFunds(
    @Param('orderId') orderId: string,
    @CurrentUserId() userId: string,
  ) {
    try {
      const order = await this.prisma.orders.findUnique({ where: { id: orderId } })
      if (!order) throw new NotFoundException('Order')
      if (order.buyerId !== userId) {
        throw new ForbiddenException('Only the buyer can release escrow')
      }

      const escrow = await this.escrowService.releaseFunds(orderId)
      return ApiResponseDto.ok(escrow, 'Funds released successfully')
    } catch (error) {
      this.logger.error('Error releasing funds:', error)
      throw error
    }
  }

  @Patch(':orderId/refund')
  @UseGuards(SupabaseJwtGuard)
  async refundFunds(
    @Param('orderId') orderId: string,
    @Body('reason') reason: string,
    @CurrentUserId() userId: string,
    @Req() req: Request,
  ) {
    try {
      const role = req['userRole']
      const isAdmin =
        role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR'
      if (!isAdmin) {
        throw new ForbiddenException('Only an admin can refund escrow')
      }

      const escrow = await this.escrowService.refundFunds(orderId, reason)
      return ApiResponseDto.ok(escrow, 'Funds refunded successfully')
    } catch (error) {
      this.logger.error('Error refunding funds:', error)
      throw error
    }
  }
}
