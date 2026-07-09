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
var SlidesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
let SlidesService = SlidesService_1 = class SlidesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SlidesService_1.name);
    }
    async getActiveSlides() {
        return this.prisma.gameSlides.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getAllSlides() {
        return this.prisma.gameSlides.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }
    async createSlide(data) {
        return this.prisma.gameSlides.create({ data });
    }
    async updateSlide(id, data) {
        return this.prisma.gameSlides.update({ where: { id }, data });
    }
    async deleteSlide(id) {
        return this.prisma.gameSlides.delete({ where: { id } });
    }
};
exports.SlidesService = SlidesService;
exports.SlidesService = SlidesService = SlidesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SlidesService);
//# sourceMappingURL=slides.service.js.map