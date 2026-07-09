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
var GigsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigsController = void 0;
const common_1 = require("@nestjs/common");
const gigs_service_1 = require("./gigs.service");
const create_gig_dto_1 = require("./dto/create-gig.dto");
const admin_password_guard_1 = require("../../common/guards/admin-password.guard");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let GigsController = GigsController_1 = class GigsController {
    constructor(gigsService) {
        this.gigsService = gigsService;
        this.logger = new common_1.Logger(GigsController_1.name);
    }
    async getPublicGigs(gameName, accountType, search) {
        try {
            const gigs = await this.gigsService.getPublicGigs({ gameName, accountType, search });
            return api_response_dto_1.ApiResponseDto.ok(gigs, 'Gigs retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching gigs:', error);
            throw error;
        }
    }
    async getGig(id) {
        try {
            const gig = await this.gigsService.getGigById(id);
            return api_response_dto_1.ApiResponseDto.ok(gig, 'Gig retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching gig:', error);
            throw error;
        }
    }
    async getMyGigs(userId) {
        try {
            const seller = await this.resolveSeller(userId);
            const gigs = await this.gigsService.getMyGigs(seller.id);
            return api_response_dto_1.ApiResponseDto.ok(gigs, 'Your gigs retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching my gigs:', error);
            throw error;
        }
    }
    async createGig(userId, dto) {
        try {
            const seller = await this.resolveSeller(userId);
            const gig = await this.gigsService.createGig(seller.id, dto);
            return api_response_dto_1.ApiResponseDto.ok(gig, 'Gig submitted for review');
        }
        catch (error) {
            this.logger.error('Error creating gig:', error);
            throw error;
        }
    }
    async updateGig(id, userId, dto) {
        try {
            const seller = await this.resolveSeller(userId);
            const gig = await this.gigsService.updateGig(id, seller.id, dto);
            return api_response_dto_1.ApiResponseDto.ok(gig, 'Gig updated');
        }
        catch (error) {
            this.logger.error('Error updating gig:', error);
            throw error;
        }
    }
    async deleteGig(id, userId) {
        try {
            const seller = await this.resolveSeller(userId);
            await this.gigsService.deleteGig(id, seller.id);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Gig deleted');
        }
        catch (error) {
            this.logger.error('Error deleting gig:', error);
            throw error;
        }
    }
    async getAllAdmin(status, gameName) {
        try {
            const gigs = await this.gigsService.getAllGigsAdmin({ status, gameName });
            return api_response_dto_1.ApiResponseDto.ok(gigs, 'All gigs retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching admin gigs:', error);
            throw error;
        }
    }
    async reviewGig(id, dto) {
        try {
            const gig = await this.gigsService.reviewGig(id, dto.status, dto.rejectionReason);
            return api_response_dto_1.ApiResponseDto.ok(gig, 'Gig reviewed');
        }
        catch (error) {
            this.logger.error('Error reviewing gig:', error);
            throw error;
        }
    }
    async adminDelete(id) {
        try {
            await this.gigsService.adminDeleteGig(id);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Gig deleted');
        }
        catch (error) {
            this.logger.error('Error deleting gig (admin):', error);
            throw error;
        }
    }
    async purchase(id, buyerId, quantity, buyerNote) {
        try {
            const order = await this.gigsService.purchase(id, buyerId, quantity && quantity > 0 ? quantity : 1, buyerNote);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Gig order created');
        }
        catch (error) {
            this.logger.error('Error purchasing gig:', error);
            throw error;
        }
    }
    async resolveSeller(userId) {
        const seller = await this.gigsService['prisma'].sellers.findUnique({ where: { userId } });
        if (!seller) {
            throw new common_1.ForbiddenException('You must be a seller to manage gigs');
        }
        return seller;
    }
};
exports.GigsController = GigsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('game')),
    __param(1, (0, common_1.Query)('accountType')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "getPublicGigs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "getGig", null);
__decorate([
    (0, common_1.Get)('me/listings'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "getMyGigs", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_gig_dto_1.CreateGigDto]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "createGig", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_gig_dto_1.UpdateGigDto]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "updateGig", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "deleteGig", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('game')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "getAllAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/:id/review'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_gig_dto_1.AdminReviewGigDto]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "reviewGig", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "adminDelete", null);
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
], GigsController.prototype, "purchase", null);
exports.GigsController = GigsController = GigsController_1 = __decorate([
    (0, common_1.Controller)('gigs'),
    __metadata("design:paramtypes", [gigs_service_1.GigsService])
], GigsController);
//# sourceMappingURL=gigs.controller.js.map