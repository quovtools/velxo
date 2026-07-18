import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, InsufficientFundsException } from '@/common/exceptions/custom-exceptions'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)

  constructor(private prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: new Decimal(0),
          currency: 'USD',
        },
      })
    }

    return wallet
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException('Wallet')
    }

    return wallet
  }

  async creditBalance(userId: string, amount: Decimal, description: string, relatedId?: string) {
    this.logger.log(`Crediting ${amount} to user ${userId}`)

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new NotFoundException('Wallet')
      }

      const newBalance = wallet.balance.plus(amount)

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          totalEarnings: wallet.totalEarnings.plus(amount),
        },
      })

      await tx.walletTransactions.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount,
          currency: wallet.currency,
          balanceAfter: newBalance,
          description,
          relatedId,
        },
      })

      return newBalance
    })
  }

  async debitBalance(userId: string, amount: Decimal, description: string, relatedId?: string) {
    this.logger.log(`Debiting ${amount} from user ${userId}`)

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new NotFoundException('Wallet')
      }

      if (wallet.balance.lessThan(amount)) {
        throw new InsufficientFundsException('Insufficient wallet balance')
      }

      const newBalance = wallet.balance.minus(amount)

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: newBalance,
        },
      })

      await tx.walletTransactions.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          currency: wallet.currency,
          balanceAfter: newBalance,
          description,
          relatedId,
        },
      })

      return newBalance
    })
  }

  async getTransactionHistory(userId: string, limit: number = 50) {
    const wallet = await this.getWalletBalance(userId)

    return this.prisma.walletTransactions.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async withdraw(
    userId: string,
    amount: Decimal,
    method: string,
    destination: string,
  ) {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Withdrawal amount must be greater than zero')
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new NotFoundException('Wallet')
      }

      if (wallet.balance.lessThan(amount)) {
        throw new InsufficientFundsException('Insufficient wallet balance')
      }

      // Find the seller record for this user (withdrawals are seller-scoped)
      const seller = await tx.sellers.findUnique({ where: { userId } })
      if (!seller) {
        throw new NotFoundException('Seller profile — only sellers can withdraw')
      }

      const newBalance = wallet.balance.minus(amount)

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          totalWithdrawn: wallet.totalWithdrawn.plus(amount),
        },
      })

      await tx.walletTransactions.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          currency: wallet.currency,
          balanceAfter: newBalance,
          description: `Withdrawal via ${method}${destination ? ` (${destination})` : ''}`,
        },
      })

      // FIX #8: Create a WithdrawalRequest so the admin approval flow has
      // something to process. Previously the record was never created.
      const withdrawalRequest = await tx.withdrawalRequests.create({
        data: {
          sellerId: seller.id,
          amount,
          currency: wallet.currency,
          method,
          destination,
          status: 'PENDING',
        },
      })

      return { balance: newBalance, totalWithdrawn: wallet.totalWithdrawn.plus(amount), withdrawalRequest }
    })
  }
}
