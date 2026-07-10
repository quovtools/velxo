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
import { SlidesService } from './slides.service'
import { CreateSlideDto, UpdateSlideDto } from './dto/create-slide.dto'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('slides')
export class SlidesController {
  private readonly logger = new Logger(SlidesController.name)

  constructor(private slidesService: SlidesService) {}

  // Public — homepage fetches active slides
  @Get()
  async getActiveSlides() {
    try {
      const slides = await this.slidesService.getActiveSlides()
      return ApiResponseDto.ok(slides, 'Slides retrieved')
    } catch (error) {
      this.logger.error('Error fetching slides:', error)
      throw error
    }
  }

  // Admin only — get all including inactive
  @Get('all')
  @UseGuards(AdminPasswordGuard)
  async getAllSlides() {
    try {
      const slides = await this.slidesService.getAllSlides()
      return ApiResponseDto.ok(slides, 'All slides retrieved')
    } catch (error) {
      this.logger.error('Error fetching all slides:', error)
      throw error
    }
  }

  @Post()
  @UseGuards(AdminPasswordGuard)
  async createSlide(@Body() dto: CreateSlideDto) {
    try {
      const slide = await this.slidesService.createSlide(dto)
      return ApiResponseDto.ok(slide, 'Slide created')
    } catch (error) {
      this.logger.error('Error creating slide:', error)
      throw error
    }
  }

  @Patch(':id')
  @UseGuards(AdminPasswordGuard)
  async updateSlide(@Param('id') id: string, @Body() dto: UpdateSlideDto) {
    try {
      const slide = await this.slidesService.updateSlide(id, dto)
      return ApiResponseDto.ok(slide, 'Slide updated')
    } catch (error) {
      this.logger.error('Error updating slide:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(AdminPasswordGuard)
  async deleteSlide(@Param('id') id: string) {
    try {
      await this.slidesService.deleteSlide(id)
      return ApiResponseDto.ok(null, 'Slide deleted')
    } catch (error) {
      this.logger.error('Error deleting slide:', error)
      throw error
    }
  }

  // ============ BULK OPERATIONS ============

  @Get('bulk/all')
  @UseGuards(AdminPasswordGuard)
  async getSlidesForBulkEdit() {
    try {
      const slides = await this.slidesService.getSlidesForBulkEdit()
      return ApiResponseDto.ok(slides, 'Slides retrieved for bulk editing')
    } catch (error) {
      this.logger.error('Error fetching slides for bulk edit:', error)
      throw error
    }
  }

  @Post('bulk/create')
  @UseGuards(AdminPasswordGuard)
  async bulkCreateSlides(
    @Body('slides')
    slides: Array<{
      title: string
      subtitle?: string
      imageUrl: string
      linkHref?: string
      badge?: string
      isActive?: boolean
      sortOrder: number
    }>,
  ) {
    try {
      const result = await this.slidesService.bulkCreateSlides(slides)
      return ApiResponseDto.ok(result, 'Slides bulk created')
    } catch (error) {
      this.logger.error('Error bulk creating slides:', error)
      throw error
    }
  }

  @Patch('bulk/status')
  @UseGuards(AdminPasswordGuard)
  async bulkUpdateSlidesStatus(
    @Body('slideIds') slideIds: string[],
    @Body('isActive') isActive: boolean,
  ) {
    try {
      const result = await this.slidesService.bulkUpdateSlidesStatus(slideIds, isActive)
      return ApiResponseDto.ok(result, 'Slide status bulk updated')
    } catch (error) {
      this.logger.error('Error bulk updating slide status:', error)
      throw error
    }
  }

  @Post('bulk/delete')
  @UseGuards(AdminPasswordGuard)
  async bulkDeleteSlides(@Body('slideIds') slideIds: string[]) {
    try {
      const result = await this.slidesService.bulkDeleteSlides(slideIds)
      return ApiResponseDto.ok(result, 'Slides bulk deleted')
    } catch (error) {
      this.logger.error('Error bulk deleting slides:', error)
      throw error
    }
  }

  @Patch('bulk/images')
  @UseGuards(AdminPasswordGuard)
  async bulkUpdateSlidesImages(
    @Body('updates')
    updates: Array<{ slideId: string; imageUrl: string }>,
  ) {
    try {
      const result = await this.slidesService.bulkUpdateSlidesImages(updates)
      return ApiResponseDto.ok(result, 'Slide images bulk updated')
    } catch (error) {
      this.logger.error('Error bulk updating slide images:', error)
      throw error
    }
  }

  @Patch('bulk/reorder')
  @UseGuards(AdminPasswordGuard)
  async reorderSlides(
    @Body('updates')
    updates: Array<{ slideId: string; sortOrder: number }>,
  ) {
    try {
      const result = await this.slidesService.reorderSlides(updates)
      return ApiResponseDto.ok(result, 'Slides reordered')
    } catch (error) {
      this.logger.error('Error reordering slides:', error)
      throw error
    }
  }
}
