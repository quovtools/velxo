import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createIntent(userId: string, dto: any) {
    const payment = await this.prisma.payments.create({ data: { orderId: dto.orderId, provider: dto.provider || 'STRIPE', amount: dto.amount, currency: dto.currency || 'USD', status: 'PENDING' } })
    return { success: true, data: payment }
  }
}
