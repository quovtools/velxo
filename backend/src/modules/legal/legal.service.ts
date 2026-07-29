import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

const PAGE_TYPES = ['terms', 'privacy', 'refund', 'cookies'] as const
type PageType = (typeof PAGE_TYPES)[number]

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  /** Public: get a published page by type */
  async getPublishedPage(pageType: string) {
    const page = await this.prisma.legalPages.findFirst({
      where: { pageType, isPublished: true },
    })
    if (!page) throw new NotFoundException(`Legal page '${pageType}' not found or not published`)
    return page
  }

  /** Admin: get all pages (published or not) */
  async getAllPages() {
    return this.prisma.legalPages.findMany({ orderBy: { pageType: 'asc' } })
  }

  /** Admin: get a single page by type regardless of publish state */
  async getPageByType(pageType: string) {
    return this.prisma.legalPages.findUnique({ where: { pageType } })
  }

  /** Admin: upsert a page */
  async upsertPage(data: {
    pageType: string
    title: string
    content: string
    version?: string
    isPublished?: boolean
  }) {
    const now = new Date()
    return this.prisma.legalPages.upsert({
      where: { pageType: data.pageType },
      create: {
        ...data,
        publishedAt: data.isPublished ? now : null,
      },
      update: {
        title: data.title,
        content: data.content,
        version: data.version,
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? now : null,
      },
    })
  }

  /** Admin: toggle publish state */
  async togglePublish(pageType: string, publish: boolean) {
    const page = await this.prisma.legalPages.findUnique({ where: { pageType } })
    if (!page) throw new NotFoundException(`Legal page '${pageType}' not found`)
    return this.prisma.legalPages.update({
      where: { pageType },
      data: { isPublished: publish, publishedAt: publish ? new Date() : null },
    })
  }
}
