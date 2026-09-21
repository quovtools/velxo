import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { RewardsService } from './rewards.service'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
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

  // ─────────────────────────────────────────────────
  //  ADMIN — Catalog & redemptions management
  // ─────────────────────────────────────────────────

  @Get('admin/catalog')
  @UseGuards(AdminPasswordGuard)
  async adminListCatalog() {
    const data = await this.rewardsService.adminListCatalog()
    return ApiResponseDto.ok(data, 'Reward catalog retrieved')
  }

  @Post('admin/catalog')
  @UseGuards(AdminPasswordGuard)
  async adminCreateCatalogItem(@Body() dto: any) {
    const data = await this.rewardsService.adminCreateCatalogItem(dto)
    return ApiResponseDto.ok(data, 'Reward item created')
  }

  @Patch('admin/catalog/:id')
  @UseGuards(AdminPasswordGuard)
  async adminUpdateCatalogItem(@Param('id') id: string, @Body() dto: any) {
    const data = await this.rewardsService.adminUpdateCatalogItem(id, dto)
    return ApiResponseDto.ok(data, 'Reward item updated')
  }

  @Delete('admin/catalog/:id')
  @UseGuards(AdminPasswordGuard)
  async adminDeleteCatalogItem(@Param('id') id: string) {
    const data = await this.rewardsService.adminDeleteCatalogItem(id)
    return ApiResponseDto.ok(data, 'Reward item deleted')
  }

  @Get('admin/redemptions')
  @UseGuards(AdminPasswordGuard)
  async adminListRedemptions(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.rewardsService.adminListRedemptions(
      status,
      limit ? parseInt(limit) : 100,
    )
    return ApiResponseDto.ok(data, 'Redemptions retrieved')
  }

  @Patch('admin/redemptions/:id')
  @UseGuards(AdminPasswordGuard)
  async adminUpdateRedemption(
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
    @CurrentUserId() adminId: string,
  ) {
    const data = await this.rewardsService.adminUpdateRedemption(
      id,
      body.status,
      adminId,
      body.note,
    )
    return ApiResponseDto.ok(data, 'Redemption updated')
  }
}
