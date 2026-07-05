import { Controller, Get, UseGuards, Param } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    // userId comes from req.user attached by JwtAuthGuard
    return { success: true, data: null }
  }
}
