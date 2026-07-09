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
var ListingsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsController = void 0;
const common_1 = require("@nestjs/common");
const listings_service_1 = require("./listings.service");
const create_listing_dto_1 = require("./dto/create-listing.dto");
const search_listing_dto_1 = require("./dto/search-listing.dto");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let ListingsController = ListingsController_1 = class ListingsController {
    constructor(listingsService) {
        this.listingsService = listingsService;
        this.logger = new common_1.Logger(ListingsController_1.name);
    }
    async createListing(userId, dto) {
        try {
            const listing = await this.listingsService.createListing(userId, dto);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing created successfully');
        }
        catch (error) {
            this.logger.error('Error creating listing:', error);
            throw error;
        }
    }
    async searchListings(dto) {
        try {
            const result = await this.listingsService.searchListings(dto);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Listings retrieved successfully');
        }
        catch (error) {
            this.logger.error('Error searching listings:', error);
            throw error;
        }
    }
    async getFeaturedListings(limit) {
        try {
            const listings = await this.listingsService.getFeaturedListings(limit);
            return api_response_dto_1.ApiResponseDto.ok(listings, 'Featured listings retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching featured listings:', error);
            throw error;
        }
    }
    async getListingById(id) {
        try {
            const listing = await this.listingsService.getListingById(id);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing retrieved successfully');
        }
        catch (error) {
            this.logger.error('Error fetching listing:', error);
            throw error;
        }
    }
    async updateListing(id, userId, dto) {
        try {
            const listing = await this.listingsService.updateListing(id, userId, dto);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing updated successfully');
        }
        catch (error) {
            this.logger.error('Error updating listing:', error);
            throw error;
        }
    }
    async deleteListing(id, userId) {
        try {
            await this.listingsService.deleteListing(id, userId);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Listing deleted successfully');
        }
        catch (error) {
            this.logger.error('Error deleting listing:', error);
            throw error;
        }
    }
};
exports.ListingsController = ListingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_listing_dto_1.CreateListingDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "createListing", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_listing_dto_1.SearchListingDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "searchListings", null);
__decorate([
    (0, common_1.Get)('featured'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "getFeaturedListings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "getListingById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "updateListing", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "deleteListing", null);
exports.ListingsController = ListingsController = ListingsController_1 = __decorate([
    (0, common_1.Controller)('listings'),
    __metadata("design:paramtypes", [listings_service_1.ListingsService])
], ListingsController);
//# sourceMappingURL=listings.controller.js.map