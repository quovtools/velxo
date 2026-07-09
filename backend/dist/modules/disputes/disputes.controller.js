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
var DisputesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesController = void 0;
const common_1 = require("@nestjs/common");
const disputes_service_1 = require("./disputes.service");
const create_dispute_dto_1 = require("./dto/create-dispute.dto");
const resolve_dispute_dto_1 = require("./dto/resolve-dispute.dto");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
function assertStaff(req) {
    const role = req['userRole'];
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
        throw new custom_exceptions_1.ForbiddenException('Admin or moderator access required');
    }
}
let DisputesController = DisputesController_1 = class DisputesController {
    constructor(disputesService) {
        this.disputesService = disputesService;
        this.logger = new common_1.Logger(DisputesController_1.name);
    }
    async createDispute(initiatorId, dto) {
        try {
            const dispute = await this.disputesService.createDispute(initiatorId, dto);
            return api_response_dto_1.ApiResponseDto.ok(dispute, 'Dispute created successfully');
        }
        catch (error) {
            this.logger.error('Error creating dispute:', error);
            throw error;
        }
    }
    async getOpenDisputes(req, limit) {
        try {
            assertStaff(req);
            const disputes = await this.disputesService.getOpenDisputes(limit);
            return api_response_dto_1.ApiResponseDto.ok(disputes, 'Open disputes retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching disputes:', error);
            throw error;
        }
    }
    async getDisputeById(req, disputeId) {
        try {
            assertStaff(req);
            const dispute = await this.disputesService.getDisputeById(disputeId);
            return api_response_dto_1.ApiResponseDto.ok(dispute, 'Dispute retrieved successfully');
        }
        catch (error) {
            this.logger.error('Error fetching dispute:', error);
            throw error;
        }
    }
    async resolveDispute(req, disputeId, resolverId, dto) {
        try {
            assertStaff(req);
            const dispute = await this.disputesService.resolveDispute(disputeId, resolverId, dto);
            return api_response_dto_1.ApiResponseDto.ok(dispute, 'Dispute resolved successfully');
        }
        catch (error) {
            this.logger.error('Error resolving dispute:', error);
            throw error;
        }
    }
    async addMessage(disputeId, senderId, content, attachments) {
        try {
            const message = await this.disputesService.addDisputeMessage(disputeId, senderId, content, attachments);
            return api_response_dto_1.ApiResponseDto.ok(message, 'Message added successfully');
        }
        catch (error) {
            this.logger.error('Error adding message:', error);
            throw error;
        }
    }
};
exports.DisputesController = DisputesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_dispute_dto_1.CreateDisputeDto]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "createDispute", null);
__decorate([
    (0, common_1.Get)('open'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "getOpenDisputes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "getDisputeById", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, resolve_dispute_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('content')),
    __param(3, (0, common_1.Body)('attachments')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "addMessage", null);
exports.DisputesController = DisputesController = DisputesController_1 = __decorate([
    (0, common_1.Controller)('disputes'),
    __metadata("design:paramtypes", [disputes_service_1.DisputesService])
], DisputesController);
//# sourceMappingURL=disputes.controller.js.map