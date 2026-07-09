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
var SupportController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const support_service_1 = require("./support.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const client_1 = require("@prisma/client");
let SupportController = SupportController_1 = class SupportController {
    constructor(supportService) {
        this.supportService = supportService;
        this.logger = new common_1.Logger(SupportController_1.name);
    }
    async createTicket(userId, subject, category, priority) {
        try {
            const ticket = await this.supportService.createTicket(userId, subject, category, priority);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Support ticket created');
        }
        catch (error) {
            this.logger.error('Error creating support ticket:', error);
            throw error;
        }
    }
    async createComplaint(userId, orderId, description, category) {
        try {
            const ticket = await this.supportService.createOrderComplaint(userId, orderId, description, category);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Complaint filed successfully');
        }
        catch (error) {
            this.logger.error('Error filing complaint:', error);
            throw error;
        }
    }
    async getMyTickets(userId, limit) {
        try {
            const tickets = await this.supportService.getUserTickets(userId, limit);
            return api_response_dto_1.ApiResponseDto.ok(tickets, 'User tickets retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching user tickets:', error);
            throw error;
        }
    }
    async getTicket(ticketId, userId) {
        try {
            const ticket = await this.supportService.getTicketById(ticketId);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Ticket retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching ticket:', error);
            throw error;
        }
    }
    async getOpenTickets(limit) {
        try {
            const tickets = await this.supportService.getOpenTickets(limit);
            return api_response_dto_1.ApiResponseDto.ok(tickets, 'Open tickets retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching open tickets:', error);
            throw error;
        }
    }
    async assignTicket(ticketId, assigneeId) {
        try {
            const ticket = await this.supportService.assignTicket(ticketId, assigneeId);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Ticket assigned');
        }
        catch (error) {
            this.logger.error('Error assigning ticket:', error);
            throw error;
        }
    }
    async resolveTicket(ticketId, resolutionNotes) {
        try {
            const ticket = await this.supportService.resolveTicket(ticketId, resolutionNotes);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Ticket resolved');
        }
        catch (error) {
            this.logger.error('Error resolving ticket:', error);
            throw error;
        }
    }
    async getStats() {
        try {
            const stats = await this.supportService.getTicketStats();
            return api_response_dto_1.ApiResponseDto.ok(stats, 'Support stats retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching support stats:', error);
            throw error;
        }
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Post)('tickets'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('subject')),
    __param(2, (0, common_1.Body)('category')),
    __param(3, (0, common_1.Body)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Post)('complaints'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('orderId')),
    __param(2, (0, common_1.Body)('description')),
    __param(3, (0, common_1.Body)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createComplaint", null);
__decorate([
    (0, common_1.Get)('tickets/me'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getMyTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getTicket", null);
__decorate([
    (0, common_1.Get)('tickets'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getOpenTickets", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/assign'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('assigneeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "assignTicket", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/resolve'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('resolutionNotes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "resolveTicket", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getStats", null);
exports.SupportController = SupportController = SupportController_1 = __decorate([
    (0, common_1.Controller)('support'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map