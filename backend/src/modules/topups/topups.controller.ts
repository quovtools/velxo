import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { TopupsService } from './topups.service'
import { CreateTopupDto, UpdateTopupDto } from './dto/create-topup.dto'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('topups')
export class TopupsController {
  private readonly logger = new Logger(TopupsController.name)

  constructor(private topupsService: TopupsService) {}

  // Public — browse official Velxo top-ups
  @Get()
  async getActiveProducts(@Query('game') gameName?: string) {
    try {
      const products = await this.topupsService.getActiveProducts(gameName)
      return ApiResponseDto.ok(products, 'Top-ups retrieved')
    } catch (error) {
      this.logger.error('Error fetching top-ups:', error)
      throw error
    }
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    try {
      const product = await this.topupsService.getProductById(id)
      return ApiResponseDto.ok(product, 'Top-up retrieved')
    } catch (error) {
      this.logger.error('Error fetching top-up:', error)
      throw error
    }
  }

  // Admin only
  @Get('admin/all')
  @UseGuards(AdminPasswordGuard)
  async getAllProducts() {
    try {
      const products = await this.topupsService.getAllProducts()
      return ApiResponseDto.ok(products, 'All top-ups retrieved')
    } catch (error) {
      this.logger.error('Error fetching all top-ups:', error)
      throw error
    }
  }

  @Post()
  @UseGuards(AdminPasswordGuard)
  async createProduct(@Body() dto: CreateTopupDto) {
    try {
      const product = await this.topupsService.createProduct(dto)
      return ApiResponseDto.ok(product, 'Top-up created')
    } catch (error) {
      this.logger.error('Error creating top-up:', error)
      throw error
    }
  }

  @Patch(':id')
  @UseGuards(AdminPasswordGuard)
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateTopupDto) {
    try {
      const product = await this.topupsService.updateProduct(id, dto)
      return ApiResponseDto.ok(product, 'Top-up updated')
    } catch (error) {
      this.logger.error('Error updating top-up:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(AdminPasswordGuard)
  async deleteProduct(@Param('id') id: string) {
    try {
      await this.topupsService.deleteProduct(id)
      return ApiResponseDto.ok(null, 'Top-up deleted')
    } catch (error) {
      this.logger.error('Error deleting top-up:', error)
      throw error
    }
  }

  // Authenticated buyer purchases an official top-up
  @Post(':id/purchase')
  @UseGuards(SupabaseJwtGuard)
  async purchase(
    @Param('id') id: string,
    @CurrentUserId() buyerId: string,
    @Body('quantity') quantity?: number,
    @Body('buyerNote') buyerNote?: string,
  ) {
    try {
      const order = await this.topupsService.purchase(
        buyerId,
        id,
        quantity && quantity > 0 ? quantity : 1,
        buyerNote,
      )
      return ApiResponseDto.ok(order, 'Top-up order created')
    } catch (error) {
      this.logger.error('Error purchasing top-up:', error)
      throw error
    }
  }
}
