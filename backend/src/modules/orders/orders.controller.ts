import { Controller, Get, Post, UseGuards, Body, Param, Request } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyOrders(@Request() req) {
    return this.ordersService.findByUser(req.user.sub)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id)
  }
}
