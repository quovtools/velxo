import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { GameBannersService } from './game-banners.service'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('game-banners')
export class GameBannersController {
  private readonly logger = new Logger(GameBannersController.name)

  constructor(private bannerService: GameBannersService) {}

  /** GET /game-banners — public, returns active banners */
  @Get()
  async getActiveBanners() {
    try {
      const banners = await this.bannerService.getActiveBanners()
      return ApiResponseDto.ok(banners, 'Game banners retrieved')
    } catch (error) {
      this.logger.error('Error fetching game banners:', error)
      throw error
    }
  }

  /** GET /game-banners/slug/:slug — public single banner lookup */
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    try {
      const banner = await this.bannerService.getBannerBySlug(slug)
      return ApiResponseDto.ok(banner, 'Banner retrieved')
    } catch (error) {
      this.logger.error('Error fetching banner by slug:', error)
      throw error
    }
  }

  /** GET /game-banners/all — admin, returns all including inactive */
  @Get('all')
  @UseGuards(AdminPasswordGuard)
  async getAllBanners() {
    try {
      const banners = await this.bannerService.getAllBanners()
      return ApiResponseDto.ok(banners, 'All game banners retrieved')
    } catch (error) {
      this.logger.error('Error fetching all banners:', error)
      throw error
    }
  }

  /** POST /game-banners — admin, create or update banner for a game */
  @Post()
  @UseGuards(AdminPasswordGuard)
  async upsertBanner(
    @Body()
    body: {
      gameName: string
      gameSlug: string
      bannerUrl: string
      bannerKey?: string
      color?: string
      isActive?: boolean
      sortOrder?: number
    },
  ) {
    try {
      const banner = await this.bannerService.upsertBanner(body)
      return ApiResponseDto.ok(banner, 'Game banner saved')
    } catch (error) {
      this.logger.error('Error upserting game banner:', error)
      throw error
    }
  }

  /** PATCH /game-banners/:id — admin, partial update */
  @Patch(':id')
  @UseGuards(AdminPasswordGuard)
  async updateBanner(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      bannerUrl: string
      bannerKey: string
      color: string
      isActive: boolean
      sortOrder: number
    }>,
  ) {
    try {
      const banner = await this.bannerService.updateBanner(id, body)
      return ApiResponseDto.ok(banner, 'Game banner updated')
    } catch (error) {
      this.logger.error('Error updating game banner:', error)
      throw error
    }
  }

  /** DELETE /game-banners/:id — admin */
  @Delete(':id')
  @UseGuards(AdminPasswordGuard)
  async deleteBanner(@Param('id') id: string) {
    try {
      await this.bannerService.deleteBanner(id)
      return ApiResponseDto.ok(null, 'Game banner deleted')
    } catch (error) {
      this.logger.error('Error deleting game banner:', error)
      throw error
    }
  }
}
