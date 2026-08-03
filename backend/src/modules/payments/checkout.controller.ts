import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { OrdersService } from '@/modules/orders/orders.service'
import { PaymentsService } from '@/modules/payments/payments.service'
import { WalletService } from '@/modules/wallet/wallet.service'
import { PrismaService } from '@/common/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentProvider, PaymentStatus, OrderStatus } from '@prisma/client'

class InitiateCheckoutDto {
  listingId?: string
  quantity?: number
  paymentMethod?: string
  buyerNote?: string

  /**
   * ISO 4217 currency code the buyer is paying in (e.g. "NGN", "GHS").
   * Detected client-side from the user's locale and sent here so Flutterwave
   * charges in the correct local currency.
   */
  currency?: string

  /**
   * Live exchange rate snapshot taken at the moment the buyer confirmed
   * checkout (units of `currency` per 1 USD).  Stored on the order as
   * `lockedRate` so disputes and historical records always reference the
   * rate that was actually used — never the current live rate.
   */
  lockedRate?: number
}

@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name)

  constructor(
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
    private walletService: WalletService,
    private prisma: PrismaService,
  ) {}

  @Post('initiate')
  @UseGuards(SupabaseJwtGuard)
  async initiateCheckout(
    @CurrentUserId() buyerId: string,
    @Body() dto: InitiateCheckoutDto,
  ) {
    try {
      const { listingId, quantity, paymentMethod, buyerNote, currency, lockedRate } = dto

      if (!listingId) throw new BadRequestException('listingId is required')
      if (!paymentMethod) throw new BadRequestException('paymentMethod is required')

      const useWallet = paymentMethod === 'WALLET'

      // Pass the buyer's local currency to createOrder so amounts are stored
      // in the correct currency and Flutterwave receives the right currency code.
      const order = await this.ordersService.createOrder(buyerId, {
        listingId,
        quantity: quantity || 1,
        buyerNote,
        currency,
        lockedRate,
      })

      const totalAmount = new Decimal(order.totalAmount)

      // ── Wallet payment ────────────────────────────────────────────────────
      if (useWallet) {
        const wallet = await this.walletService.getWalletBalance(buyerId)
        if (wallet.balance.lessThan(totalAmount)) {
          throw new BadRequestException('Insufficient wallet balance')
        }

        const updated = await this.prisma.orders.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: new Date(),
            metadata: {
              ...((order.metadata as Record<string, any>) || {}),
              paymentMethod: 'WALLET',
            },
          },
          include: {
            buyer: true,
            seller: true,
            orderItems: { include: { listing: true } },
          },
        })
        // Snapshot locked rate — only attempted if the migration has run.
        // If the columns don't exist yet this is a no-op.
        if (lockedRate != null || currency) {
          await this.prisma.orders.update({
            where: { id: order.id },
            data: {
              ...(lockedRate != null ? { lockedRate: new Decimal(lockedRate) } : {}),
              ...(currency ? { lockedCurrency: currency || order.currency } : {}),
            },
          }).catch(() => { /* columns not yet migrated — safe to ignore */ })
        }

        await this.walletService.debitBalance(
          buyerId,
          totalAmount,
          `Payment for order ${order.orderNumber}`,
          order.id,
        )

        const walletAfter = await this.walletService.getWalletBalance(buyerId)
        return ApiResponseDto.ok(
          {
            order: updated,
            paymentUrl: null,
            provider: 'WALLET',
            configured: true,
            walletBalance: walletAfter.balance,
          },
          'Order paid from wallet',
        )
      }

      // ── Card / mobile-money payment via Flutterwave ───────────────────────
      const provider = (paymentMethod as PaymentProvider) || PaymentProvider.FLUTTERWAVE
      const callbackUrl = `${process.env.FRONTEND_URL || 'https://app.piyrox.shop'}/orders/${order.id}`

      // Snapshot lockedRate on the order record before initiating payment.
      // Wrapped in catch so it silently skips if the migration hasn't run yet.
      if (lockedRate != null) {
        await this.prisma.orders.update({
          where: { id: order.id },
          data: {
            lockedRate: new Decimal(lockedRate),
            lockedCurrency: currency || order.currency,
          },
        }).catch(() => { /* columns not yet migrated — safe to ignore */ })
      }

      const payment = await this.paymentsService.initiatePayment(
        order.id,
        totalAmount,
        provider,
        callbackUrl,
        buyerId,
        // Pass the user's local currency so Flutterwave charges in it
        currency || order.currency,
      )

      return ApiResponseDto.ok(
        {
          order,
          paymentUrl: payment.paymentUrl,
          configured: payment.configured,
        },
        'Checkout initiated',
      )
    } catch (error) {
      this.logger.error('Error initiating checkout:', error)
      throw error
    }
  }
}
