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

  // ============ BULK OPERATIONS ============

  /**
   * Bulk create slides from array
   */
  async bulkCreateSlides(
    slides: Array<{
      title: string
      subtitle?: string
      imageUrl: string
      linkHref?: string
      badge?: string
      isActive?: boolean
      sortOrder: number
    }>,
  ) {
    this.logger.log(`Bulk creating ${slides.length} slides`)

    const created = await Promise.allSettled(
      slides.map(slide => this.createSlide(slide)),
    )

    const successful = created.filter(r => r.status === 'fulfilled').length
    const failed = created.filter(r => r.status === 'rejected').length

    return { successful, failed, total: slides.length }
  }

  /**
   * Bulk update slides status (active/inactive)
   */
  async bulkUpdateSlidesStatus(slideIds: string[], isActive: boolean) {
    this.logger.log(`Bulk updating ${slideIds.length} slides to isActive: ${isActive}`)

    const result = await this.prisma.gameSlides.updateMany({
      where: { id: { in: slideIds } },
      data: { isActive },
    })

    return { updated: result.count, total: slideIds.length, isActive }
  }

  /**
   * Bulk delete slides
   */
  async bulkDeleteSlides(slideIds: string[]) {
    this.logger.log(`Bulk deleting ${slideIds.length} slides`)

    const result = await this.prisma.gameSlides.deleteMany({
      where: { id: { in: slideIds } },
    })

    return { deleted: result.count, total: slideIds.length }
  }

  /**
   * Bulk update slide image URLs
   */
  async bulkUpdateSlidesImages(
    updates: Array<{ slideId: string; imageUrl: string }>,
  ) {
    this.logger.log(`Bulk updating images for ${updates.length} slides`)

    const results = await Promise.allSettled(
      updates.map(({ slideId, imageUrl }) =>
        this.updateSlide(slideId, { imageUrl }),
      ),
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { successful, failed, total: updates.length }
  }

  /**
   * Reorder slides (update sortOrder for multiple slides)
   */
  async reorderSlides(
    updates: Array<{ slideId: string; sortOrder: number }>,
  ) {
    this.logger.log(`Reordering ${updates.length} slides`)

    const results = await Promise.allSettled(
      updates.map(({ slideId, sortOrder }) =>
        this.updateSlide(slideId, { sortOrder }),
      ),
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { successful, failed, total: updates.length }
  }

  /**
   * Get all slides for bulk editing
   */
  async getSlidesForBulkEdit() {
    return this.prisma.gameSlides.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        linkHref: true,
        badge: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
      },
    })
  }
}
