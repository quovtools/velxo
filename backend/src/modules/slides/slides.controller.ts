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
}
