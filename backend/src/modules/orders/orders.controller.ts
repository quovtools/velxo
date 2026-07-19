import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  async getMyOrders(@CurrentUserId() buyerId: string) {
    try {
      const orders = await this.ordersService.getBuyerOrders(buyerId)
      return ApiResponseDto.ok(orders, 'Orders retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching orders:', error)
      throw error
    }
  }

  @Get('seller')
  @UseGuards(SupabaseJwtGuard)
  async getSellerOrders(@CurrentUserId() userId: string) {
    try {
      // orders.sellerId stores sellers.id, not users.id — resolve the seller record first.
      const orders = await this.ordersService.getSellerOrdersByUserId(userId)
      return ApiResponseDto.ok(orders, 'Orders retrieved successfully')
    } catch (error) {
      this.logger.error('Error fetching orders:', error)
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
    @Body() body: Record<string, any>,
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
  async acceptOrder(
    @Param('id') orderId: string,
    @CurrentUserId() sellerId: string,
  ) {
    try {
      const order = await this.ordersService.acceptOrder(orderId, sellerId)
      return ApiResponseDto.ok(order, 'Order accepted — delivery timer started')
    } catch (error) {
      this.logger.error('Error accepting order:', error)
      throw error
    }
  }
}
