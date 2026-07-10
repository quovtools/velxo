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
    @Body('accountType') accountType?: string,
  ) {
    try {
      const seller = await this.sellersService.createSeller(
        userId,
        storeName,
        storeDescription,
        accountType as any,
      )
      return ApiResponseDto.ok(seller, 'Seller account created successfully')
    } catch (error) {
      this.logger.error('Error creating seller:', error)
      throw error
    }
  }

  /**
   * Get seller profile
   */
  @Get(':id')
  async getSeller(@Param('id') sellerId: string) {
    try {
      const seller = await this.sellersService.getSeller(sellerId)
      return ApiResponseDto.ok(seller, 'Seller retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller:', error)
      throw error
    }
  }

  /**
   * Get current user's seller profile
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
   * Update seller profile
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateSeller(
    @Param('id') sellerId: string,
    @CurrentUserId() userId: string,
    @Body() updates: any,
  ) {
    try {
      const seller = await this.sellersService.updateSeller(sellerId, userId, updates)
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
      const stats = await this.sellersService.getSellerStats(sellerId)
      return ApiResponseDto.ok(stats, 'Seller statistics retrieved')
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
        page: page || 1,
        limit: limit || 20,
        search,
        verified,
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
    @CurrentUserId() userId: string,
    @Body() kycData: any,
  ) {
    try {
      const seller = await this.sellersService.submitKyc(sellerId, userId, kycData)
      return ApiResponseDto.ok(seller, 'KYC documents submitted successfully')
    } catch (error) {
      this.logger.error('Error submitting KYC:', error)
      throw error
    }
  }
}
