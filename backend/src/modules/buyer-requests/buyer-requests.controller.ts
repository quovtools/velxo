import {
  Controller,
  Get,
  Post,
  Patch,
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

  /** GET /buyer-requests?gameName=Free+Fire&limit=20&offset=0 */
  @Get()
  async getOpenRequests(
    @Query('gameName') gameName?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.buyerRequestsService.getOpenRequests({
        gameName,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      })
      return ApiResponseDto.ok(result, 'Buyer requests retrieved')
    } catch (error) {
      this.logger.error('Error fetching buyer requests:', error)
      throw error
    }
  }

  /** GET /buyer-requests/mine — authenticated buyer's own requests */
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

  /** POST /buyer-requests — create a request (auth required) */
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
      budget?: number
      currency?: string
      region?: string
      platform?: string
      rank?: string
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

  /** PATCH /buyer-requests/:id/close — close own request */
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
}
