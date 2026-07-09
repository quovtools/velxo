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
var MarqueeController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarqueeController = void 0;
const common_1 = require("@nestjs/common");
const marquee_service_1 = require("./marquee.service");
const create_marquee_dto_1 = require("./dto/create-marquee.dto");
const admin_password_guard_1 = require("../../common/guards/admin-password.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let MarqueeController = MarqueeController_1 = class MarqueeController {
    constructor(marqueeService) {
        this.marqueeService = marqueeService;
        this.logger = new common_1.Logger(MarqueeController_1.name);
    }
    async getActiveItems() {
        try {
            const items = await this.marqueeService.getActiveItems();
            return api_response_dto_1.ApiResponseDto.ok(items, 'News retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching marquee:', error);
            throw error;
        }
    }
    async getAllItems() {
        try {
            const items = await this.marqueeService.getAllItems();
            return api_response_dto_1.ApiResponseDto.ok(items, 'All news retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching all marquee:', error);
            throw error;
        }
    }
    async createItem(dto) {
        try {
            const item = await this.marqueeService.createItem(dto);
            return api_response_dto_1.ApiResponseDto.ok(item, 'News created');
        }
        catch (error) {
            this.logger.error('Error creating marquee:', error);
            throw error;
        }
    }
    async updateItem(id, dto) {
        try {
            const item = await this.marqueeService.updateItem(id, dto);
            return api_response_dto_1.ApiResponseDto.ok(item, 'News updated');
        }
        catch (error) {
            this.logger.error('Error updating marquee:', error);
            throw error;
        }
    }
    async deleteItem(id) {
        try {
            await this.marqueeService.deleteItem(id);
            return api_response_dto_1.ApiResponseDto.ok(null, 'News deleted');
        }
        catch (error) {
            this.logger.error('Error deleting marquee:', error);
            throw error;
        }
    }
};
exports.MarqueeController = MarqueeController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarqueeController.prototype, "getActiveItems", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarqueeController.prototype, "getAllItems", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_marquee_dto_1.CreateMarqueeDto]),
    __metadata("design:returntype", Promise)
], MarqueeController.prototype, "createItem", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_marquee_dto_1.UpdateMarqueeDto]),
    __metadata("design:returntype", Promise)
], MarqueeController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarqueeController.prototype, "deleteItem", null);
exports.MarqueeController = MarqueeController = MarqueeController_1 = __decorate([
    (0, common_1.Controller)('marquee'),
    __metadata("design:paramtypes", [marquee_service_1.MarqueeService])
], MarqueeController);
//# sourceMappingURL=marquee.controller.js.map