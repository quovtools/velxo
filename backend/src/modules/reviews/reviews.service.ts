import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { NotFoundException, ForbiddenException, BadRequestException } from '@/common/exceptions/custom-exceptions'

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name)

  constructor(private prisma: PrismaService) {}

  async createReview(buyerId: string, dto: CreateReviewDto) {
    this.logger.log(`Creating review for order ${dto.orderId}`)

    const order = await this.prisma.orders.findUnique({
      where: { id: dto.orderId },
      include: { orderItems: true },
    })

    if (!order) {
      throw new NotFoundException('Order')
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can review this order')
    }

    if (order.status !== 'COMPLETED' && order.status !== 'DELIVERED') {
      throw new BadRequestException('You can only review a completed order')
    }

    // Check if review already exists
    const existingReview = await this.prisma.reviews.findFirst({
      where: { orderId: dto.orderId },
    })

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this order')
    }

    const listingId = order.orderItems[0]?.listingId
    if (!listingId) {
      throw new NotFoundException('Listing')
    }

    const review = await this.prisma.$transaction(async (tx) => {
      // Create review
      const newReview = await tx.reviews.create({
        data: {
          orderId: dto.orderId,
          listingId,
          buyerId,
          sellerId: order.sellerId,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: {
          buyer: true,
          seller: true,
        },
      })

      // Update seller average rating
      const allReviews = await tx.reviews.findMany({
        where: { sellerId: order.sellerId },
      })

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

      await tx.sellers.update({
        where: { id: order.sellerId },
        data: { averageRating: avgRating },
      })

      return newReview
    })

    return review
  }

  async getListingReviews(listingId: string, limit: number = 10) {
    return this.prisma.reviews.findMany({
      where: { listingId, isHidden: false },
      include: { buyer: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getSellerReviews(sellerId: string, limit: number = 50) {
    return this.prisma.reviews.findMany({
      where: { sellerId, isHidden: false },
      include: { buyer: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  // FIX: ensure fresh compile on deploy — `take: limit` is required by Prisma

  async respondToReview(reviewId: string, sellerId: string, response: string) {
    this.logger.log(`Adding seller response to review ${reviewId}`)

    const review = await this.prisma.reviews.findUnique({
      where: { id: reviewId },
      include: { seller: true },
    })

    if (!review) {
      throw new NotFoundException('Review')
    }

    if (review.seller?.userId !== sellerId) {
      throw new ForbiddenException('Only the seller can respond to this review')
    }

    return this.prisma.reviews.update({
      where: { id: reviewId },
      data: {
        sellerResponse: response,
        sellerRespondedAt: new Date(),
      },
    })
  }
}
