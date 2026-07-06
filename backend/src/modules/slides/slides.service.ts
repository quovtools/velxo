import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateSlideDto } from './dto/create-slide.dto'

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

  async createSlide(dto: CreateSlideDto) {
    this.logger.log(`Creating slide: ${dto.title}`)
    return this.prisma.gameSlides.create({ data: dto })
  }

  async updateSlide(id: string, dto: Partial<CreateSlideDto>) {
    this.logger.log(`Updating slide: ${id}`)
    return this.prisma.gameSlides.update({ where: { id }, data: dto })
  }

  async deleteSlide(id: string) {
    this.logger.log(`Deleting slide: ${id}`)
    return this.prisma.gameSlides.delete({ where: { id } })
  }

  async reorderSlides(ids: string[]) {
    const updates = ids.map((id, index) =>
      this.prisma.gameSlides.update({ where: { id }, data: { sortOrder: index } }),
    )
    return this.prisma.$transaction(updates)
  }
}
