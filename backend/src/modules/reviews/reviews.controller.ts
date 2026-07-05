import { Controller, Get, Post, UseGuards, Body, Request } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: any) {
    return this.reviewsService.create(req.user.sub, dto)
  }

  @Get('listing/:listingId')
  findByListing(@Param('listingId') listingId: string) {
    return this.reviewsService.findByListing(listingId)
  }
}
