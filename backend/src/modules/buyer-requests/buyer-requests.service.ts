import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class BuyerRequestsService {
  constructor(private prisma: PrismaService) {}

  /** Public: paginated list of open requests, optionally filtered by game */
  async getOpenRequests(opts: {
    gameName?: string
    limit?: number
    offset?: number
  }) {
    const where: any = { status: 'OPEN' }
    if (opts.gameName) where.gameName = opts.gameName
    const [items, total] = await Promise.all([
      this.prisma.buyerRequests.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: opts.limit ?? 20,
        skip: opts.offset ?? 0,
        include: {
          buyer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.buyerRequests.count({ where }),
    ])
    return { items, total }
  }

  /** Create a new buyer request */
  async createRequest(
    buyerId: string,
    data: {
      gameName: string
      gameSlug?: string
      title: string
      description: string
      budget?: number
      currency?: string
      region?: string
      platform?: string
      rank?: string
    },
  ) {
    // Expire in 30 days by default
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    return this.prisma.buyerRequests.create({
      data: {
        buyerId,
        ...data,
        expiresAt,
      },
    })
  }

  /** Close / delete own request */
  async closeRequest(id: string, buyerId: string) {
    const req = await this.prisma.buyerRequests.findUnique({ where: { id } })
    if (!req) throw new NotFoundException('Request not found')
    if (req.buyerId !== buyerId) throw new ForbiddenException('Not your request')
    return this.prisma.buyerRequests.update({
      where: { id },
      data: { status: 'CLOSED' },
    })
  }

  /** Buyer: list own requests */
  async getMyRequests(buyerId: string) {
    return this.prisma.buyerRequests.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
