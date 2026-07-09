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
var NotificationsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let NotificationsController = NotificationsController_1 = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationsController_1.name);
    }
    async getNotifications(userId) {
        try {
            const notifications = await this.notificationsService.getNotifications(userId);
            return api_response_dto_1.ApiResponseDto.ok(notifications, 'Notifications retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching notifications:', error);
            throw error;
        }
    }
    async getUnreadNotifications(userId) {
        try {
            const notifications = await this.notificationsService.getUnreadNotifications(userId);
            return api_response_dto_1.ApiResponseDto.ok(notifications, 'Unread notifications retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching unread notifications:', error);
            throw error;
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            const notification = await this.notificationsService.markAsRead(notificationId, userId);
            return api_response_dto_1.ApiResponseDto.ok(notification, 'Notification marked as read');
        }
        catch (error) {
            this.logger.error('Error marking notification as read:', error);
            throw error;
        }
    }
    async markAllAsRead(userId) {
        try {
            await this.notificationsService.markAllAsRead(userId);
            return api_response_dto_1.ApiResponseDto.ok(null, 'All notifications marked as read');
        }
        catch (error) {
            this.logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    async deleteNotification(notificationId, userId) {
        try {
            await this.notificationsService.deleteNotification(notificationId, userId);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Notification deleted');
        }
        catch (error) {
            this.logger.error('Error deleting notification:', error);
            throw error;
        }
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('unread'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getUnreadNotifications", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('mark-all-read'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "deleteNotification", null);
exports.NotificationsController = NotificationsController = NotificationsController_1 = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map