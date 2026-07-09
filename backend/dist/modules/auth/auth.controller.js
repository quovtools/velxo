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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async register(dto) {
        try {
            const result = await this.authService.register(dto);
            return api_response_dto_1.ApiResponseDto.ok(result, 'User registered successfully');
        }
        catch (error) {
            this.logger.error('Registration error:', error);
            throw error;
        }
    }
    async login(dto) {
        try {
            const result = await this.authService.login(dto);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Login successful');
        }
        catch (error) {
            this.logger.error('Login error:', error);
            throw error;
        }
    }
    async getCurrentUser(userId) {
        try {
            const user = await this.authService.getCurrentUser(userId);
            return api_response_dto_1.ApiResponseDto.ok(user, 'User profile retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching current user:', error);
            throw error;
        }
    }
    async logout(userId) {
        await this.authService.logout(userId).catch(() => { });
        return api_response_dto_1.ApiResponseDto.ok(null, 'Logout successful');
    }
    async verifyEmail(token) {
        try {
            const user = await this.authService.verifyEmailToken(token);
            return api_response_dto_1.ApiResponseDto.ok(user, 'Email verified successfully');
        }
        catch (error) {
            this.logger.error('Email verification error:', error);
            throw error;
        }
    }
    async resendVerification(userId) {
        try {
            const result = await this.authService.resendVerificationEmail(userId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Verification email sent');
        }
        catch (error) {
            this.logger.error('Resend verification error:', error);
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            await this.authService.changePassword(userId, currentPassword, newPassword);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Password changed successfully');
        }
        catch (error) {
            this.logger.error('Change password error:', error);
            throw error;
        }
    }
    async forgotPassword(email) {
        await this.authService.forgotPassword(email).catch(() => { });
        return api_response_dto_1.ApiResponseDto.ok(null, 'If that email exists, a reset link was sent');
    }
    async resetPassword(token, newPassword) {
        try {
            await this.authService.resetPasswordWithToken(token, newPassword);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Password reset successfully');
        }
        catch (error) {
            this.logger.error('Password reset error:', error);
            throw error;
        }
    }
    googleLogin(req, res) {
        res.redirect(this.authService.getGoogleAuthUrl(req));
    }
    async googleCallback(req, code, res) {
        try {
            const result = await this.authService.handleGoogleCallback(code, req);
            const frontendUrl = process.env.FRONTEND_URL || 'https://market.velxo.shop';
            const u = result.user;
            const hash = [
                `token=${result.accessToken}`,
                `userId=${u.id}`,
                `email=${encodeURIComponent(u.email || '')}`,
                `firstName=${encodeURIComponent(u.firstName || '')}`,
                `lastName=${encodeURIComponent(u.lastName || '')}`,
                `role=${encodeURIComponent(u.role || 'BUYER')}`,
                `emailVerified=${u.emailVerified ? 1 : 0}`,
            ].join('&');
            res.redirect(`${frontendUrl}/auth/callback#${hash}`);
        }
        catch (error) {
            this.logger.error('Google OAuth callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'https://market.velxo.shop';
            res.redirect(`${frontendUrl}/auth/login?error=google_failed`);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    (0, common_1.HttpCode)(200),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    (0, common_1.HttpCode)(200),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('currentPassword')),
    __param(2, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)('token')),
    __param(1, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map