"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrdersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let OrdersController = OrdersController_1 = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
        this.logger = new common_1.Logger(OrdersController_1.name);
    }
    async createOrder(buyerId, dto) {
        try {
            const order = await this.ordersService.createOrder(buyerId, dto);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Order created successfully');
        }
        catch (error) {
            this.logger.error('Error creating order:', error);
            throw error;
        }
    }
    async getMyOrders(buyerId) {
        try {
            const orders = await this.ordersService.getBuyerOrders(buyerId);
            return api_response_dto_1.ApiResponseDto.ok(orders, 'Orders retrieved successfully');
        }
        catch (error) {
            this.logger.error('Error fetching orders:', error);
            throw error;
        }
    }
    async getSellerOrders(sellerId) {
        try {
            const orders = await this.ordersService.getSellerOrders(sellerId);
            return api_response_dto_1.ApiResponseDto.ok(orders, 'Orders retrieved successfully');
        }
        catch (error) {
            this.logger.error('Error fetching orders:', error);
            throw error;
        }
    }
    async getOrderById(orderId, userId) {
        try {
            const order = await this.ordersService.getOrderById(orderId, userId);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Order retrieved successfully');
        }
        catch (error) {
            this.logger.error('Error fetching order:', error);
            throw error;
        }
    }
    async confirmDelivery(orderId, buyerId) {
        try {
            const order = await this.ordersService.confirmDelivery(orderId, buyerId);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Delivery confirmed successfully');
        }
        catch (error) {
            this.logger.error('Error confirming delivery:', error);
            throw error;
        }
    }
    async markDelivered(orderId, sellerId, body) {
        try {
            const order = await this.ordersService.markDelivered(orderId, sellerId, body?.deliveryData);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Order marked as delivered');
        }
        catch (error) {
            this.logger.error('Error marking delivered:', error);
            throw error;
        }
    }
    async acceptOrder(orderId, sellerId) {
        try {
            const order = await this.ordersService.acceptOrder(orderId, sellerId);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Order accepted — delivery timer started');
        }
        catch (error) {
            this.logger.error('Error accepting order:', error);
            throw error;
        }
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('seller'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getSellerOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Patch)(':id/confirm-delivery'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "confirmDelivery", null);
__decorate([
    (0, common_1.Patch)(':id/mark-delivered'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "markDelivered", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "acceptOrder", null);
exports.OrdersController = OrdersController = OrdersController_1 = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map