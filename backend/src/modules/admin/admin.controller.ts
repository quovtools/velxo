import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name)

  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(AdminPasswordGuard)
  async getDashboard() {
    try {
      const stats = await this.adminService.getDashboardStats()
      return ApiResponseDto.ok(stats, 'Dashboard stats retrieved')
    } catch (error) {
      this.logger.error('Error fetching dashboard:', error)
      throw error
    }
  }

  @Get('listings/pending')
  @UseGuards(AdminPasswordGuard)
  async getPendingListings(@Query('limit') limit?: number) {
    try {
      const listings = await this.adminService.getPendingListings(limit)
      return ApiResponseDto.ok(listings, 'Pending listings retrieved')
    } catch (error) {
      this.logger.error('Error fetching pending listings:', error)
      throw error
    }
  }

  @Patch('listings/:id/approve')
  @UseGuards(AdminPasswordGuard)
  async approveListing(@Param('id') listingId: string, @CurrentUserId() moderatorId: string) {
    try {
      const listing = await this.adminService.approveListing(listingId, moderatorId)
      return ApiResponseDto.ok(listing, 'Listing approved successfully')
    } catch (error) {
      this.logger.error('Error approving listing:', error)
      throw error
    }
  }

  @Patch('listings/:id/reject')
  @UseGuards(AdminPasswordGuard)
  async rejectListing(
    @Param('id') listingId: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason: string,
  ) {
    try {
      const listing = await this.adminService.rejectListing(listingId, moderatorId, reason)
      return ApiResponseDto.ok(listing, 'Listing rejected successfully')
    } catch (error) {
      this.logger.error('Error rejecting listing:', error)
      throw error
    }
  }

  @Get('fraud/flagged-listings')
  @UseGuards(AdminPasswordGuard)
  async getFlaggedListings(@Query('limit') limit?: number) {
    try {
      const listings = await this.adminService.getFlaggedListings(limit)
      return ApiResponseDto.ok(listings, 'Flagged listings retrieved')
    } catch (error) {
      this.logger.error('Error fetching flagged listings:', error)
      throw error
    }
  }

  @Get('fraud/suspicious-users')
  @UseGuards(AdminPasswordGuard)
  async getSuspiciousUsers(@Query('limit') limit?: number) {
    try {
      const users = await this.adminService.getSuspiciousUsers(limit)
      return ApiResponseDto.ok(users, 'Suspicious users retrieved')
    } catch (error) {
      this.logger.error('Error fetching suspicious users:', error)
      throw error
    }
  }

  @Get('analytics/revenue')
  @UseGuards(AdminPasswordGuard)
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const analytics = await this.adminService.getRevenueAnalytics(
        new Date(startDate),
        new Date(endDate),
      )
      return ApiResponseDto.ok(analytics, 'Revenue analytics retrieved')
    } catch (error) {
      this.logger.error('Error fetching revenue analytics:', error)
      throw error
    }
  }

  @Get('sellers/:sellerId/metrics')
  @UseGuards(AdminPasswordGuard)
  async getSellerMetrics(@Param('sellerId') sellerId: string) {
    try {
      const metrics = await this.adminService.getSellerMetrics(sellerId)
      return ApiResponseDto.ok(metrics, 'Seller metrics retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller metrics:', error)
      throw error
    }
  }

  @Get('kyc/pending')
  @UseGuards(AdminPasswordGuard)
  async getPendingKyc(@Query('limit') limit?: number) {
    try {
      const submissions = await this.adminService.getPendingKyc(limit)
      return ApiResponseDto.ok(submissions, 'Pending KYC submissions retrieved')
    } catch (error) {
      this.logger.error('Error fetching pending KYC:', error)
      throw error
    }
  }

  @Patch('kyc/:sellerId/approve')
  @UseGuards(AdminPasswordGuard)
  async approveKyc(
    @Param('sellerId') sellerId: string,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const seller = await this.adminService.approveKyc(sellerId, moderatorId)
      return ApiResponseDto.ok(seller, 'KYC approved successfully')
    } catch (error) {
      this.logger.error('Error approving KYC:', error)
      throw error
    }
  }

  @Patch('kyc/:sellerId/reject')
  @UseGuards(AdminPasswordGuard)
  async rejectKyc(
    @Param('sellerId') sellerId: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason: string,
  ) {
    try {
      const seller = await this.adminService.rejectKyc(sellerId, moderatorId, reason)
      return ApiResponseDto.ok(seller, 'KYC rejected')
    } catch (error) {
      this.logger.error('Error rejecting KYC:', error)
      throw error
    }
  }
}
