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
var SellersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellersController = void 0;
const common_1 = require("@nestjs/common");
const sellers_service_1 = require("./sellers.service");
const create_seller_dto_1 = require("./dto/create-seller.dto");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let SellersController = SellersController_1 = class SellersController {
    constructor(sellersService) {
        this.sellersService = sellersService;
        this.logger = new common_1.Logger(SellersController_1.name);
    }
    async createSeller(userId, dto) {
        try {
            const seller = await this.sellersService.createSeller(userId, dto);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'Seller account created successfully');
        }
        catch (error) {
            this.logger.error('Error creating seller:', error);
            throw error;
        }
    }
    async getMyProfile(userId) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'Seller profile retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching seller profile:', error);
            throw error;
        }
    }
    async getTopSellers(limit) {
        try {
            const sellers = await this.sellersService.getTopSellers(limit);
            return api_response_dto_1.ApiResponseDto.ok(sellers, 'Top sellers retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching top sellers:', error);
            throw error;
        }
    }
    async getSellerProfile(sellerId) {
        try {
            const seller = await this.sellersService.getSellerProfile(sellerId);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'Seller profile retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching seller profile:', error);
            throw error;
        }
    }
    async reportSeller(sellerId, reporterId, reason, details) {
        try {
            const result = await this.sellersService.reportSeller(sellerId, reporterId, reason, details);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Report submitted successfully');
        }
        catch (error) {
            this.logger.error('Error reporting seller:', error);
            throw error;
        }
    }
    async updateProfile(userId, dto) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            const updated = await this.sellersService.updateSeller(seller.id, dto);
            return api_response_dto_1.ApiResponseDto.ok(updated, 'Seller profile updated');
        }
        catch (error) {
            this.logger.error('Error updating seller:', error);
            throw error;
        }
    }
    async uploadDocuments(userId, documents) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            const updated = await this.sellersService.uploadVerificationDocuments(seller.id, documents);
            return api_response_dto_1.ApiResponseDto.ok(updated, 'Documents uploaded successfully');
        }
        catch (error) {
            this.logger.error('Error uploading documents:', error);
            throw error;
        }
    }
    async submitKyc(userId, dto) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            const updated = await this.sellersService.submitKyc(seller.id, dto);
            return api_response_dto_1.ApiResponseDto.ok(updated, 'KYC submitted successfully');
        }
        catch (error) {
            this.logger.error('Error submitting KYC:', error);
            throw error;
        }
    }
    async updateSettings(userId, dto) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            const updated = await this.sellersService.updateSeller(seller.id, {
                storeName: dto.storeName,
                storeDescription: dto.storeDescription,
                responseTime: dto.responseTime,
            });
            return api_response_dto_1.ApiResponseDto.ok(updated, 'Seller settings updated');
        }
        catch (error) {
            this.logger.error('Error updating seller settings:', error);
            throw error;
        }
    }
    async getPublicStore(id) {
        try {
            const store = await this.sellersService.getPublicStore(id);
            return api_response_dto_1.ApiResponseDto.ok(store, 'Store retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching public store:', error);
            throw error;
        }
    }
    async getPlans() {
        try {
            return api_response_dto_1.ApiResponseDto.ok(this.sellersService.getPlans(), 'Subscription plans');
        }
        catch (error) {
            this.logger.error('Error fetching plans:', error);
            throw error;
        }
    }
    async getMySubscription(userId) {
        try {
            const sub = await this.sellersService.getMySubscription(userId);
            return api_response_dto_1.ApiResponseDto.ok(sub, 'Subscription status retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching subscription:', error);
            throw error;
        }
    }
    async checkout(userId, plan, provider, callbackUrl) {
        try {
            const result = await this.sellersService.createSubscription(userId, plan, provider || 'PAYMENT_IO', callbackUrl);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Subscription checkout created');
        }
        catch (error) {
            this.logger.error('Error creating subscription checkout:', error);
            throw error;
        }
    }
    async subscribe(userId, plan, durationMonths) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            const updated = await this.sellersService.subscribe(seller.id, plan, durationMonths || 1);
            return api_response_dto_1.ApiResponseDto.ok(updated, `Subscribed to ${plan}`);
        }
        catch (error) {
            this.logger.error('Error subscribing seller:', error);
            throw error;
        }
    }
    async updateResponseTime(userId, responseTime) {
        try {
            const seller = await this.sellersService.getSellerByUserId(userId);
            const updated = await this.sellersService.updateSeller(seller.id, { responseTime });
            return api_response_dto_1.ApiResponseDto.ok(updated, 'Response time updated');
        }
        catch (error) {
            this.logger.error('Error updating response time:', error);
            throw error;
        }
    }
};
exports.SellersController = SellersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_seller_dto_1.CreateSellerDto]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "createSeller", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)('top-sellers'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "getTopSellers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "getSellerProfile", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __param(3, (0, common_1.Body)('details')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "reportSeller", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_seller_dto_1.UpdateSellerDto]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('verification-documents'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "uploadDocuments", null);
__decorate([
    (0, common_1.Post)('kyc/submit'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_seller_dto_1.SubmitKycDto]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "submitKyc", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)(':id/store'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "getPublicStore", null);
__decorate([
    (0, common_1.Get)('subscription/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('subscription/me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Post)('subscription/checkout'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('plan')),
    __param(2, (0, common_1.Body)('provider')),
    __param(3, (0, common_1.Body)('callbackUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('plan')),
    __param(2, (0, common_1.Body)('durationMonths')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Patch)('response-time'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('responseTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SellersController.prototype, "updateResponseTime", null);
exports.SellersController = SellersController = SellersController_1 = __decorate([
    (0, common_1.Controller)('sellers'),
    __metadata("design:paramtypes", [sellers_service_1.SellersService])
], SellersController);
//# sourceMappingURL=sellers.controller.js.map