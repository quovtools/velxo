import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { SellersService } from './sellers.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { ForbiddenException } from '@/common/exceptions/custom-exceptions'

@Controller('sellers')
export class SellersController {
  private readonly logger = new Logger(SellersController.name)

  constructor(private sellersService: SellersService) {}

  /**
   * Create a new seller account
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSeller(
    @CurrentUserId() userId: string,
    @Body('storeName') storeName: string,
    @Body('storeDescription') storeDescription?: string,
  ) {
    try {
      const seller = await this.sellersService.createSeller(userId, {
        storeName,
        storeDescription,
      })
      return ApiResponseDto.ok(seller, 'Seller account created successfully')
    } catch (error) {
      this.logger.error('Error creating seller:', error)
      throw error
    }
  }

  /**
   * Get current user's seller profile — aliased to /sellers/me (frontend uses
   * this path) AND /sellers/me/profile for backward compatibility.
   * MUST be declared BEFORE the :id param route to avoid "me" being treated as
   * a seller ID.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySellerProfileShort(@CurrentUserId() userId: string) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      // Also compute/refresh level on every fetch (lazy recompute)
      await this.sellersService.updateSellerStats(seller.id).catch(() => {})
      const profile = await this.sellersService.getSellerProfile(seller.id)
      return ApiResponseDto.ok(profile, 'Seller profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller profile (me):', error)
      throw error
    }
  }

  /**
   * Get current user's seller profile (legacy path)
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getMySellerProfile(@CurrentUserId() userId: string) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      return ApiResponseDto.ok(seller, 'Seller profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller profile:', error)
      throw error
    }
  }

  /**
   * Get seller profile — param route must come AFTER all static routes above.
   */
  @Get(':id')
  async getSeller(@Param('id') sellerId: string) {
    try {
      const seller = await this.sellersService.getSellerProfile(sellerId)
      return ApiResponseDto.ok(seller, 'Seller retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller:', error)
      throw error
    }
  }

  /**
   * Update seller profile — only the owner may update their own profile.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateSeller(
    @Param('id') sellerId: string,
    @CurrentUserId() userId: string,
    @Body() updates: any,
  ) {
    try {
      // Fetch the seller first to verify ownership
      const existing = await this.sellersService.getSellerProfile(sellerId)
      if (existing.user?.id !== userId) {
        throw new ForbiddenException('You can only update your own seller profile')
      }
      const seller = await this.sellersService.updateSeller(sellerId, updates)
      return ApiResponseDto.ok(seller, 'Seller profile updated')
    } catch (error) {
      this.logger.error('Error updating seller:', error)
      throw error
    }
  }

  /**
   * Get seller statistics
   */
  @Get(':id/stats')
  async getSellerStats(@Param('id') sellerId: string) {
    try {
      const profile = await this.sellersService.getSellerProfile(sellerId)
      return ApiResponseDto.ok(profile.stats, 'Seller statistics retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller stats:', error)
      throw error
    }
  }

  /**
   * List all sellers (with pagination)
   */
  @Get()
  async listSellers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('verified') verified?: boolean,
  ) {
    try {
      const sellers = await this.sellersService.listSellers({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search,
        verified: verified !== undefined ? verified === (true as any) || verified === ('true' as any) : undefined,
      })
      return ApiResponseDto.ok(sellers, 'Sellers retrieved')
    } catch (error) {
      this.logger.error('Error listing sellers:', error)
      throw error
    }
  }

  /**
   * Submit KYC documents
   */
  @Post(':id/kyc')
  @UseGuards(JwtAuthGuard)
  async submitKyc(
    @Param('id') sellerId: string,
    @CurrentUserId() _userId: string,
    @Body() kycData: any,
  ) {
    try {
      const seller = await this.sellersService.submitKyc(sellerId, kycData)
      return ApiResponseDto.ok(seller, 'KYC documents submitted successfully')
    } catch (error) {
      this.logger.error('Error submitting KYC:', error)
      throw error
    }
  }
}
