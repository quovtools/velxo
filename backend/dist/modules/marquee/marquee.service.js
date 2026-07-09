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
var MarqueeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarqueeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
let MarqueeService = MarqueeService_1 = class MarqueeService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MarqueeService_1.name);
    }
    async getActiveItems() {
        return this.prisma.marqueeItems.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getAllItems() {
        return this.prisma.marqueeItems.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }
    async createItem(data) {
        return this.prisma.marqueeItems.create({ data });
    }
    async updateItem(id, data) {
        return this.prisma.marqueeItems.update({ where: { id }, data });
    }
    async deleteItem(id) {
        return this.prisma.marqueeItems.delete({ where: { id } });
    }
};
exports.MarqueeService = MarqueeService;
exports.MarqueeService = MarqueeService = MarqueeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarqueeService);
//# sourceMappingURL=marquee.service.js.map