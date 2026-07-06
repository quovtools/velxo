import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      const result = await this.authService.register(dto)
      return ApiResponseDto.ok(result, 'User registered successfully')
    } catch (error) {
      this.logger.error('Registration error:', error)
      throw error
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.authService.login(dto)
      return ApiResponseDto.ok(result, 'Login successful')
    } catch (error) {
      this.logger.error('Login error:', error)
      throw error
    }
  }

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  async getCurrentUser(@CurrentUserId() userId: string) {
    try {
      const user = await this.authService.getCurrentUser(userId)
      return ApiResponseDto.ok(user, 'User profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching current user:', error)
      throw error
    }
  }

  @Post('logout')
  @UseGuards(SupabaseJwtGuard)
  async logout(@CurrentUserId() userId: string) {
    try {
      await this.authService.logout(userId)
      return ApiResponseDto.ok(null, 'Logout successful')
    } catch (error) {
      this.logger.error('Logout error:', error)
      throw error
    }
  }

  @Post('verify-email')
  @UseGuards(SupabaseJwtGuard)
  async verifyEmail(@CurrentUserId() userId: string) {
    try {
      const user = await this.authService.verifyEmail(userId)
      return ApiResponseDto.ok(user, 'Email verified')
    } catch (error) {
      this.logger.error('Email verification error:', error)
      throw error
    }
  }

  @Post('reset-password')
  @UseGuards(SupabaseJwtGuard)
  async resetPassword(
    @CurrentUserId() userId: string,
    @Body('newPassword') newPassword: string,
  ) {
    try {
      await this.authService.resetPassword(userId, newPassword)
      return ApiResponseDto.ok(null, 'Password reset successfully')
    } catch (error) {
      this.logger.error('Password reset error:', error)
      throw error
    }
  }
}
