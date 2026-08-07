import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException, InsufficientFundsException } from '@/common/exceptions/custom-exceptions'
import { Decimal } from '@prisma/client/runtime/library'
import { FlutterwaveService } from '@/modules/payments/flutterwave.service'
import { PaymentIoService } from '@/modules/payments/paymentio.service'

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)

  constructor(
    private prisma: PrismaService,
    private flutterwave: FlutterwaveService,
    private paymentIo: PaymentIoService,
  ) {}

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

  async topupInitiate(userId: string, amount: number, currency: string, provider: string) {
    // FIX C5: Wire to the actual payment provider so the buyer gets a real payment URL.
    // Previously this only created a HOLD record but never called the provider.
    if (!amount || amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than zero')
    }

    const wallet = await this.getOrCreateWallet(userId)
    const user = await this.prisma.users.findUnique({ where: { id: userId }, select: { email: true } })

    // Create a pending HOLD transaction so we have a reference ID before the external call.
    const txn = await this.prisma.walletTransactions.create({
      data: {
        walletId: wallet.id,
        type: 'HOLD',
        amount: new Decimal(amount),
        currency,
        balanceAfter: wallet.balance,
        description: 'Wallet top-up pending payment',
        relatedId: userId,
      },
    })

    // Build the return URL so the payment gateway can redirect back after payment.
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
    const callbackUrl = `${frontendUrl}/wallet?topup=${txn.id}`

    let paymentUrl: string | null = null
    let configured = false

    try {
      const upperProvider = provider?.toUpperCase()
      if (upperProvider === 'PAYMENT_IO') {
        const charge = await this.paymentIo.createCharge({
          reference: txn.id,
          amount,
          currency,
          callbackUrl,
        })
        paymentUrl = charge.paymentUrl
        configured = charge.configured
      } else {
        // Default to Flutterwave for bank/mobile-money top-ups.
        const charge = await this.flutterwave.createCharge({
          reference: txn.id,
          amount,
          currency,
          email: user?.email || 'user@piyrox.shop',
          callbackUrl,
        })
        paymentUrl = charge.paymentUrl
        configured = charge.configured
      }
    } catch (err: any) {
      this.logger.error(`Top-up provider error (${provider}):`, err?.message || err)
      // Non-fatal for sandbox — return the transactionId so the caller can poll status.
    }

    return { transactionId: txn.id, amount, currency, status: 'PENDING', paymentUrl, configured }
  }

  async topupStatus(txnId: string, userId: string) {
    const txn = await this.prisma.walletTransactions.findUnique({ where: { id: txnId } })
    if (!txn || txn.relatedId !== userId) return { status: 'UNKNOWN', balance: new Decimal(0) }
    const wallet = await this.prisma.wallet.findUnique({ where: { id: txn.walletId } })
    const status = txn.type === 'CREDIT' ? 'COMPLETED' : txn.type === 'HOLD' ? 'PENDING' : 'FAILED'
    return { status, balance: wallet?.balance ?? new Decimal(0), amount: txn.amount, currency: txn.currency }
  }

  async topupComplete(txnId: string, userId?: string) {
    const txn = await this.prisma.walletTransactions.findUnique({ where: { id: txnId } })
    if (!txn || txn.type !== 'HOLD') return false
    if (userId && txn.relatedId !== userId) return false
    const wallet = await this.prisma.wallet.findUnique({ where: { id: txn.walletId } })
    if (!wallet) return false
    const newBalance = wallet.balance.plus(txn.amount)
    await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
      this.prisma.walletTransactions.update({ where: { id: txnId }, data: { type: 'CREDIT', balanceAfter: newBalance } }),
    ])
    return true
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
          destination: destination ? { address: destination } : {},
          status: 'PENDING',
          netAmount: amount,
        },
      })

      return { balance: newBalance, totalWithdrawn: wallet.totalWithdrawn.plus(amount), withdrawalRequest }
    })
  }
}
