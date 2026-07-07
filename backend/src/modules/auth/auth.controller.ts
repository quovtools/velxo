import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
  Query,
  Res,
  HttpCode,
} from '@nestjs/common'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('auth')
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

  /** Step 1: Redirect browser to Google consent screen */
  @Get('google')
  googleLogin(@Res() res: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.API_URL || 'http://localhost:3001/api/v1'}/auth/google/callback`
    const scope = 'openid email profile'
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`
    res.redirect(url)
  }

  /** Step 2: Handle Google OAuth callback, return JWT to frontend */
  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleGoogleCallback(code)
      const frontendUrl = process.env.FRONTEND_URL || 'https://market.velxo.shop'
      // Redirect to frontend with token in URL hash (never query string)
      res.redirect(`${frontendUrl}/auth/callback#token=${result.accessToken}&userId=${result.user.id}`)
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error)
      const frontendUrl = process.env.FRONTEND_URL || 'https://market.velxo.shop'
      res.redirect(`${frontendUrl}/auth/login?error=google_failed`)
    }
  }

  /** Forgot password — send reset email */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body('email') email: string) {
    // For now returns success regardless to prevent email enumeration
    await this.authService.forgotPassword(email).catch(() => {})
    return ApiResponseDto.ok(null, 'If that email exists, a reset link was sent')
  }
}
