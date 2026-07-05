import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class EscrowService {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    const order = await this.prisma.orders.findUnique({ where: { id: orderId }, include: { escrow: true } })
    if (!order || !order.escrow) throw new NotFoundException('Escrow not found')
    return { success: true, data: order.escrow }
  }

  async release(orderId: string) {
    return this.prisma.$transaction(async tx => {
      const escrow = await tx.escrowTransactions.findUnique({ where: { orderId } })
      if (!escrow) throw new NotFoundException('Escrow not found')
      if (escrow.status !== 'HELD') throw new BadRequestException('Escrow is not in HELD state')

      const updatedEscrow = await tx.escrowTransactions.update({
        where: { orderId },
        data: { status: 'RELEASED', releasedAt: new Date() },
      })

      const order = await tx.orders.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })

      return { success: true, data: { escrow: updatedEscrow, order } }
    })
  }
}
