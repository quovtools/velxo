import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, BadRequestException } from '@/common/exceptions/custom-exceptions'

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name)

  constructor(private prisma: PrismaService) {}

  async getCoinBalance(userId: string) {
    return this.prisma.velxoCoins.upsert({
      where: { userId },
      create: { userId, balance: 0, currency: 'VXC' },
      update: {},
    })
  }

  async getTransactions(userId: string, limit = 50) {
    const coins = await this.prisma.velxoCoins.upsert({
      where: { userId },
      create: { userId, balance: 0, currency: 'VXC' },
      update: {},
    })

    return this.prisma.rewardCoinTransactions.findMany({
      where: { coinId: coins.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getCatalog() {
    return this.prisma.rewardCatalog.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async creditCoins(userId: string, amount: number, type: string, description: string, relatedId?: string) {
    this.logger.log(`Crediting ${amount} coins to user ${userId}`)

    return await this.prisma.$transaction(async (tx) => {
      const coins = await tx.velxoCoins.upsert({
        where: { userId },
        create: { userId, balance: 0, currency: 'VXC' },
        update: {},
      })

      const newBalance = coins.balance + amount

      await tx.velxoCoins.update({
        where: { userId },
        data: { balance: newBalance },
      })

      await tx.rewardCoinTransactions.create({
        data: {
          coinId: coins.id,
          type,
          amount,
          balanceAfter: newBalance,
          description,
          relatedId,
        },
      })

      return newBalance
    })
  }

  async debitCoins(userId: string, amount: number, description: string, relatedId?: string) {
    this.logger.log(`Debiting ${amount} coins from user ${userId}`)

    return await this.prisma.$transaction(async (tx) => {
      const coins = await tx.velxoCoins.findUnique({ where: { userId } })
      if (!coins) {
        throw new NotFoundException('Velxo Coins wallet')
      }

      if (coins.balance < amount) {
        throw new BadRequestException('Insufficient Velxo Coins')
      }

      const newBalance = coins.balance - amount

      await tx.velxoCoins.update({
        where: { userId },
        data: { balance: newBalance },
      })

      await tx.rewardCoinTransactions.create({
        data: {
          coinId: coins.id,
          type: 'DEBIT',
          amount,
          balanceAfter: newBalance,
          description,
          relatedId,
        },
      })

      return newBalance
    })
  }

  async redeem(userId: string, catalogId: string) {
    const catalogItem = await this.prisma.rewardCatalog.findUnique({ where: { id: catalogId } })
    if (!catalogItem || !catalogItem.isActive) {
      throw new NotFoundException('Reward item')
    }

    const coins = await this.prisma.velxoCoins.findUnique({ where: { userId } })
    if (!coins || coins.balance < catalogItem.coinCost) {
      throw new BadRequestException('Insufficient Velxo Coins')
    }

    const redemption = await this.prisma.$transaction(async (tx) => {
      const newBalance = coins.balance - catalogItem.coinCost

      await tx.velxoCoins.update({
        where: { userId },
        data: { balance: newBalance },
      })

      await tx.rewardCoinTransactions.create({
        data: {
          coinId: coins.id,
          type: 'DEBIT',
          amount: catalogItem.coinCost,
          balanceAfter: newBalance,
          description: `Redeemed: ${catalogItem.name}`,
        },
      })

      const red = await tx.rewardRedemptions.create({
        data: {
          userId,
          catalogId,
          coinCost: catalogItem.coinCost,
          status: 'PENDING',
        },
      })

      return red
    })

    return redemption
  }
}
