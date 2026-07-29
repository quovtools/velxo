import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Logger,
} from '@nestjs/common'
import { LegalService } from './legal.service'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('legal')
export class LegalController {
  private readonly logger = new Logger(LegalController.name)

  constructor(private legalService: LegalService) {}

  /** GET /legal/:type — public, returns a published page */
  @Get(':type')
  async getPublishedPage(@Param('type') type: string) {
    try {
      const page = await this.legalService.getPublishedPage(type)
      return ApiResponseDto.ok(page, 'Legal page retrieved')
    } catch (error) {
      this.logger.error('Error fetching legal page:', error)
      throw error
    }
  }

  /** GET /legal/admin/all — admin, all pages */
  @Get('admin/all')
  @UseGuards(AdminPasswordGuard)
  async getAllPages() {
    try {
      const pages = await this.legalService.getAllPages()
      return ApiResponseDto.ok(pages, 'All legal pages retrieved')
    } catch (error) {
      this.logger.error('Error fetching all legal pages:', error)
      throw error
    }
  }

  /** GET /legal/admin/:type — admin, single page regardless of publish state */
  @Get('admin/:type')
  @UseGuards(AdminPasswordGuard)
  async getAdminPage(@Param('type') type: string) {
    try {
      const page = await this.legalService.getPageByType(type)
      return ApiResponseDto.ok(page, 'Legal page retrieved')
    } catch (error) {
      this.logger.error('Error fetching admin legal page:', error)
      throw error
    }
  }

  /** POST /legal/admin — admin, upsert a page */
  @Post('admin')
  @UseGuards(AdminPasswordGuard)
  async upsertPage(
    @Body() body: {
      pageType: string
      title: string
      content: string
      version?: string
      isPublished?: boolean
    },
  ) {
    try {
      const page = await this.legalService.upsertPage(body)
      return ApiResponseDto.ok(page, 'Legal page saved')
    } catch (error) {
      this.logger.error('Error upserting legal page:', error)
      throw error
    }
  }

  /** PATCH /legal/admin/:type/publish — admin, toggle publish */
  @Patch('admin/:type/publish')
  @UseGuards(AdminPasswordGuard)
  async togglePublish(@Param('type') type: string, @Body('publish') publish: boolean) {
    try {
      const page = await this.legalService.togglePublish(type, publish)
      return ApiResponseDto.ok(page, `Page ${publish ? 'published' : 'unpublished'}`)
    } catch (error) {
      this.logger.error('Error toggling publish:', error)
      throw error
    }
  }
}
