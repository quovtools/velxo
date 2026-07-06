import { Controller, Post, Body, Logger, Headers } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/v1/payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name)

  constructor(private paymentsService: PaymentsService) {}

  @Post('webhook/stripe')
  async handleStripeWebhook(@Body() event: any, @Headers('stripe-signature') signature: string) {
    try {
      // TODO: Verify stripe signature
      await this.paymentsService.handleStripeWebhook(event)
      return ApiResponseDto.ok(null, 'Webhook processed')
    } catch (error) {
      this.logger.error('Error processing Stripe webhook:', error)
      throw error
    }
  }

  @Post('webhook/flutterwave')
  async handleFlutterwaveWebhook(@Body() event: any) {
    try {
      await this.paymentsService.handleFlutterwaveWebhook(event)
      return ApiResponseDto.ok(null, 'Webhook processed')
    } catch (error) {
      this.logger.error('Error processing Flutterwave webhook:', error)
      throw error
    }
  }

  @Post('webhook/paypal')
  async handlePayPalWebhook(@Body() event: any) {
    try {
      await this.paymentsService.handlePayPalWebhook(event)
      return ApiResponseDto.ok(null, 'Webhook processed')
    } catch (error) {
      this.logger.error('Error processing PayPal webhook:', error)
      throw error
    }
  }
}
