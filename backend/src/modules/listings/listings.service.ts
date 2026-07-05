import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: string, dto: any) {
    return this.prisma.$transaction(async tx => {
      const listing = await tx.listings.create({ data: { ...dto, sellerId, status: 'PENDING_APPROVAL' } as any })
      return { success: true, data: listing }
    })
  }

  async findById(id: string) {
    const listing = await this.prisma.listings.findUnique({ where: { id } })
    if (!listing) throw new NotFoundException('Listing not found')
    return { success: true, data: { ...listing } }
  }

  async search(query: any) {
    const where: any = { status: 'ACTIVE' }
    if (query.gameName) where.gameName = { contains: query.gameName, mode: 'insensitive' }
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.region) where.region = query.region
    if (query.platform) where.platform = query.platform
    if (query.minPrice || query.maxPrice) where.price = {}
    if (query.minPrice) (where.price as any).gte = query.minPrice
    if (query.maxPrice) (where.price as any).lte = query.maxPrice

    const listings = await this.prisma.listings.findMany({ where, take: query.limit || 20, skip: query.offset || 0 })
    const total = await this.prisma.listings.count({ where })
    return { success: true, data: listings, meta: { total, limit: query.limit, offset: query.offset } }
  }
}
