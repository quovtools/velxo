import { Controller, Post, Body, Logger, Headers, Req, UseGuards, Get } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentProvider } from '@prisma/client'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
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
      const callbackUrl = `${process.env.FRONTEND_URL || 'https://app.piyrox.shop'}/orders/${orderId}`
      const result = await this.paymentsService.initiatePayment(
        orderId,
        new Decimal(amount),
        provider,
        callbackUrl,
        userId,
        currency,
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
    @Req() req: any,
  ) {
    try {
      // FIX S4: Webhook signature verification is now MANDATORY.
      // If FLUTTERWAVE_WEBHOOK_SECRET is not set, ALL webhook calls are rejected
      // to prevent forged webhooks from marking orders paid without real payment.
      const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET
      if (!webhookSecret) {
        this.logger.error(
          'FLUTTERWAVE_WEBHOOK_SECRET is not set — all Flutterwave webhooks are blocked. ' +
          'Set this env var to the webhook secret from your Flutterwave dashboard.',
        )
        // Return 200 to prevent Flutterwave from retrying, but do not process.
        return ApiResponseDto.ok(null, 'Webhook secret not configured — skipped')
      }

      if (!verifHash) {
        this.logger.warn('Flutterwave webhook received with no verif-hash header — rejecting')
        return ApiResponseDto.ok(null, 'Missing signature')
      }

      // Flutterwave sends the raw webhook secret as a plain string in the
      // verif-hash header (NOT an HMAC). We compare using timingSafeEqual
      // to prevent timing-based secret leakage.
      const crypto = require('crypto')
      let signatureValid = false
      try {
        signatureValid = crypto.timingSafeEqual(
          Buffer.from(verifHash),
          Buffer.from(webhookSecret),
        )
      } catch {
        signatureValid = false
      }

      if (!signatureValid) {
        this.logger.warn('Flutterwave webhook signature verification FAILED — rejecting forged request')
        return ApiResponseDto.ok(null, 'Invalid signature')
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
