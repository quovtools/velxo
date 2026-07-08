import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Post,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name)

  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  async getProfile(@CurrentUserId() userId: string) {
    try {
      const profile = await this.usersService.getUserProfile(userId)
      return ApiResponseDto.ok(profile, 'User profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching profile:', error)
      throw error
    }
  }

  @Patch('me')
  @UseGuards(SupabaseJwtGuard)
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body('firstName') firstName?: string,
    @Body('lastName') lastName?: string,
    @Body('phone') phone?: string,
    @Body('notificationPreferences') notificationPreferences?: any,
    @Body('preferences') preferences?: any,
  ) {
    try {
      const profile = await this.usersService.updateProfile(userId, {
        firstName,
        lastName,
        phone,
        notificationPreferences,
        preferences,
      })
      return ApiResponseDto.ok(profile, 'Profile updated successfully')
    } catch (error) {
      this.logger.error('Error updating profile:', error)
      throw error
    }
  }

  @Post('avatar')
  @UseGuards(SupabaseJwtGuard)
  async uploadAvatar(@CurrentUserId() userId: string, @Body('avatarUrl') avatarUrl: string) {
    try {
      const user = await this.usersService.uploadAvatar(userId, avatarUrl)
      return ApiResponseDto.ok(user, 'Avatar uploaded successfully')
    } catch (error) {
      this.logger.error('Error uploading avatar:', error)
      throw error
    }
  }

  @Get('me/stats')
  @UseGuards(SupabaseJwtGuard)
  async getStats(@CurrentUserId() userId: string) {
    try {
      const stats = await this.usersService.getUserStats(userId)
      return ApiResponseDto.ok(stats, 'User stats retrieved')
    } catch (error) {
      this.logger.error('Error fetching stats:', error)
      throw error
    }
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    try {
      const profile = await this.usersService.getUserProfile(userId)
      return ApiResponseDto.ok(profile, 'User profile retrieved')
    } catch (error) {
      this.logger.error('Error fetching user:', error)
      throw error
    }
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: number) {
    try {
      const users = await this.usersService.searchUsers(query, limit)
      return ApiResponseDto.ok(users, 'Users found')
    } catch (error) {
      this.logger.error('Error searching users:', error)
      throw error
    }
  }

  @Patch('me/deactivate')
  @UseGuards(SupabaseJwtGuard)
  async deactivateAccount(@CurrentUserId() userId: string) {
    try {
      await this.usersService.deactivateAccount(userId)
      return ApiResponseDto.ok(null, 'Account deactivated')
    } catch (error) {
      this.logger.error('Error deactivating account:', error)
      throw error
    }
  }

  @Post('me/reactivate')
  @UseGuards(SupabaseJwtGuard)
  async reactivateAccount(@CurrentUserId() userId: string) {
    try {
      const user = await this.usersService.reactivateAccount(userId)
      return ApiResponseDto.ok(user, 'Account reactivated')
    } catch (error) {
      this.logger.error('Error reactivating account:', error)
      throw error
    }
  }
}
