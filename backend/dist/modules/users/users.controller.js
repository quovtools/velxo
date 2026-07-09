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
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let UsersController = UsersController_1 = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
        this.logger = new common_1.Logger(UsersController_1.name);
    }
    async getProfile(userId) {
        try {
            const profile = await this.usersService.getUserProfile(userId);
            return api_response_dto_1.ApiResponseDto.ok(profile, 'User profile retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching profile:', error);
            throw error;
        }
    }
    async updateProfile(userId, firstName, lastName, phone, notificationPreferences, preferences) {
        try {
            const profile = await this.usersService.updateProfile(userId, {
                firstName,
                lastName,
                phone,
                notificationPreferences,
                preferences,
            });
            return api_response_dto_1.ApiResponseDto.ok(profile, 'Profile updated successfully');
        }
        catch (error) {
            this.logger.error('Error updating profile:', error);
            throw error;
        }
    }
    async uploadAvatar(userId, avatarUrl) {
        try {
            const user = await this.usersService.uploadAvatar(userId, avatarUrl);
            return api_response_dto_1.ApiResponseDto.ok(user, 'Avatar uploaded successfully');
        }
        catch (error) {
            this.logger.error('Error uploading avatar:', error);
            throw error;
        }
    }
    async getStats(userId) {
        try {
            const stats = await this.usersService.getUserStats(userId);
            return api_response_dto_1.ApiResponseDto.ok(stats, 'User stats retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching stats:', error);
            throw error;
        }
    }
    async searchUsers(query, limit) {
        try {
            const users = await this.usersService.searchUsers(query, limit);
            return api_response_dto_1.ApiResponseDto.ok(users, 'Users found');
        }
        catch (error) {
            this.logger.error('Error searching users:', error);
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const profile = await this.usersService.getUserProfile(userId);
            return api_response_dto_1.ApiResponseDto.ok(profile, 'User profile retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching user:', error);
            throw error;
        }
    }
    async deactivateAccount(userId) {
        try {
            await this.usersService.deactivateAccount(userId);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Account deactivated');
        }
        catch (error) {
            this.logger.error('Error deactivating account:', error);
            throw error;
        }
    }
    async reactivateAccount(userId) {
        try {
            const user = await this.usersService.reactivateAccount(userId);
            return api_response_dto_1.ApiResponseDto.ok(user, 'Account reactivated');
        }
        catch (error) {
            this.logger.error('Error reactivating account:', error);
            throw error;
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('firstName')),
    __param(2, (0, common_1.Body)('lastName')),
    __param(3, (0, common_1.Body)('phone')),
    __param(4, (0, common_1.Body)('notificationPreferences')),
    __param(5, (0, common_1.Body)('preferences')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('avatarUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Patch)('me/deactivate'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivateAccount", null);
__decorate([
    (0, common_1.Post)('me/reactivate'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "reactivateAccount", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map