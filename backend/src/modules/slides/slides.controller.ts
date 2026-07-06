import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Logger,
} from '@nestjs/common'
import { SlidesService } from './slides.service'
import { CreateSlideDto } from './dto/create-slide.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { RequireRoles } from '@/common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('slides')
export class SlidesController {
  private readonly logger = new Logger(SlidesController.name)

  constructor(private slidesService: SlidesService) {}

  // Public — returns active slides for homepage
  @Get()
  async getActiveSlides() {
    const slides = await this.slidesService.getActiveSlides()
    return ApiResponseDto.ok(slides, 'Slides retrieved')
  }

  // Admin — returns all slides including inactive
  @Get('all')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllSlides() {
    const slides = await this.slidesService.getAllSlides()
    return ApiResponseDto.ok(slides, 'All slides retrieved')
  }

  @Post()
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async createSlide(@Body() dto: CreateSlideDto) {
    const slide = await this.slidesService.createSlide(dto)
    return ApiResponseDto.ok(slide, 'Slide created')
  }

  @Patch(':id')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateSlide(@Param('id') id: string, @Body() dto: Partial<CreateSlideDto>) {
    const slide = await this.slidesService.updateSlide(id, dto)
    return ApiResponseDto.ok(slide, 'Slide updated')
  }

  @Delete(':id')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteSlide(@Param('id') id: string) {
    await this.slidesService.deleteSlide(id)
    return ApiResponseDto.ok(null, 'Slide deleted')
  }

  @Post('reorder')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async reorderSlides(@Body('ids') ids: string[]) {
    const result = await this.slidesService.reorderSlides(ids)
    return ApiResponseDto.ok(result, 'Slides reordered')
  }
}
