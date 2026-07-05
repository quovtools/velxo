import { Controller, Get, Post, UseGuards, Body, Request } from '@nestjs/common'
import { SupportService } from './support.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  createTicket(@Request() req, @Body() dto: any) {
    return this.supportService.create(req.user.sub, dto)
  }
}
