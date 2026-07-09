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
var EscrowController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowController = void 0;
const common_1 = require("@nestjs/common");
const escrow_service_1 = require("./escrow.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
let EscrowController = EscrowController_1 = class EscrowController {
    constructor(escrowService, prisma) {
        this.escrowService = escrowService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EscrowController_1.name);
    }
    async getEscrowForOrder(orderId, userId) {
        try {
            const result = await this.escrowService.getEscrowForOrder(orderId, userId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Escrow and payment details retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching escrow for order:', error);
            throw error;
        }
    }
    async generatePaymentLink(orderId, userId) {
        try {
            const result = await this.escrowService.generatePaymentLink(orderId, userId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Payment link generated');
        }
        catch (error) {
            this.logger.error('Error generating payment link:', error);
            throw error;
        }
    }
    async getEscrowHistory() {
        try {
            const history = await this.escrowService.getEscrowHistory();
            return api_response_dto_1.ApiResponseDto.ok(history, 'Escrow history retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching escrow history:', error);
            throw error;
        }
    }
    async getEscrowStatus(orderId) {
        try {
            const escrow = await this.escrowService.getEscrowStatus(orderId);
            return api_response_dto_1.ApiResponseDto.ok(escrow, 'Escrow status retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching escrow status:', error);
            throw error;
        }
    }
    async releaseFunds(orderId, userId) {
        try {
            const order = await this.prisma.orders.findUnique({ where: { id: orderId } });
            if (!order)
                throw new custom_exceptions_1.NotFoundException('Order');
            if (order.buyerId !== userId) {
                throw new custom_exceptions_1.ForbiddenException('Only the buyer can release escrow');
            }
            const escrow = await this.escrowService.releaseFunds(orderId);
            return api_response_dto_1.ApiResponseDto.ok(escrow, 'Funds released successfully');
        }
        catch (error) {
            this.logger.error('Error releasing funds:', error);
            throw error;
        }
    }
    async refundFunds(orderId, reason, userId, req) {
        try {
            const role = req['userRole'];
            const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR';
            if (!isAdmin) {
                throw new custom_exceptions_1.ForbiddenException('Only an admin can refund escrow');
            }
            const escrow = await this.escrowService.refundFunds(orderId, reason);
            return api_response_dto_1.ApiResponseDto.ok(escrow, 'Funds refunded successfully');
        }
        catch (error) {
            this.logger.error('Error refunding funds:', error);
            throw error;
        }
    }
};
exports.EscrowController = EscrowController;
__decorate([
    (0, common_1.Get)('order/:orderId'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "getEscrowForOrder", null);
__decorate([
    Post('order/:orderId/pay'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "generatePaymentLink", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "getEscrowHistory", null);
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "getEscrowStatus", null);
__decorate([
    (0, common_1.Patch)(':orderId/release'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "releaseFunds", null);
__decorate([
    (0, common_1.Patch)(':orderId/refund'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "refundFunds", null);
exports.EscrowController = EscrowController = EscrowController_1 = __decorate([
    (0, common_1.Controller)('escrow'),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService,
        prisma_service_1.PrismaService])
], EscrowController);
//# sourceMappingURL=escrow.controller.js.map