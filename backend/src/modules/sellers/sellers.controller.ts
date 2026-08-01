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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySellerProfileShort(@CurrentUserId() userId: string) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      await this.sellersService.updateSellerStats(seller.id).catch(() => {})
      const profile = await this.sellersService.getSellerProfile(seller.id)
      return ApiResponseDto.ok(profile, 'Seller profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller profile (me):', error)
      throw error
    }
  }

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

  @Get('top-sellers')
  async getTopSellers(@Query('limit') limit?: number) {
    try {
      const sellers = await this.sellersService.getTopSellers(limit ? Number(limit) : 20)
      return ApiResponseDto.ok(sellers, 'Top sellers retrieved')
    } catch (error) {
      this.logger.error('Error fetching top sellers:', error)
      throw error
    }
  }

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateSeller(
    @Param('id') sellerId: string,
    @CurrentUserId() userId: string,
    @Body() updates: any,
  ) {
    try {
      const existing = await this.sellersService.getSellerProfile(sellerId)
      const existingUserId = (existing as any).user?.id
      if (existingUserId !== userId) {
        throw new ForbiddenException('You can only update your own seller profile')
      }
      const seller = await this.sellersService.updateSeller(sellerId, updates)
      return ApiResponseDto.ok(seller, 'Seller profile updated')
    } catch (error) {
      this.logger.error('Error updating seller:', error)
      throw error
    }
  }

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

  @Post('kyc/submit')
  @UseGuards(JwtAuthGuard)
  async submitKycVerified(@CurrentUserId() userId: string, @Body() dto: { idType: string; fullName: string; documentNumber?: string; idImageUrl: string; selfieImageUrl: string }) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const result = await this.sellersService.submitKycVerified(seller.id, dto)
      return ApiResponseDto.ok(result, 'KYC Tier 2 submitted')
    } catch (error) {
      this.logger.error('Error submitting KYC Tier 2:', error)
      throw error
    }
  }

  @Post('kyc/submit-pro')
  @UseGuards(JwtAuthGuard)
  async submitKycPro(@CurrentUserId() userId: string, @Body() dto: { bankVerificationRef?: string; bankStatementImageUrl?: string }) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const result = await this.sellersService.submitKycPro(seller.id, dto)
      return ApiResponseDto.ok(result, 'KYC Tier 3 (Pro) submitted')
    } catch (error) {
      this.logger.error('Error submitting KYC Tier 3:', error)
      throw error
    }
  }

  @Post('kyc/submit-premium')
  @UseGuards(JwtAuthGuard)
  async submitKycPremium(@CurrentUserId() userId: string, @Body() dto: { addressProofImageUrl: string }) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const result = await this.sellersService.submitKycPremium(seller.id, dto)
      return ApiResponseDto.ok(result, 'KYC Tier 4 (Premium) submitted')
    } catch (error) {
      this.logger.error('Error submitting KYC Tier 4:', error)
      throw error
    }
  }

  @Get('kyc/status')
  @UseGuards(JwtAuthGuard)
  async getKycStatus(@CurrentUserId() userId: string) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const status = await this.sellersService.getKycStatus(seller.id)
      return ApiResponseDto.ok(status, 'KYC status retrieved')
    } catch (error) {
      this.logger.error('Error fetching KYC status:', error)
      throw error
    }
  }
}

