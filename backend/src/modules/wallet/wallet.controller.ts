import { Controller, Get, Post, UseGuards, Body, Param, Request } from '@nestjs/common'
import { WalletService } from './wallet.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Param('userId') userId: string) {
    return this.walletService.findByUser(userId)
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async requestWithdrawal(@Request() req, @Body() dto: any) {
    return this.walletService.requestWithdrawal(req.user.sub, dto)
  }
}
