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
var MessagesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const create_conversation_dto_1 = require("./dto/create-conversation.dto");
let MessagesController = MessagesController_1 = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
        this.logger = new common_1.Logger(MessagesController_1.name);
    }
    async getConversations(userId, limit) {
        try {
            const conversations = await this.messagesService.getConversations(userId, limit);
            return api_response_dto_1.ApiResponseDto.ok(conversations, 'Conversations retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching conversations:', error);
            throw error;
        }
    }
    async getUnreadCount(userId) {
        try {
            const result = await this.messagesService.getUnreadCount(userId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Unread count retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching unread count:', error);
            throw error;
        }
    }
    async createConversation(userId, dto) {
        try {
            const { buyerId, sellerId, orderId } = await this.messagesService.resolveParticipants(userId, dto);
            if (buyerId === sellerId) {
                throw new common_1.ForbiddenException('You cannot start a conversation with yourself');
            }
            const conversation = await this.messagesService.getOrCreateConversation(buyerId, sellerId, orderId);
            return api_response_dto_1.ApiResponseDto.ok(conversation, 'Conversation ready');
        }
        catch (error) {
            this.logger.error('Error creating conversation:', error);
            throw error;
        }
    }
    async getConversationMessages(conversationId, userId, limit) {
        try {
            const messages = await this.messagesService.getConversationMessages(conversationId, userId, limit);
            return api_response_dto_1.ApiResponseDto.ok(messages, 'Messages retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching messages:', error);
            throw error;
        }
    }
    async sendMessage(conversationId, senderId, content, attachments) {
        try {
            const message = await this.messagesService.sendMessage(conversationId, senderId, content, attachments);
            return api_response_dto_1.ApiResponseDto.ok(message, 'Message sent successfully');
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            throw error;
        }
    }
    async markAsRead(conversationId, userId) {
        try {
            await this.messagesService.markMessagesAsRead(conversationId, userId);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Messages marked as read');
        }
        catch (error) {
            this.logger.error('Error marking messages as read:', error);
            throw error;
        }
    }
    async deleteMessage(messageId, userId) {
        try {
            await this.messagesService.deleteMessage(messageId, userId);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Message deleted');
        }
        catch (error) {
            this.logger.error('Error deleting message:', error);
            throw error;
        }
    }
    async blockConversation(conversationId, userId) {
        try {
            const conversation = await this.messagesService.blockConversation(conversationId, userId);
            return api_response_dto_1.ApiResponseDto.ok(conversation, 'Conversation blocked');
        }
        catch (error) {
            this.logger.error('Error blocking conversation:', error);
            throw error;
        }
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Post)('conversation'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_conversation_dto_1.CreateConversationDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversation/:conversationId'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getConversationMessages", null);
__decorate([
    (0, common_1.Post)('conversation/:conversationId/send'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('content')),
    __param(3, (0, common_1.Body)('attachments')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)('conversation/:conversationId/mark-read'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Delete)('message/:messageId'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)('conversation/:conversationId/block'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "blockConversation", null);
exports.MessagesController = MessagesController = MessagesController_1 = __decorate([
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map