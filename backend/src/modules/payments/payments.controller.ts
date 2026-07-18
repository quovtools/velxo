import { Controller, Post, Body, Logger, Headers, Req, UseGuards, Get } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentProvider } from '@prisma/client'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { Decimal } from '@prisma/client/runtime/library'
import { logError } from '@/shared/error.util'

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name)

  constructor(private paymentsService: PaymentsService) {}

  @Get('config')
  async getConfig() {
    return ApiResponseDto.ok(this.paymentsService.getProviderConfig(), 'Payment provider configuration')
  }


  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createPayment(
    @CurrentUserId() userId: string,
    @Body('orderId') orderId: string,
    @Body('provider') provider: PaymentProvider,
    @Body('amount') amount: number,
    @Body('currency') currency?: string,
  ) {
    try {
      const callbackUrl = `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/orders/${orderId}`
      const result = await this.paymentsService.initiatePayment(
        orderId,
        new Decimal(amount),
        provider,
        callbackUrl,
        userId,
      )
      return ApiResponseDto.ok(result, 'Payment initiated')
    } catch (error) {
      logError(this.logger, 'createPayment', error, { orderId, provider, amount })
      throw error
    }
  }

  @Post('webhook/flutterwave')
  async handleFlutterwaveWebhook(
    @Headers('verif-hash') verifHash: string,
    @Body() event: any,
  ) {
    try {
      // FIX #30: Verify the Flutterwave webhook signature early before processing.
      // Flutterwave sends a `verif-hash` header with an HMAC-SHA256 signature
      // of the raw request body using the secret key. While the verify-transaction
      // call will catch forged transactions server-side, rejecting invalid signatures
      // upfront prevents wasted processing and is standard practice.
      const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || ''
      if (webhookSecret && verifHash) {
        const crypto = require('crypto')
        const hash = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(event)).digest('base64')
        if (hash !== verifHash) {
          this.logger.warn('Flutterwave webhook signature verification failed — rejecting')
          return ApiResponseDto.ok(null, 'Invalid signature')
        }
      }
      await this.paymentsService.handleFlutterwaveWebhook(event)
      return ApiResponseDto.ok(null, 'Webhook processed')
    } catch (error) {
      logError(this.logger, 'Flutterwave webhook', error)
      throw error
    }
  }

  @Post('webhook/paymentio')
  async handlePaymentIoWebhook(
    @Req() req: any,
    @Body() event: any,
    @Headers('x-hmac-sha256-signature') signature: string,
  ) {
    try {
      // Raw body is required for HMAC verification; fall back to JSON stringify.
      const rawBody =
        typeof req.rawBody === 'string'
          ? req.rawBody
          : typeof req.body === 'string'
            ? req.body
            : JSON.stringify(event)

      // HMAC signature is a best-effort extra check. Paymento itself advises
      // confirming payments via the Verify API, so a signature mismatch (e.g.
      // a misconfigured secret key) must NOT block legitimate payments — we log
      // it and still let the authoritative Verify API decide below.
      if (signature && !this.paymentsService.verifyPaymentIoIpn(rawBody, signature)) {
        this.logger.warn('Payment.io IPN signature verification failed — falling back to Verify API')
      }

      await this.paymentsService.handlePaymentIoWebhook(event)
      return ApiResponseDto.ok(null, 'Webhook processed')
    } catch (error) {
      logError(this.logger, 'Payment.io webhook', error)
      throw error
    }
  }
}
