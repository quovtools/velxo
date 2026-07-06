import { Controller, Get, Logger, UseGuards } from '@nestjs/common'
import { WalletService } from './wallet.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/v1/wallet')
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

  @Get('transactions')
  @UseGuards(SupabaseJwtGuard)
  async getTransactionHistory(@CurrentUserId() userId: string) {
    try {
      const transactions = await this.walletService.getTransactionHistory(userId)
      return ApiResponseDto.ok(transactions, 'Transactions retrieved')
    } catch (error) {
      this.logger.error('Error fetching transactions:', error)
      throw error
    }
  }
}
