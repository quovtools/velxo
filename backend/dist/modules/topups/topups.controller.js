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
var TopupsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopupsController = void 0;
const common_1 = require("@nestjs/common");
const topups_service_1 = require("./topups.service");
const create_topup_dto_1 = require("./dto/create-topup.dto");
const admin_password_guard_1 = require("../../common/guards/admin-password.guard");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let TopupsController = TopupsController_1 = class TopupsController {
    constructor(topupsService) {
        this.topupsService = topupsService;
        this.logger = new common_1.Logger(TopupsController_1.name);
    }
    async getActiveProducts(gameName) {
        try {
            const products = await this.topupsService.getActiveProducts(gameName);
            return api_response_dto_1.ApiResponseDto.ok(products, 'Top-ups retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching top-ups:', error);
            throw error;
        }
    }
    async getProduct(id) {
        try {
            const product = await this.topupsService.getProductById(id);
            return api_response_dto_1.ApiResponseDto.ok(product, 'Top-up retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching top-up:', error);
            throw error;
        }
    }
    async getAllProducts() {
        try {
            const products = await this.topupsService.getAllProducts();
            return api_response_dto_1.ApiResponseDto.ok(products, 'All top-ups retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching all top-ups:', error);
            throw error;
        }
    }
    async createProduct(dto) {
        try {
            const product = await this.topupsService.createProduct(dto);
            return api_response_dto_1.ApiResponseDto.ok(product, 'Top-up created');
        }
        catch (error) {
            this.logger.error('Error creating top-up:', error);
            throw error;
        }
    }
    async updateProduct(id, dto) {
        try {
            const product = await this.topupsService.updateProduct(id, dto);
            return api_response_dto_1.ApiResponseDto.ok(product, 'Top-up updated');
        }
        catch (error) {
            this.logger.error('Error updating top-up:', error);
            throw error;
        }
    }
    async deleteProduct(id) {
        try {
            await this.topupsService.deleteProduct(id);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Top-up deleted');
        }
        catch (error) {
            this.logger.error('Error deleting top-up:', error);
            throw error;
        }
    }
    async purchase(id, buyerId, quantity, buyerNote) {
        try {
            const order = await this.topupsService.purchase(buyerId, id, quantity && quantity > 0 ? quantity : 1, buyerNote);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Top-up order created');
        }
        catch (error) {
            this.logger.error('Error purchasing top-up:', error);
            throw error;
        }
    }
};
exports.TopupsController = TopupsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('game')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "getActiveProducts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "getAllProducts", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_topup_dto_1.CreateTopupDto]),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_topup_dto_1.UpdateTopupDto]),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Post)(':id/purchase'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('quantity')),
    __param(3, (0, common_1.Body)('buyerNote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], TopupsController.prototype, "purchase", null);
exports.TopupsController = TopupsController = TopupsController_1 = __decorate([
    (0, common_1.Controller)('topups'),
    __metadata("design:paramtypes", [topups_service_1.TopupsService])
], TopupsController);
//# sourceMappingURL=topups.controller.js.map