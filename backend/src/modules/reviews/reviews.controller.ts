import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/v1/reviews')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name)

  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createReview(@CurrentUserId() buyerId: string, @Body() dto: CreateReviewDto) {
    try {
      const review = await this.reviewsService.createReview(buyerId, dto)
      return ApiResponseDto.ok(review, 'Review created successfully')
    } catch (error) {
      this.logger.error('Error creating review:', error)
      throw error
    }
  }

  @Get('listing/:listingId')
  async getListingReviews(@Param('listingId') listingId: string, @Query('limit') limit?: number) {
    try {
      const reviews = await this.reviewsService.getListingReviews(listingId, limit)
      return ApiResponseDto.ok(reviews, 'Reviews retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching reviews:', error)
      throw error
    }
  }

  @Get('seller/:sellerId')
  async getSellerReviews(@Param('sellerId') sellerId: string, @Query('limit') limit?: number) {
    try {
      const reviews = await this.reviewsService.getSellerReviews(sellerId, limit)
      return ApiResponseDto.ok(reviews, 'Seller reviews retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching seller reviews:', error)
      throw error
    }
  }

  @Patch(':id/respond')
  @UseGuards(SupabaseJwtGuard)
  async respondToReview(
    @Param('id') reviewId: string,
    @CurrentUserId() sellerId: string,
    @Body('response') response: string,
  ) {
    try {
      const review = await this.reviewsService.respondToReview(reviewId, sellerId, response)
      return ApiResponseDto.ok(review, 'Response added successfully')
    } catch (error) {
      this.logger.error('Error responding to review:', error)
      throw error
    }
  }
}
