import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Patch,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { ForbiddenException } from '@/common/exceptions/custom-exceptions'

export interface OrderFilterQuery {
  status?: string
  gameName?: string
  from?: string
  to?: string
  page?: string
  limit?: string
}

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name)

  constructor(private ordersService: OrdersService) {}

  @Post()
  @UseGuards(SupabaseJwtGuard)
  async createOrder(@CurrentUserId() buyerId: string, @Body() dto: CreateOrderDto) {
    try {
      const order = await this.ordersService.createOrder(buyerId, dto)
      return ApiResponseDto.ok(order, 'Order created successfully')
    } catch (error) {
      this.logger.error('Error creating order:', error)
      throw error
    }
  }

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  async getMyOrders(@CurrentUserId() buyerId: string, @Query() query: OrderFilterQuery) {
    try {
      const orders = await this.ordersService.getBuyerOrders(buyerId, query)
      return ApiResponseDto.ok(orders, 'Orders retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching orders:', error)
      throw error
    }
  }

  @Get('seller')
  @UseGuards(SupabaseJwtGuard)
  async getSellerOrders(@CurrentUserId() userId: string, @Query() query: OrderFilterQuery) {
    try {
      const orders = await this.ordersService.getSellerOrdersByUserId(userId, query)
      return ApiResponseDto.ok(orders, 'Orders retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching seller orders:', error)
      throw error
    }
  }

  @Get(':id/receipt')
  @UseGuards(SupabaseJwtGuard)
  async getOrderReceipt(@Param('id') orderId: string, @CurrentUserId() userId: string) {
    try {
      const receipt = await this.ordersService.getOrderReceipt(orderId, userId)
      return ApiResponseDto.ok(receipt, 'Receipt retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching receipt:', error)
      throw error
    }
  }

  @Get(':id/timeline')
  @UseGuards(SupabaseJwtGuard)
  async getOrderTimeline(@Param('id') orderId: string, @CurrentUserId() userId: string) {
    try {
      const order = await this.ordersService.getOrderById(orderId, userId)
      if (order.buyerId !== userId && order.seller?.userId !== userId) {
        throw new ForbiddenException('You do not have access to this order')
      }
      const timeline = await this.ordersService.getOrderTimeline(orderId)
      return ApiResponseDto.ok(timeline, 'Order timeline retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching order timeline:', error)
      throw error
    }
  }

  @Get(':id')
  @UseGuards(SupabaseJwtGuard)
  async getOrderById(@Param('id') orderId: string, @CurrentUserId() userId: string) {
    try {
      const order = await this.ordersService.getOrderById(orderId, userId)
      return ApiResponseDto.ok(order, 'Order retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching order:', error)
      throw error
    }
  }

  @Patch(':id/confirm-delivery')
  @UseGuards(SupabaseJwtGuard)
  async confirmDelivery(@Param('id') orderId: string, @CurrentUserId() buyerId: string) {
    try {
      const order = await this.ordersService.confirmDelivery(orderId, buyerId)
      return ApiResponseDto.ok(order, 'Delivery confirmed successfully')
    } catch (error) {
      this.logger.error('Error confirming delivery:', error)
      throw error
    }
  }

  @Patch(':id/mark-delivered')
  @UseGuards(SupabaseJwtGuard)
  async markDelivered(
    @Param('id') orderId: string,
    @CurrentUserId() sellerId: string,
    @Body() body: {
      deliveryData?: {
        credentials?: {
          username?: string
          password?: string
          email?: string
          loginMethod?: string
        }
        notes?: string
        screenshotUrls?: string[]
      }
    },
  ) {
    try {
      const order = await this.ordersService.markDelivered(orderId, sellerId, body?.deliveryData)
      return ApiResponseDto.ok(order, 'Order marked as delivered')
    } catch (error) {
      this.logger.error('Error marking delivered:', error)
      throw error
    }
  }

  @Patch(':id/accept')
  @UseGuards(SupabaseJwtGuard)
  async acceptOrder(@Param('id') orderId: string, @CurrentUserId() sellerId: string) {
    try {
      const order = await this.ordersService.acceptOrder(orderId, sellerId)
      return ApiResponseDto.ok(order, 'Order accepted — delivery timer started')
    } catch (error) {
      this.logger.error('Error accepting order:', error)
      throw error
    }
  }

  @Post(':id/request-release')
  @UseGuards(SupabaseJwtGuard)
  async requestRelease(@Param('id') orderId: string, @CurrentUserId() sellerId: string) {
    try {
      const result = await this.ordersService.requestRelease(orderId, sellerId)
      return ApiResponseDto.ok(result, 'Release requested')
    } catch (error) {
      this.logger.error('Error requesting release:', error)
      throw error
    }
  }

  @Post(':id/confirm-release')
  @UseGuards(SupabaseJwtGuard)
  async confirmRelease(@Param('id') orderId: string, @CurrentUserId() buyerId: string) {
    try {
      const order = await this.ordersService.confirmRelease(orderId, buyerId)
      return ApiResponseDto.ok(order, 'Release confirmed — funds sent to seller')
    } catch (error) {
      this.logger.error('Error confirming release:', error)
      throw error
    }
  }
}
