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
import { CreateSellerDto, UpdateSellerDto, UploadVerificationDocumentsDto } from './dto/create-seller.dto'
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
}
