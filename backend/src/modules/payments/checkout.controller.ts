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

  currency?: string
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
      const { listingId, quantity, paymentMethod, buyerNote, currency } = dto

      if (!listingId) {
        throw new BadRequestException('listingId is required')
      }

      if (!paymentMethod) {
        throw new BadRequestException('paymentMethod is required')
      }

      const useWallet = paymentMethod === 'WALLET'

      const order = await this.ordersService.createOrder(buyerId, {
        listingId,
        quantity: quantity || 1,
        buyerNote,
        currency,
      })

      const totalAmount = new Decimal(order.totalAmount)
      const orderCurrency = order.currency || 'USD'

      if (useWallet) {
        const wallet = await this.walletService.getWalletBalance(buyerId)
        if (wallet.balance.lessThan(totalAmount)) {
          throw new BadRequestException('Insufficient wallet balance')
        }
        const buyer = await this.prisma.users.findUnique({ where: { id: buyerId } })
        const updated = await this.prisma.orders.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: new Date(),
            metadata: { ...((order.metadata as Record<string, any>) || {}), paymentMethod: 'WALLET' },
          },
          include: {
            buyer: true,
            seller: true,
            orderItems: { include: { listing: true } },
          },
        })
        await this.walletService.debitBalance(buyerId, totalAmount, `Payment for order ${order.orderNumber}`, order.id)
        const walletAfter = await this.walletService.getWalletBalance(buyerId)
        return ApiResponseDto.ok({
          order: updated,
          paymentUrl: null,
          provider: 'WALLET',
          configured: true,
          walletBalance: walletAfter.balance,
        }, 'Order paid from wallet')
      }

      const provider = (paymentMethod as PaymentProvider) || PaymentProvider.FLUTTERWAVE
      const callbackUrl = `${process.env.FRONTEND_URL || 'https://market.piyrox.shop'}/orders/${order.id}`
      const payment = await this.paymentsService.initiatePayment(
        order.id,
        totalAmount,
        provider,
        callbackUrl,
        buyerId,
      )

      return ApiResponseDto.ok({
        order,
        paymentUrl: payment.paymentUrl,
        configured: payment.configured,
      }, 'Checkout initiated')
    } catch (error) {
      this.logger.error('Error initiating checkout:', error)
      throw error
    }
  }
}
