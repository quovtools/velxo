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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateController = void 0;
const common_1 = require("@nestjs/common");
const affiliate_service_1 = require("./affiliate.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let AffiliateController = class AffiliateController {
    constructor(affiliateService) {
        this.affiliateService = affiliateService;
    }
    async getMyReferral(userId) {
        const ref = await this.affiliateService.getMyReferral(userId);
        return api_response_dto_1.ApiResponseDto.ok(ref, 'Referral retrieved');
    }
    async getMyStats(userId) {
        const stats = await this.affiliateService.getStats(userId);
        return api_response_dto_1.ApiResponseDto.ok(stats, 'Stats retrieved');
    }
    async trackClick(code) {
        await this.affiliateService.trackClick(code);
        return api_response_dto_1.ApiResponseDto.ok(null, 'Click tracked');
    }
    async getAllReferrals(limit) {
        const referrals = await this.affiliateService.getAllReferrals(limit);
        return api_response_dto_1.ApiResponseDto.ok(referrals, 'All referrals retrieved');
    }
};
exports.AffiliateController = AffiliateController;
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "getMyReferral", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Post)('click/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "trackClick", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.RequireRoles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "getAllReferrals", null);
exports.AffiliateController = AffiliateController = __decorate([
    (0, common_1.Controller)('affiliate'),
    __metadata("design:paramtypes", [affiliate_service_1.AffiliateService])
], AffiliateController);
//# sourceMappingURL=affiliate.controller.js.map