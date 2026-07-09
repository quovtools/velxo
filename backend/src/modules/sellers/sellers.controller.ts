import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common'
import { SellersService } from './sellers.service'
import { CreateSellerDto, UpdateSellerDto, UploadVerificationDocumentsDto, SubmitKycDto } from './dto/create-seller.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('sellers')
export class SellersController {
  private readonly logger = new Logger(SellersController.name)

  constructor(private sellersService: SellersService) {}

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createSeller(@CurrentUserId() userId: string, @Body() dto: CreateSellerDto) {
    try {
      const seller = await this.sellersService.createSeller(userId, dto)
      return ApiResponseDto.ok(seller, 'Seller account created successfully')
    } catch (error) {
      this.logger.error('Error creating seller:', error)
      throw error
    }
  }

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  async getMyProfile(@CurrentUserId() userId: string) {
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
      const sellers = await this.sellersService.getTopSellers(limit)
      return ApiResponseDto.ok(sellers, 'Top sellers retrieved')
    } catch (error) {
      this.logger.error('Error fetching top sellers:', error)
      throw error
    }
  }

  @Get(':id')
  async getSellerProfile(@Param('id') sellerId: string) {
    try {
      const seller = await this.sellersService.getSellerProfile(sellerId)
      return ApiResponseDto.ok(seller, 'Seller profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller profile:', error)
      throw error
    }
  }

  @Post(':id/report')
  @UseGuards(SupabaseJwtGuard)
  async reportSeller(
    @Param('id') sellerId: string,
    @CurrentUserId() reporterId: string,
    @Body('reason') reason: string,
    @Body('details') details?: string,
  ) {
    try {
      const result = await this.sellersService.reportSeller(sellerId, reporterId, reason, details)
      return ApiResponseDto.ok(result, 'Report submitted successfully')
    } catch (error) {
      this.logger.error('Error reporting seller:', error)
      throw error
    }
  }

  @Patch('me')
  @UseGuards(SupabaseJwtGuard)
  async updateProfile(@CurrentUserId() userId: string, @Body() dto: UpdateSellerDto) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const updated = await this.sellersService.updateSeller(seller.id, dto)
      return ApiResponseDto.ok(updated, 'Seller profile updated')
    } catch (error) {
      this.logger.error('Error updating seller:', error)
      throw error
    }
  }

  @Post('verification-documents')
  @UseGuards(SupabaseJwtGuard)
  async uploadDocuments(
    @CurrentUserId() userId: string,
    @Body() documents: UploadVerificationDocumentsDto[],
  ) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const updated = await this.sellersService.uploadVerificationDocuments(seller.id, documents)
      return ApiResponseDto.ok(updated, 'Documents uploaded successfully')
    } catch (error) {
      this.logger.error('Error uploading documents:', error)
      throw error
    }
  }

  @Post('kyc/submit')
  @UseGuards(SupabaseJwtGuard)
  async submitKyc(
    @CurrentUserId() userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const updated = await this.sellersService.submitKyc(seller.id, dto)
      return ApiResponseDto.ok(updated, 'KYC submitted successfully')
    } catch (error) {
      this.logger.error('Error submitting KYC:', error)
      throw error
    }
  }

  @Patch('settings')
  @UseGuards(SupabaseJwtGuard)
  async updateSettings(
    @CurrentUserId() userId: string,
    @Body() dto: { storeName?: string; storeDescription?: string; responseTime?: number },
  ) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const updated = await this.sellersService.updateSeller(seller.id, {
        storeName: dto.storeName,
        storeDescription: dto.storeDescription,
        responseTime: dto.responseTime,
      })
      return ApiResponseDto.ok(updated, 'Seller settings updated')
    } catch (error) {
      this.logger.error('Error updating seller settings:', error)
      throw error
    }
  }

  @Get(':id/store')
  async getPublicStore(@Param('id') id: string) {
    try {
      const store = await this.sellersService.getPublicStore(id)
      return ApiResponseDto.ok(store, 'Store retrieved')
    } catch (error) {
      this.logger.error('Error fetching public store:', error)
      throw error
    }
  }

  @Get('subscription/plans')
  async getPlans() {
    try {
      return ApiResponseDto.ok(this.sellersService.getPlans(), 'Subscription plans')
    } catch (error) {
      this.logger.error('Error fetching plans:', error)
      throw error
    }
  }

  @Get('subscription/me')
  @UseGuards(SupabaseJwtGuard)
  async getMySubscription(@CurrentUserId() userId: string) {
    try {
      const sub = await this.sellersService.getMySubscription(userId)
      return ApiResponseDto.ok(sub, 'Subscription status retrieved')
    } catch (error) {
      this.logger.error('Error fetching subscription:', error)
      throw error
    }
  }

  @Post('subscription/checkout')
  @UseGuards(SupabaseJwtGuard)
  async checkout(
    @CurrentUserId() userId: string,
    @Body('plan') plan: string,
    @Body('provider') provider?: string,
    @Body('callbackUrl') callbackUrl?: string,
  ) {
    try {
      const result = await this.sellersService.createSubscription(
        userId,
        plan,
        provider || 'PAYMENT_IO',
        callbackUrl,
      )
      return ApiResponseDto.ok(result, 'Subscription checkout created')
    } catch (error) {
      this.logger.error('Error creating subscription checkout:', error)
      throw error
    }
  }

  @Post('subscribe')
  @UseGuards(SupabaseJwtGuard)
  async subscribe(
    @CurrentUserId() userId: string,
    @Body('plan') plan: string,
    @Body('durationMonths') durationMonths?: number,
  ) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const updated = await this.sellersService.subscribe(seller.id, plan, durationMonths || 1)
      return ApiResponseDto.ok(updated, `Subscribed to ${plan}`)
    } catch (error) {
      this.logger.error('Error subscribing seller:', error)
      throw error
    }
  }

  @Patch('response-time')
  @UseGuards(SupabaseJwtGuard)
  async updateResponseTime(@CurrentUserId() userId: string, @Body('responseTime') responseTime: number) {
    try {
      const seller = await this.sellersService.getSellerByUserId(userId)
      const updated = await this.sellersService.updateSeller(seller.id, { responseTime })
      return ApiResponseDto.ok(updated, 'Response time updated')
    } catch (error) {
      this.logger.error('Error updating response time:', error)
      throw error
    }
  }
}
