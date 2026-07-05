import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  createIntent(@Request() req, @Body() dto: any) {
    return this.paymentsService.createIntent(req.user.sub, dto)
  }

  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return { success: true }
  }
}
