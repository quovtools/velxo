import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { ListingsService } from './listings.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { SearchListingDto } from './dto/search-listing.dto'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('listings')
export class ListingsController {
  private readonly logger = new Logger(ListingsController.name)

  constructor(private listingsService: ListingsService) {}

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createListing(@CurrentUserId() userId: string, @Body() dto: CreateListingDto) {
    try {
      const listing = await this.listingsService.createListing(userId, dto)
      return ApiResponseDto.ok(listing, 'Listing created successfully')
    } catch (error) {
      this.logger.error('Error creating listing:', error)
      throw error
    }
  }

  @Get()
  async searchListings(@Query() dto: SearchListingDto) {
    try {
      const result = await this.listingsService.searchListings(dto)
      return ApiResponseDto.ok(result, 'Listings retrieved successfully')
    } catch (error) {
      this.logger.error('Error searching listings:', error)
      throw error
    }
  }

  @Get('featured')
  async getFeaturedListings(@Query('limit') limit?: number) {
    try {
      const listings = await this.listingsService.getFeaturedListings(limit)
      return ApiResponseDto.ok(listings, 'Featured listings retrieved')
    } catch (error) {
      this.logger.error('Error fetching featured listings:', error)
      throw error
    }
  }

  // FIX C7: market-stats MUST appear before :id so NestJS routes the literal
  // path "market-stats" correctly and doesn't swallow it as a listing ID.
  @Get('market-stats')
  async getMarketStats(@Query('gameId') gameId: string, @Query('rank') rank?: string, @Query('platform') platform?: string) {
    try {
      const result = await this.listingsService.getMarketStats(gameId, rank, platform)
      return ApiResponseDto.ok(result, 'Market stats retrieved')
    } catch (error) {
      this.logger.error('Error fetching market stats:', error)
      throw error
    }
  }

  @Get(':id')
  async getListingById(@Param('id') id: string) {
    try {
      const listing = await this.listingsService.getListingById(id)
      return ApiResponseDto.ok(listing, 'Listing retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching listing:', error)
      throw error
    }
  }

  @Post('estimate-value')
  async estimateValue(@Body() dto: { gameId: string; rank: string; level: number; skins: number | any[]; platform: string; hasElitePass?: boolean; hasBattlePass?: boolean }) {
    try {
      const result = await this.listingsService.estimateAccountValue(dto)
      return ApiResponseDto.ok(result, 'Value estimated successfully')
    } catch (error) {
      this.logger.error('Error estimating value:', error)
      throw error
    }
  }

  @Patch(':id')
  @UseGuards(SupabaseJwtGuard)
  async updateListing(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: Partial<CreateListingDto>,
  ) {
    try {
      const listing = await this.listingsService.updateListing(id, userId, dto)
      return ApiResponseDto.ok(listing, 'Listing updated successfully')
    } catch (error) {
      this.logger.error('Error updating listing:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(SupabaseJwtGuard)
  async deleteListing(@Param('id') id: string, @CurrentUserId() userId: string) {
    try {
      await this.listingsService.deleteListing(id, userId)
      return ApiResponseDto.ok(null, 'Listing deleted successfully')
    } catch (error) {
      this.logger.error('Error deleting listing:', error)
      throw error
    }
  }
}
