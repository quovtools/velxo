import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const totalUsers = await this.prisma.users.count()
    const totalOrders = await this.prisma.orders.count()
    const totalRevenue = await this.prisma.payments.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    })
    return {
      success: true,
      data: { totalUsers, totalOrders, totalRevenue: totalRevenue._sum.amount },
    }
  }

  async moderateListing(id: string, dto: any) {
    const listing = await this.prisma.listings.update({ where: { id }, data: { status: dto.status, moderationNotes: dto.notes } })
    return { success: true, data: listing }
  }
}
