import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class MarqueeService {
  private readonly logger = new Logger(MarqueeService.name)

  constructor(private prisma: PrismaService) {}

  async getActiveItems() {
    return this.prisma.marqueeItems.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getAllItems() {
    return this.prisma.marqueeItems.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }

  async createItem(data: {
    text: string
    linkHref?: string
    linkText?: string
    icon?: string
    color?: string
    isActive?: boolean
    sortOrder?: number
  }) {
    return this.prisma.marqueeItems.create({ data })
  }

  async updateItem(
    id: string,
    data: Partial<{
      text: string
      linkHref: string
      linkText: string
      icon: string
      color: string
      isActive: boolean
      sortOrder: number
    }>,
  ) {
    return this.prisma.marqueeItems.update({ where: { id }, data })
  }

  async deleteItem(id: string) {
    return this.prisma.marqueeItems.delete({ where: { id } })
  }
}
