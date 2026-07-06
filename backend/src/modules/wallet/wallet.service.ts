import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new NotFoundException('Wallet not found')
    return { success: true, data: wallet }
  }

  async requestWithdrawal(userId: string, dto: any) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < dto.amount) throw new NotFoundException('Insufficient balance')
    const withdrawal = await this.prisma.withdrawalRequests.create({ data: { ...dto, sellerId: userId, netAmount: dto.amount } })
    const balanceAfter = this.prisma.Prisma.Decimal(wallet.balance).minus(new this.prisma.Prisma.Decimal(dto.amount))
    await this.prisma.walletTransactions.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount: dto.amount,
        description: 'Withdrawal',
        relatedId: withdrawal.id,
        balanceAfter,
      },
    })
    return { success: true, data: withdrawal }
  }
}
