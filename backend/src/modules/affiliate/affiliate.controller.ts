import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common'
import { AffiliateService } from './affiliate.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { RequireRoles } from '@/common/decorators/roles.decorator'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { Role } from '@prisma/client'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('affiliate')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  // User — get or create their referral link
  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  async getMyReferral(@CurrentUserId() userId: string) {
    const ref = await this.affiliateService.getMyReferral(userId)
    return ApiResponseDto.ok(ref, 'Referral retrieved')
  }

  // User — get my affiliate stats
  @Get('me/stats')
  @UseGuards(SupabaseJwtGuard)
  async getMyStats(@CurrentUserId() userId: string) {
    const stats = await this.affiliateService.getStats(userId)
    return ApiResponseDto.ok(stats, 'Stats retrieved')
  }

  // Public — track click
  @Post('click/:code')
  async trackClick(@Param('code') code: string) {
    await this.affiliateService.trackClick(code)
    return ApiResponseDto.ok(null, 'Click tracked')
  }

  // Admin — list all affiliates
  @Get('admin/all')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllReferrals(@Query('limit') limit?: number) {
    const referrals = await this.affiliateService.getAllReferrals(limit)
    return ApiResponseDto.ok(referrals, 'All referrals retrieved')
  }
}
