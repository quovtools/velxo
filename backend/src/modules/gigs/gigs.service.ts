import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { NotFoundException, ForbiddenException, BadRequestException } from '@/common/exceptions/custom-exceptions'
import { GigStatus } from '@prisma/client'

@Injectable()
export class GigsService {
  private readonly logger = new Logger(GigsService.name)

  constructor(private prisma: PrismaService, private ordersService: OrdersService) {}

  async getPublicGigs(filters: { gameName?: string; accountType?: string; search?: string }) {
    return this.prisma.gigs.findMany({
      where: {
        status: 'ACTIVE' as GigStatus,
        isActive: true,
        ...(filters.gameName ? { gameName: filters.gameName } : {}),
        ...(filters.accountType ? { accountType: filters.accountType } : {}),
        ...(filters.search
          ? { OR: [{ title: { contains: filters.search, mode: 'insensitive' } }, { description: { contains: filters.search, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { seller: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
    })
  }

  async getGigById(id: string) {
    const gig = await this.prisma.gigs.findUnique({
      where: { id },
      include: { seller: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
    })
    if (!gig) throw new NotFoundException('Gig')
    return gig
  }

  async getMyGigs(sellerId: string) {
    return this.prisma.gigs.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createGig(sellerId: string, dto: any) {
    const seller = await this.prisma.sellers.findUnique({ where: { id: sellerId } })
    if (!seller) throw new NotFoundException('Seller')

    const gig = await this.prisma.$transaction(async (tx) => {
      // Mark the seller as a booster so they can be surfaced for gig work.
      const newAccountType = seller.accountType === 'BOTH' ? 'BOTH' : 'BOOSTER'
      await tx.sellers.update({
        where: { id: sellerId },
        data: { accountType: newAccountType },
      })

      return tx.gigs.create({
        data: {
          sellerId,
          title: dto.title,
          description: dto.description,
          gameName: dto.gameName,
          rankFrom: dto.rankFrom,
          rankTo: dto.rankTo,
          platform: dto.platform,
          region: dto.region,
          accountType: dto.accountType || 'RANK_BOOST',
          price: dto.price,
          currency: dto.currency || 'USD',
          deliveryTime: dto.deliveryTime,
          imageUrl: dto.imageUrl,
          status: 'PENDING_APPROVAL' as GigStatus,
          isActive: true,
        },
      })
    })

    return gig
  }

  async updateGig(id: string, sellerId: string, dto: any) {
    const gig = await this.getGigById(id)
    if (gig.sellerId !== sellerId) throw new ForbiddenException('You can only edit your own gigs')

    const { isActive, ...rest } = dto
    return this.prisma.gigs.update({
      where: { id },
      data: { ...rest, ...(isActive !== undefined ? { isActive } : {}) },
    })
  }

  async deleteGig(id: string, sellerId: string) {
    const gig = await this.getGigById(id)
    if (gig.sellerId !== sellerId) throw new ForbiddenException('You can only delete your own gigs')
    return this.prisma.gigs.delete({ where: { id } })
  }

  async getAllGigsAdmin(filters: { status?: string; gameName?: string }) {
    return this.prisma.gigs.findMany({
      where: {
        ...(filters.status ? { status: filters.status as GigStatus } : {}),
        ...(filters.gameName ? { gameName: filters.gameName } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { seller: { include: { user: { select: { email: true, firstName: true, lastName: true } } } } },
    })
  }

  async reviewGig(id: string, status: GigStatus, rejectionReason?: string) {
    await this.getGigById(id)
    return this.prisma.gigs.update({
      where: { id },
      data: { status, rejectionReason: status === 'REJECTED' ? rejectionReason : null },
    })
  }

  async adminDeleteGig(id: string) {
    return this.prisma.gigs.delete({ where: { id } })
  }

  async purchase(gigId: string, buyerId: string, quantity: number, buyerNote?: string) {
    const gig = await this.getGigById(gigId)
    if (!gig.isActive || gig.status !== ('ACTIVE' as GigStatus)) {
      throw new BadRequestException('This gig is not available for purchase')
    }

    return this.ordersService.createServiceOrder(buyerId, {
      sellerId: gig.sellerId,
      title: gig.title,
      price: Number(gig.price),
      currency: gig.currency,
      quantity: quantity && quantity > 0 ? quantity : 1,
      buyerNote,
      sourceType: 'GIG',
      sourceId: gig.id,
    })
  }
}
