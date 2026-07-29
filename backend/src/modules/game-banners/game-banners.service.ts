import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class GameBannersService {
  constructor(private prisma: PrismaService) {}

  /** Public: returns all active banners ordered by sortOrder */
  async getActiveBanners() {
    return this.prisma.gameBanners.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { gameName: 'asc' }],
    })
  }

  /** Admin: returns all banners including inactive */
  async getAllBanners() {
    return this.prisma.gameBanners.findMany({
      orderBy: [{ sortOrder: 'asc' }, { gameName: 'asc' }],
    })
  }

  /** Admin: upsert banner by gameName (create or update) */
  async upsertBanner(data: {
    gameName: string
    gameSlug: string
    bannerUrl: string
    bannerKey?: string
    color?: string
    isActive?: boolean
    sortOrder?: number
  }) {
    return this.prisma.gameBanners.upsert({
      where: { gameName: data.gameName },
      create: data,
      update: {
        bannerUrl: data.bannerUrl,
        bannerKey: data.bannerKey,
        color: data.color,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    })
  }

  async updateBanner(
    id: string,
    data: Partial<{
      bannerUrl: string
      bannerKey: string
      color: string
      isActive: boolean
      sortOrder: number
    }>,
  ) {
    const banner = await this.prisma.gameBanners.findUnique({ where: { id } })
    if (!banner) throw new NotFoundException('Banner not found')
    return this.prisma.gameBanners.update({ where: { id }, data })
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.gameBanners.findUnique({ where: { id } })
    if (!banner) throw new NotFoundException('Banner not found')
    return this.prisma.gameBanners.delete({ where: { id } })
  }

  /** Lookup a single banner by game slug (used by listing detail pages) */
  async getBannerBySlug(gameSlug: string) {
    return this.prisma.gameBanners.findFirst({
      where: { gameSlug, isActive: true },
    })
  }
}
