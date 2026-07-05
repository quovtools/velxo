import { Controller, Get, Post, UseGuards, Body, Param, Query, Request } from '@nestjs/common'
import { ListingsService } from './listings.service'
import { SearchListingsDto } from './dto/search.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: any) {
    return this.listingsService.create(req.user.sub, dto)
  }

  @Get()
  search(@Query() query: SearchListingsDto) {
    return this.listingsService.search(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id)
  }
}
