import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class SlidesService {
  private readonly logger = new Logger(SlidesService.name)

  constructor(private prisma: PrismaService) {}

  async getActiveSlides() {
    return this.prisma.gameSlides.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getAllSlides() {
    return this.prisma.gameSlides.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }

  async createSlide(data: {
    title: string
    subtitle?: string
    imageUrl: string
    linkHref?: string
    badge?: string
    isActive?: boolean
    sortOrder?: number
  }) {
    return this.prisma.gameSlides.create({ data })
  }

  async updateSlide(
    id: string,
    data: Partial<{
      title: string
      subtitle: string
      imageUrl: string
      linkHref: string
      badge: string
      isActive: boolean
      sortOrder: number
    }>,
  ) {
    return this.prisma.gameSlides.update({ where: { id }, data })
  }

  async deleteSlide(id: string) {
    return this.prisma.gameSlides.delete({ where: { id } })
  }
}
