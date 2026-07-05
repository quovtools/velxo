import { Controller, Get, Patch, UseGuards, Body, Request, Param } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.adminService.getDashboard()
  }

  @Patch('listings/:id/moderate')
  moderateListing(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.moderateListing(id, dto)
  }
}
