import { Controller, Get, UseGuards, Param } from '@nestjs/common'
import { SellersService } from './sellers.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get(':userId')
  async getByUser(@Param('userId') userId: string) {
    return this.sellersService.findByUserId(userId)
  }
}
