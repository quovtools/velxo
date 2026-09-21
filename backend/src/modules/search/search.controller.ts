import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@/common/exceptions/custom-exceptions'

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name)

  constructor(private readonly prisma: PrismaService) {}

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  async listSavedSearches(@CurrentUserId() userId: string) {
    try {
      const saved = await this.prisma.savedSearches.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, params: true, createdAt: true },
      })
      return ApiResponseDto.ok(saved, 'Saved searches retrieved')
    } catch (error) {
      this.logger.error('Error fetching saved searches:', error)
      throw error
    }
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  async saveSearch(
    @CurrentUserId() userId: string,
    @Body() body: { name?: string; params?: Record<string, string> },
  ) {
    try {
      const name = body?.name?.trim()
      if (!name) {
        throw new BadRequestException('name is required')
      }
      if (!body.params || typeof body.params !== 'object') {
        throw new BadRequestException('params is required')
      }
      const count = await this.prisma.savedSearches.count({ where: { userId } })
      if (count >= 20) {
        throw new BadRequestException('You can save up to 20 searches — delete one first')
      }
      const saved = await this.prisma.savedSearches.create({
        data: {
          userId,
          name: name.slice(0, 80),
          params: body.params,
        },
        select: { id: true, name: true, params: true, createdAt: true },
      })
      return ApiResponseDto.ok(saved, 'Search saved')
    } catch (error) {
      this.logger.error('Error saving search:', error)
      throw error
    }
  }

  @Delete('saved/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSavedSearch(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ) {
    try {
      const existing = await this.prisma.savedSearches.findUnique({ where: { id } })
      if (!existing) {
        throw new NotFoundException('Saved search')
      }
      if (existing.userId !== userId) {
        throw new ForbiddenException('You can only delete your own saved searches')
      }
      await this.prisma.savedSearches.delete({ where: { id } })
      return ApiResponseDto.ok({ id }, 'Saved search deleted')
    } catch (error) {
      this.logger.error('Error deleting saved search:', error)
      throw error
    }
  }
}
