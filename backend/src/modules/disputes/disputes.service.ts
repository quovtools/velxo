import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(initiatedById: string, dto: any) {
    const dispute = await this.prisma.disputes.create({ data: { ...dto, initiatedById, orderId: dto.orderId } })
    return { success: true, data: dispute }
  }

  async findByOrder(orderId: string) {
    const dispute = await this.prisma.disputes.findFirst({ where: { orderId } })
    if (!dispute) throw new NotFoundException('Dispute not found')
    return { success: true, data: dispute }
  }
}
