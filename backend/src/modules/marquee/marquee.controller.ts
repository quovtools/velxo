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
import { MarqueeService } from './marquee.service'
import { CreateMarqueeDto, UpdateMarqueeDto } from './dto/create-marquee.dto'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('marquee')
export class MarqueeController {
  private readonly logger = new Logger(MarqueeController.name)

  constructor(private marqueeService: MarqueeService) {}

  // Public — homepage fetches active news items
  @Get()
  async getActiveItems() {
    try {
      const items = await this.marqueeService.getActiveItems()
      return ApiResponseDto.ok(items, 'News retrieved')
    } catch (error) {
      this.logger.error('Error fetching marquee:', error)
      throw error
    }
  }

  // Admin only — get all including inactive
  @Get('all')
  @UseGuards(AdminPasswordGuard)
  async getAllItems() {
    try {
      const items = await this.marqueeService.getAllItems()
      return ApiResponseDto.ok(items, 'All news retrieved')
    } catch (error) {
      this.logger.error('Error fetching all marquee:', error)
      throw error
    }
  }

  @Post()
  @UseGuards(AdminPasswordGuard)
  async createItem(@Body() dto: CreateMarqueeDto) {
    try {
      const item = await this.marqueeService.createItem(dto)
      return ApiResponseDto.ok(item, 'News created')
    } catch (error) {
      this.logger.error('Error creating marquee:', error)
      throw error
    }
  }

  @Patch(':id')
  @UseGuards(AdminPasswordGuard)
  async updateItem(@Param('id') id: string, @Body() dto: UpdateMarqueeDto) {
    try {
      const item = await this.marqueeService.updateItem(id, dto)
      return ApiResponseDto.ok(item, 'News updated')
    } catch (error) {
      this.logger.error('Error updating marquee:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(AdminPasswordGuard)
  async deleteItem(@Param('id') id: string) {
    try {
      await this.marqueeService.deleteItem(id)
      return ApiResponseDto.ok(null, 'News deleted')
    } catch (error) {
      this.logger.error('Error deleting marquee:', error)
      throw error
    }
  }
}
