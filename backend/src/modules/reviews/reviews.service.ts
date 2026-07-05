import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: string, dto: any) {
    const review = await this.prisma.reviews.create({
      data: { ...dto, buyerId, sellerId: dto.sellerId },
    })
    return { success: true, data: review }
  }

  async findByListing(listingId: string) {
    const reviews = await this.prisma.reviews.findMany({
      where: { order: { orderItems: { some: { listingId } } } },
      include: { buyer: true },
    })
    return { success: true, data: reviews }
  }
}
