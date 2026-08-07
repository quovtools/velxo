import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
  Query,
  Res,
  Req,
  HttpCode,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
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

  @Get('validate')
  @UseGuards(SupabaseJwtGuard)
  validate(@CurrentUserId() userId: string) {
    return ApiResponseDto.ok({ valid: true, userId }, 'Token is valid')
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
    await this.authService.logout(userId).catch(() => {})
    return ApiResponseDto.ok(null, 'Logout successful')
  }

  /** Verify email with token from email link */
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body('token') token: string) {
    try {
      const user = await this.authService.verifyEmailToken(token)
      return ApiResponseDto.ok(user, 'Email verified successfully')
    } catch (error) {
      this.logger.error('Email verification error:', error)
      throw error
    }
  }

  /** Resend verification email */
  @Post('resend-verification')
  @UseGuards(SupabaseJwtGuard)
  @HttpCode(200)
  async resendVerification(@CurrentUserId() userId: string) {
    try {
      const result = await this.authService.resendVerificationEmail(userId)
      return ApiResponseDto.ok(result, 'Verification email sent')
    } catch (error) {
      this.logger.error('Resend verification error:', error)
      throw error
    }
  }

  /** Change password (requires current password) */
  @Post('change-password')
  @UseGuards(SupabaseJwtGuard)
  @HttpCode(200)
  async changePassword(
    @CurrentUserId() userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    try {
      await this.authService.changePassword(userId, currentPassword, newPassword)
      return ApiResponseDto.ok(null, 'Password changed successfully')
    } catch (error) {
      this.logger.error('Change password error:', error)
      throw error
    }
  }

  /** Forgot password — send reset email */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email).catch(() => {})
    return ApiResponseDto.ok(null, 'If that email exists, a reset link was sent')
  }

  /** Reset password using emailed token */
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    try {
      await this.authService.resetPasswordWithToken(token, newPassword)
      return ApiResponseDto.ok(null, 'Password reset successfully')
    } catch (error) {
      this.logger.error('Password reset error:', error)
      throw error
    }
  }

  /** Step 1: Redirect to Google consent */
  @Get('google')
  googleLogin(@Req() req: Request, @Res() res: Response) {
    res.redirect(this.authService.getGoogleAuthUrl(req))
  }

  /** Step 2: Google callback — exchanges code for token, then redirects the
   * frontend with a short-lived one-time code in the query string (not the
   * URL fragment) so the token never leaks via browser history or analytics. */
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleGoogleCallback(code, req)
      const frontendUrl = process.env.FRONTEND_URL || 'https://app.piyrox.shop'

      // Issue a short-lived one-time session code (30 s). The frontend
      // /auth/callback page exchanges this for the real JWT via POST
      // /auth/exchange-code — the JWT is never placed in the URL itself.
      const sessionCode = await this.authService.issueSessionCode(result)
      res.redirect(`${frontendUrl}/auth/callback?code=${sessionCode}`)
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error)
      const frontendUrl = process.env.FRONTEND_URL || 'https://app.piyrox.shop'
      res.redirect(`${frontendUrl}/auth/login?error=google_failed`)
    }
  }

  /** Exchange a short-lived session code (issued by the Google callback) for a
   * real JWT. Code is single-use and expires in 30 seconds. */
  @Post('exchange-code')
  @HttpCode(200)
  async exchangeCode(@Body('code') code: string) {
    try {
      const result = await this.authService.exchangeSessionCode(code)
      return ApiResponseDto.ok(result, 'Authentication successful')
    } catch (error) {
      this.logger.error('Session code exchange error:', error)
      throw error
    }
  }
}
