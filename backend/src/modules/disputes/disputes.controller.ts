import { Controller, Get, Post, UseGuards, Body, Request, Param } from '@nestjs/common'
import { DisputesService } from './disputes.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: any) {
    return this.disputesService.create(req.user.sub, dto)
  }

  @Get(':orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.disputesService.findByOrder(orderId)
  }
}
