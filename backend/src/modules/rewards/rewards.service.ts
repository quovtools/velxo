import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, BadRequestException } from '@/common/exceptions/custom-exceptions'

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name)

  constructor(private prisma: PrismaService) {}

  async getCoinBalance(userId: string) {
    return this.prisma.piyroxCoins.upsert({
      where: { userId },
      create: { userId, balance: 0, currency: 'VXC' },
      update: {},
    })
  }

  async getTransactions(userId: string, limit = 50) {
    const coins = await this.prisma.piyroxCoins.upsert({
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
      const coins = await tx.piyroxCoins.upsert({
        where: { userId },
        create: { userId, balance: 0, currency: 'VXC' },
        update: {},
      })

      const newBalance = coins.balance + amount

      await tx.piyroxCoins.update({
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
      const coins = await tx.piyroxCoins.findUnique({ where: { userId } })
      if (!coins) {
        throw new NotFoundException('Piyrox Coins wallet')
      }

      if (coins.balance < amount) {
      throw new BadRequestException('Insufficient Piyrox Coins')
      }

      const newBalance = coins.balance - amount

      await tx.piyroxCoins.update({
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

    const coins = await this.prisma.piyroxCoins.findUnique({ where: { userId } })
    if (!coins || coins.balance < catalogItem.coinCost) {
      throw new BadRequestException('Insufficient Piyrox Coins')
    }

    const redemption = await this.prisma.$transaction(async (tx) => {
      const newBalance = coins.balance - catalogItem.coinCost

      await tx.piyroxCoins.update({
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

  // ─────────────────────────────────────────────────
  //  ADMIN — Catalog management
  // ─────────────────────────────────────────────────

  async adminListCatalog() {
    return this.prisma.rewardCatalog.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { redemptions: true } } },
    })
  }

  async adminCreateCatalogItem(dto: {
    name: string
    description?: string
    type: string
    coinCost: number
    imageUrl?: string
    isActive?: boolean
    sortOrder?: number
    metadata?: Record<string, unknown>
  }) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required')
    }
    if (!dto.type?.trim()) {
      throw new BadRequestException('type is required')
    }
    if (!(dto.coinCost > 0)) {
      throw new BadRequestException('coinCost must be greater than 0')
    }
    return this.prisma.rewardCatalog.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        type: dto.type.trim().toUpperCase(),
        coinCost: Math.round(dto.coinCost),
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        metadata: dto.metadata as any,
      },
    })
  }

  async adminUpdateCatalogItem(
    id: string,
    dto: Partial<{
      name: string
      description: string | null
      type: string
      coinCost: number
      imageUrl: string | null
      isActive: boolean
      sortOrder: number
      metadata: Record<string, unknown> | null
    }>,
  ) {
    const existing = await this.prisma.rewardCatalog.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException('Reward item')
    }
    if (dto.coinCost !== undefined && !(dto.coinCost > 0)) {
      throw new BadRequestException('coinCost must be greater than 0')
    }
    return this.prisma.rewardCatalog.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.type !== undefined ? { type: dto.type.trim().toUpperCase() } : {}),
        ...(dto.coinCost !== undefined ? { coinCost: Math.round(dto.coinCost) } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata as any } : {}),
      },
    })
  }

  async adminDeleteCatalogItem(id: string) {
    const existing = await this.prisma.rewardCatalog.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    })
    if (!existing) {
      throw new NotFoundException('Reward item')
    }
    if (existing._count.redemptions > 0) {
      // Keep redemption history intact — just deactivate.
      return this.prisma.rewardCatalog.update({
        where: { id },
        data: { isActive: false },
      })
    }
    return this.prisma.rewardCatalog.delete({ where: { id } })
  }

  async adminListRedemptions(status?: string, limit = 100) {
    return this.prisma.rewardRedemptions.findMany({
      where: status ? { status: status.toUpperCase() } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        catalogItem: { select: { id: true, name: true, type: true } },
      },
    })
  }

  async adminUpdateRedemption(
    id: string,
    status: string,
    processedBy?: string,
    note?: string,
  ) {
    const existing = await this.prisma.rewardRedemptions.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException('Redemption')
    }
    const normalized = status.toUpperCase()
    if (!['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(normalized)) {
      throw new BadRequestException('Invalid status')
    }
    return this.prisma.rewardRedemptions.update({
      where: { id },
      data: {
        status: normalized,
        processedBy,
        completedAt: normalized === 'COMPLETED' ? new Date() : existing.completedAt,
        ...(note !== undefined
          ? { metadata: { ...(existing.metadata as object), adminNote: note } }
          : {}),
      },
    })
  }
}
