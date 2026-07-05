import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: string, dto: any) {
    return this.prisma.$transaction(async tx => {
      const listing = await tx.listings.findUnique({ where: { id: dto.listingId } })
      if (!listing) throw new NotFoundException('Listing not found')
      if (listing.status !== 'ACTIVE') throw new BadRequestException('Listing is not available')

      const price = listing.price
      const commissionRate = new Decimal('0.10')
      const commissionAmount = price.mul(commissionRate)
      const sellerPayout = price.sub(commissionAmount)

      const order = await tx.orders.create({
        data: {
          buyerId,
          sellerId: listing.sellerId,
          totalAmount: price,
          subtotal: price,
          commissionRate,
          commissionAmount,
          sellerPayout,
          currency: listing.currency,
          status: 'PENDING',
        },
      })

      await tx.orderItems.create({
        data: { orderId: order.id, listingId: listing.id, quantity: 1, unitPrice: price, totalPrice: price },
      })

      await tx.escrowTransactions.create({
        data: { orderId: order.id, amount: price, currency: listing.currency, status: 'HELD' },
      })

      return { success: true, data: order }
    })
  }

  async findById(id: string) {
    const order = await this.prisma.orders.findUnique({ where: { id }, include: { orderItems: true, escrow: true } })
    if (!order) throw new NotFoundException('Order not found')
    return { success: true, data: order }
  }

  async findByUser(userId: string) {
    const orders = await this.prisma.orders.findMany({ where: { buyerId: userId }, take: 50, orderBy: { createdAt: 'desc' } })
    return { success: true, data: orders }
  }
}
