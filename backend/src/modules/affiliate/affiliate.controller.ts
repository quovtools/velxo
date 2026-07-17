import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common'
import { AffiliateService } from './affiliate.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { RequireRoles } from '@/common/decorators/roles.decorator'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { Role } from '@prisma/client'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { RegisterCreatorDto, UpdateCreatorDto, AdminReviewCreatorDto } from './dto/affiliate.dto'

@Controller('affiliate')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  // ─────────────────────────────────────────────────
  //  USER — Referral Link
  // ─────────────────────────────────────────────────

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  async getMyReferral(@CurrentUserId() userId: string) {
    const ref = await this.affiliateService.getMyReferral(userId)
    return ApiResponseDto.ok(ref, 'Referral retrieved')
  }

  @Get('me/stats')
  @UseGuards(SupabaseJwtGuard)
  async getMyStats(@CurrentUserId() userId: string) {
    const stats = await this.affiliateService.getStats(userId)
    return ApiResponseDto.ok(stats, 'Stats retrieved')
  }

  // ─────────────────────────────────────────────────
  //  PUBLIC — Click Tracking
  // ─────────────────────────────────────────────────

  @Post('click/:code')
  async trackClick(@Param('code') code: string) {
    await this.affiliateService.trackClick(code)
    return ApiResponseDto.ok(null, 'Click tracked')
  }

  // ─────────────────────────────────────────────────
  //  CREATOR — Profile & Registration
  // ─────────────────────────────────────────────────

  /** Get the logged-in user's creator profile (null if not registered) */
  @Get('creator/me')
  @UseGuards(SupabaseJwtGuard)
  async getMyCreatorProfile(@CurrentUserId() userId: string) {
    const profile = await this.affiliateService.getCreatorProfile(userId)
    return ApiResponseDto.ok(profile, 'Creator profile retrieved')
  }

  /** Register to become a creator (existing account, no new account needed) */
  @Post('creator/register')
  @UseGuards(SupabaseJwtGuard)
  async registerCreator(@CurrentUserId() userId: string, @Body() dto: RegisterCreatorDto) {
    const profile = await this.affiliateService.registerCreator(userId, dto)
    return ApiResponseDto.ok(profile, 'Creator application submitted successfully')
  }

  /** Update creator profile details */
  @Patch('creator/me')
  @UseGuards(SupabaseJwtGuard)
  async updateCreatorProfile(@CurrentUserId() userId: string, @Body() dto: UpdateCreatorDto) {
    const profile = await this.affiliateService.updateCreatorProfile(userId, dto)
    return ApiResponseDto.ok(profile, 'Creator profile updated')
  }

  // ─────────────────────────────────────────────────
  //  ADMIN — Creator Management
  // ─────────────────────────────────────────────────

  @Get('admin/creators')
  @UseGuards(SupabaseJwtGuard, RolesGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async adminListCreators(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    const creators = await this.affiliateService.getAllCreators(status, limit)
    return ApiResponseDto.ok(creators, 'Creators retrieved')
  }

  @Post('admin/creators/:id/review')
  @UseGuards(SupabaseJwtGuard, RolesGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async adminReviewCreator(
    @Param('id') creatorId: string,
    @Body() dto: AdminReviewCreatorDto,
    @CurrentUserId() adminId: string,
  ) {
    const result = await this.affiliateService.adminReviewCreator(creatorId, dto, adminId)
    return ApiResponseDto.ok(result, `Creator ${dto.status.toLowerCase()}`)
  }

  // ─────────────────────────────────────────────────
  //  ADMIN — All Referrals
  // ─────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(SupabaseJwtGuard, RolesGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllReferrals(@Query('limit') limit?: number) {
    const referrals = await this.affiliateService.getAllReferrals(limit)
    return ApiResponseDto.ok(referrals, 'All referrals retrieved')
  }
}
