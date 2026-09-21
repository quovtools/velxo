import { Controller, Get, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('stats')
export class StatsController {
  private readonly logger = new Logger(StatsController.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public, cache-friendly platform statistics used by the landing page,
   * auth pages and marketing copy. Aggregate-only — no user data leaks.
   */
  @Get('platform')
  async getPlatformStats() {
    try {
      const [
        totalUsers,
        totalSellers,
        verifiedSellers,
        totalListings,
        activeListings,
        soldListings,
        totalOrders,
        completedOrders,
        volume,
      ] = await Promise.all([
        this.prisma.users.count(),
        this.prisma.sellers.count(),
        this.prisma.sellers.count({ where: { isVerified: true } }),
        this.prisma.listings.count(),
        this.prisma.listings.count({ where: { status: 'ACTIVE' } }),
        this.prisma.listings.count({ where: { isSold: true } }),
        this.prisma.orders.count(),
        this.prisma.orders.count({ where: { status: 'COMPLETED' } }),
        this.prisma.orders.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: ['COMPLETED', 'DELIVERED'] } },
        }),
      ])

      return ApiResponseDto.ok(
        {
          totalUsers,
          totalSellers,
          verifiedSellers,
          totalListings,
          activeListings,
          soldListings,
          totalOrders,
          completedOrders,
          completedVolume: Number(volume._sum.totalAmount ?? 0),
          totalVolume: Number(volume._sum.totalAmount ?? 0),
        },
        'Platform statistics retrieved',
      )
    } catch (error) {
      this.logger.error('Error fetching platform stats:', error)
      throw error
    }
  }
}
