import { Controller, Get, Post, UseGuards, Body, Param, Patch } from '@nestjs/common'
import { EscrowService } from './escrow.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get(':orderId')
  async findOne(@Param('orderId') orderId: string) {
    return this.escrowService.findByOrder(orderId)
  }

  @Patch(':orderId/release')
  @UseGuards(JwtAuthGuard)
  async release(@Param('orderId') orderId: string) {
    return this.escrowService.release(orderId)
  }
}
