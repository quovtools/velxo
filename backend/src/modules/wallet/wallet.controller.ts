import { Controller, Get, Post, Body, Logger, UseGuards } from '@nestjs/common'
import { WalletService } from './wallet.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { WithdrawDto } from './dto/withdraw.dto'
import { Decimal } from '@prisma/client/runtime/library'

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name)

  constructor(private walletService: WalletService) {}

  @Get()
  @UseGuards(SupabaseJwtGuard)
  async getWalletBalance(@CurrentUserId() userId: string) {
    try {
      const wallet = await this.walletService.getWalletBalance(userId)
      return ApiResponseDto.ok(wallet, 'Wallet balance retrieved')
    } catch (error) {
      this.logger.error('Error fetching wallet:', error)
      throw error
    }
  }

  @Post('withdraw')
  @UseGuards(SupabaseJwtGuard)
  async withdraw(@CurrentUserId() userId: string, @Body() dto: WithdrawDto) {
    try {
      const result = await this.walletService.withdraw(
        userId,
        new Decimal(dto.amount),
        dto.method,
        dto.destination,
      )
      return ApiResponseDto.ok(result, 'Withdrawal request submitted')
    } catch (error) {
      this.logger.error('Error processing withdrawal:', error)
      throw error
    }
  }
}
