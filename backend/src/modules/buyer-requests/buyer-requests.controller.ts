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
import { BuyerRequestsService } from './buyer-requests.service'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('buyer-requests')
export class BuyerRequestsController {
  private readonly logger = new Logger(BuyerRequestsController.name)

  constructor(private buyerRequestsService: BuyerRequestsService) {}

  // ─── Public: list open requests ────────────────────────────────────────────

  @Get()
  async getOpenRequests(
    @Query('gameName') gameName?: string,
    @Query('itemType') itemType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.buyerRequestsService.getOpenRequests({
        gameName,
        itemType,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      })
      return ApiResponseDto.ok(result, 'Buyer requests retrieved')
    } catch (error) {
      this.logger.error('Error fetching buyer requests:', error)
      throw error
    }
  }

  // ─── Public: real-time content validation (no auth) ────────────────────────

  @Post('validate')
  async validateContent(@Body('text') text: string) {
    const result = this.buyerRequestsService.validateDescription(text ?? '')
    return ApiResponseDto.ok(result, 'Validation complete')
  }

  // ─── Authenticated buyer routes ────────────────────────────────────────────

  @Get('mine')
  @UseGuards(SupabaseJwtGuard)
  async getMyRequests(@CurrentUserId() userId: string) {
    try {
      const requests = await this.buyerRequestsService.getMyRequests(userId)
      return ApiResponseDto.ok(requests, 'Your requests retrieved')
    } catch (error) {
      this.logger.error('Error fetching user requests:', error)
      throw error
    }
  }

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createRequest(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      gameName: string
      gameSlug?: string
      title: string
      description: string
      itemType?: string
      budgetMin?: number
      budgetMax?: number
      budget?: number
      currency?: string
      region?: string
      platform?: string
      rank?: string
      deliveryTimeframe?: string
      requiredVerificationLevel?: string
    },
  ) {
    try {
      const request = await this.buyerRequestsService.createRequest(userId, body)
      return ApiResponseDto.ok(request, 'Request posted successfully')
    } catch (error) {
      this.logger.error('Error creating buyer request:', error)
      throw error
    }
  }

  @Patch(':id/close')
  @UseGuards(SupabaseJwtGuard)
  async closeRequest(@Param('id') id: string, @CurrentUserId() userId: string) {
    try {
      const request = await this.buyerRequestsService.closeRequest(id, userId)
      return ApiResponseDto.ok(request, 'Request closed')
    } catch (error) {
      this.logger.error('Error closing buyer request:', error)
      throw error
    }
  }

  // ─── Matching: get relevant seller listings for a request ──────────────────

  @Get(':id/matches')
  async getMatchingListings(@Param('id') requestId: string) {
    try {
      const listings = await this.buyerRequestsService.getMatchingListings(requestId)
      return ApiResponseDto.ok(listings, 'Matching listings retrieved')
    } catch (error) {
      this.logger.error('Error getting matching listings:', error)
      throw error
    }
  }

  // ─── Offers ────────────────────────────────────────────────────────────────

  /** GET /buyer-requests/:id/offers — buyer sees offers on their request */
  @Get(':id/offers')
  @UseGuards(SupabaseJwtGuard)
  async getOffers(@Param('id') requestId: string, @CurrentUserId() userId: string) {
    try {
      const offers = await this.buyerRequestsService.getOffersForRequest(requestId, userId)
      return ApiResponseDto.ok(offers, 'Offers retrieved')
    } catch (error) {
      this.logger.error('Error fetching offers:', error)
      throw error
    }
  }

  /** POST /buyer-requests/:id/offers — seller submits an offer */
  @Post(':id/offers')
  @UseGuards(SupabaseJwtGuard)
  async createOffer(
    @Param('id') requestId: string,
    @CurrentUserId() userId: string,
    @Body()
    body: {
      sellerId: string    // sellers.id — caller must pass their seller profile id
      message: string
      price: number
      currency?: string
      deliveryTime?: number
    },
  ) {
    try {
      const offer = await this.buyerRequestsService.createOffer(body.sellerId, requestId, {
        message: body.message,
        price: body.price,
        currency: body.currency,
        deliveryTime: body.deliveryTime,
      })
      return ApiResponseDto.ok(offer, 'Offer submitted')
    } catch (error) {
      this.logger.error('Error creating offer:', error)
      throw error
    }
  }

  /** PATCH /buyer-requests/offers/:offerId/accept — buyer accepts */
  @Patch('offers/:offerId/accept')
  @UseGuards(SupabaseJwtGuard)
  async acceptOffer(@Param('offerId') offerId: string, @CurrentUserId() userId: string) {
    try {
      const offer = await this.buyerRequestsService.respondToOffer(offerId, userId, true)
      return ApiResponseDto.ok(offer, 'Offer accepted')
    } catch (error) {
      this.logger.error('Error accepting offer:', error)
      throw error
    }
  }

  /** PATCH /buyer-requests/offers/:offerId/decline — buyer declines */
  @Patch('offers/:offerId/decline')
  @UseGuards(SupabaseJwtGuard)
  async declineOffer(@Param('offerId') offerId: string, @CurrentUserId() userId: string) {
    try {
      const offer = await this.buyerRequestsService.respondToOffer(offerId, userId, false)
      return ApiResponseDto.ok(offer, 'Offer declined')
    } catch (error) {
      this.logger.error('Error declining offer:', error)
      throw error
    }
  }

  /** PATCH /buyer-requests/offers/:offerId/withdraw — seller withdraws */
  @Patch('offers/:offerId/withdraw')
  @UseGuards(SupabaseJwtGuard)
  async withdrawOffer(
    @Param('offerId') offerId: string,
    @CurrentUserId() _userId: string,
    @Body('sellerId') sellerId: string,
  ) {
    try {
      const offer = await this.buyerRequestsService.withdrawOffer(offerId, sellerId)
      return ApiResponseDto.ok(offer, 'Offer withdrawn')
    } catch (error) {
      this.logger.error('Error withdrawing offer:', error)
      throw error
    }
  }

  // ─── Reporting ─────────────────────────────────────────────────────────────

  /** POST /buyer-requests/:id/flag — any user can report a request */
  @Post(':id/flag')
  @UseGuards(SupabaseJwtGuard)
  async flagRequest(
    @Param('id') requestId: string,
    @CurrentUserId() userId: string,
    @Body('reason') reason: string,
  ) {
    try {
      const req = await this.buyerRequestsService.flagRequest(requestId, userId, reason ?? 'Reported by user')
      return ApiResponseDto.ok(req, 'Request flagged for review')
    } catch (error) {
      this.logger.error('Error flagging request:', error)
      throw error
    }
  }
}
