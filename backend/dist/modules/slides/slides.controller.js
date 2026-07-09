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
var SlidesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidesController = void 0;
const common_1 = require("@nestjs/common");
const slides_service_1 = require("./slides.service");
const create_slide_dto_1 = require("./dto/create-slide.dto");
const admin_password_guard_1 = require("../../common/guards/admin-password.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let SlidesController = SlidesController_1 = class SlidesController {
    constructor(slidesService) {
        this.slidesService = slidesService;
        this.logger = new common_1.Logger(SlidesController_1.name);
    }
    async getActiveSlides() {
        try {
            const slides = await this.slidesService.getActiveSlides();
            return api_response_dto_1.ApiResponseDto.ok(slides, 'Slides retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching slides:', error);
            throw error;
        }
    }
    async getAllSlides() {
        try {
            const slides = await this.slidesService.getAllSlides();
            return api_response_dto_1.ApiResponseDto.ok(slides, 'All slides retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching all slides:', error);
            throw error;
        }
    }
    async createSlide(dto) {
        try {
            const slide = await this.slidesService.createSlide(dto);
            return api_response_dto_1.ApiResponseDto.ok(slide, 'Slide created');
        }
        catch (error) {
            this.logger.error('Error creating slide:', error);
            throw error;
        }
    }
    async updateSlide(id, dto) {
        try {
            const slide = await this.slidesService.updateSlide(id, dto);
            return api_response_dto_1.ApiResponseDto.ok(slide, 'Slide updated');
        }
        catch (error) {
            this.logger.error('Error updating slide:', error);
            throw error;
        }
    }
    async deleteSlide(id) {
        try {
            await this.slidesService.deleteSlide(id);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Slide deleted');
        }
        catch (error) {
            this.logger.error('Error deleting slide:', error);
            throw error;
        }
    }
};
exports.SlidesController = SlidesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SlidesController.prototype, "getActiveSlides", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SlidesController.prototype, "getAllSlides", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_slide_dto_1.CreateSlideDto]),
    __metadata("design:returntype", Promise)
], SlidesController.prototype, "createSlide", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_slide_dto_1.UpdateSlideDto]),
    __metadata("design:returntype", Promise)
], SlidesController.prototype, "updateSlide", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlidesController.prototype, "deleteSlide", null);
exports.SlidesController = SlidesController = SlidesController_1 = __decorate([
    (0, common_1.Controller)('slides'),
    __metadata("design:paramtypes", [slides_service_1.SlidesService])
], SlidesController);
//# sourceMappingURL=slides.controller.js.map