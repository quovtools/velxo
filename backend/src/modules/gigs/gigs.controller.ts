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
  ForbiddenException,
} from '@nestjs/common'
import { GigsService } from './gigs.service'
import { CreateGigDto, UpdateGigDto, AdminReviewGigDto } from './dto/create-gig.dto'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('gigs')
export class GigsController {
  private readonly logger = new Logger(GigsController.name)

  constructor(private gigsService: GigsService) {}

  // Public — browse approved rank-boosting gigs
  @Get()
  async getPublicGigs(
    @Query('game') gameName?: string,
    @Query('accountType') accountType?: string,
    @Query('search') search?: string,
  ) {
    try {
      const gigs = await this.gigsService.getPublicGigs({ gameName, accountType, search })
      return ApiResponseDto.ok(gigs, 'Gigs retrieved')
    } catch (error) {
      this.logger.error('Error fetching gigs:', error)
      throw error
    }
  }

  @Get(':id')
  async getGig(@Param('id') id: string) {
    try {
      const gig = await this.gigsService.getGigById(id)
      return ApiResponseDto.ok(gig, 'Gig retrieved')
    } catch (error) {
      this.logger.error('Error fetching gig:', error)
      throw error
    }
  }

  @Get('me/listings')
  @UseGuards(SupabaseJwtGuard)
  async getMyGigs(@CurrentUserId() userId: string) {
    try {
      const seller = await this.resolveSeller(userId)
      const gigs = await this.gigsService.getMyGigs(seller.id)
      return ApiResponseDto.ok(gigs, 'Your gigs retrieved')
    } catch (error) {
      this.logger.error('Error fetching my gigs:', error)
      throw error
    }
  }

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createGig(@CurrentUserId() userId: string, @Body() dto: CreateGigDto) {
    try {
      const seller = await this.resolveSeller(userId)
      const gig = await this.gigsService.createGig(seller.id, dto)
      return ApiResponseDto.ok(gig, 'Gig submitted for review')
    } catch (error) {
      this.logger.error('Error creating gig:', error)
      throw error
    }
  }

  @Patch(':id')
  @UseGuards(SupabaseJwtGuard)
  async updateGig(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateGigDto,
  ) {
    try {
      const seller = await this.resolveSeller(userId)
      const gig = await this.gigsService.updateGig(id, seller.id, dto)
      return ApiResponseDto.ok(gig, 'Gig updated')
    } catch (error) {
      this.logger.error('Error updating gig:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(SupabaseJwtGuard)
  async deleteGig(@Param('id') id: string, @CurrentUserId() userId: string) {
    try {
      const seller = await this.resolveSeller(userId)
      await this.gigsService.deleteGig(id, seller.id)
      return ApiResponseDto.ok(null, 'Gig deleted')
    } catch (error) {
      this.logger.error('Error deleting gig:', error)
      throw error
    }
  }

  // Admin only — manage all gigs
  @Get('admin/all')
  @UseGuards(AdminPasswordGuard)
  async getAllAdmin(
    @Query('status') status?: string,
    @Query('game') gameName?: string,
  ) {
    try {
      const gigs = await this.gigsService.getAllGigsAdmin({ status, gameName })
      return ApiResponseDto.ok(gigs, 'All gigs retrieved')
    } catch (error) {
      this.logger.error('Error fetching admin gigs:', error)
      throw error
    }
  }

  @Patch('admin/:id/review')
  @UseGuards(AdminPasswordGuard)
  async reviewGig(@Param('id') id: string, @Body() dto: AdminReviewGigDto) {
    try {
      const gig = await this.gigsService.reviewGig(id, dto.status as any, dto.rejectionReason)
      return ApiResponseDto.ok(gig, 'Gig reviewed')
    } catch (error) {
      this.logger.error('Error reviewing gig:', error)
      throw error
    }
  }

  @Delete('admin/:id')
  @UseGuards(AdminPasswordGuard)
  async adminDelete(@Param('id') id: string) {
    try {
      await this.gigsService.adminDeleteGig(id)
      return ApiResponseDto.ok(null, 'Gig deleted')
    } catch (error) {
      this.logger.error('Error deleting gig (admin):', error)
      throw error
    }
  }

  // Authenticated buyer purchases a gig
  @Post(':id/purchase')
  @UseGuards(SupabaseJwtGuard)
  async purchase(
    @Param('id') id: string,
    @CurrentUserId() buyerId: string,
    @Body('quantity') quantity?: number,
    @Body('buyerNote') buyerNote?: string,
  ) {
    try {
      const order = await this.gigsService.purchase(
        id,
        buyerId,
        quantity && quantity > 0 ? quantity : 1,
        buyerNote,
      )
      return ApiResponseDto.ok(order, 'Gig order created')
    } catch (error) {
      this.logger.error('Error purchasing gig:', error)
      throw error
    }
  }

  private async resolveSeller(userId: string) {
    const seller = await this.gigsService['prisma'].sellers.findUnique({ where: { userId } })
    if (!seller) {
      throw new ForbiddenException('You must be a seller to manage gigs')
    }
    return seller
  }
}
