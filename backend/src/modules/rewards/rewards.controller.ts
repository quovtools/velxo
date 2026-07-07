import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { RewardsService } from './rewards.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get('coins')
  @UseGuards(SupabaseJwtGuard)
  async getCoinBalance(@CurrentUserId() userId: string) {
    const data = await this.rewardsService.getCoinBalance(userId)
    return ApiResponseDto.ok(data, 'Coin balance retrieved')
  }

  @Get('transactions')
  @UseGuards(SupabaseJwtGuard)
  async getTransactions(@CurrentUserId() userId: string, @Query('limit') limit?: string) {
    const data = await this.rewardsService.getTransactions(userId, limit ? parseInt(limit) : 50)
    return ApiResponseDto.ok(data, 'Transactions retrieved')
  }

  @Get('catalog')
  @UseGuards(SupabaseJwtGuard)
  async getCatalog() {
    const data = await this.rewardsService.getCatalog()
    return ApiResponseDto.ok(data, 'Reward catalog retrieved')
  }

  @Post('redeem')
  @UseGuards(SupabaseJwtGuard)
  async redeem(@CurrentUserId() userId: string, @Body('catalogId') catalogId: string) {
    const data = await this.rewardsService.redeem(userId, catalogId)
    return ApiResponseDto.ok(data, 'Reward redeemed successfully')
  }
}
