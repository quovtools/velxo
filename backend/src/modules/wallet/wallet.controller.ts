import { Controller, Get, Post, Body, Param, Logger, UseGuards, Query } from '@nestjs/common'
import { WalletService } from './wallet.service'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { WithdrawDto } from './dto/withdraw.dto'
import { TopupInitiateDto } from './dto/topup-initiate.dto'
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

  // FIX C4: Add missing GET /wallet/transactions endpoint.
  // The frontend wallet page calls /wallet/transactions — this route was previously missing,
  // causing the transaction history to silently fail for all users.
  @Get('transactions')
  @UseGuards(SupabaseJwtGuard)
  async getTransactions(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit as any, 10) : 50
      const transactions = await this.walletService.getTransactionHistory(userId, parsedLimit)
      return ApiResponseDto.ok(transactions, 'Transaction history retrieved')
    } catch (error) {
      this.logger.error('Error fetching transactions:', error)
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

  @Post('topup/initiate')
  @UseGuards(SupabaseJwtGuard)
  async topupInitiate(@CurrentUserId() userId: string, @Body() dto: TopupInitiateDto) {
    try {
      // FIX C5: topupInitiate now calls the payment provider and returns a paymentUrl.
      const result = await this.walletService.topupInitiate(userId, dto.amount, dto.currency, dto.provider)
      return ApiResponseDto.ok(result, 'Wallet top-up initiated')
    } catch (error) {
      this.logger.error('Error initiating top-up:', error)
      throw error
    }
  }

  @Get('topup/status/:txnId')
  @UseGuards(SupabaseJwtGuard)
  async topupStatus(@CurrentUserId() userId: string, @Param('txnId') txnId: string) {
    try {
      const status = await this.walletService.topupStatus(txnId, userId)
      return ApiResponseDto.ok(status, 'Top-up status retrieved')
    } catch (error) {
      this.logger.error('Error fetching top-up status:', error)
      throw error
    }
  }
}
