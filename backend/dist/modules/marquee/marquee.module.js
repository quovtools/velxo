"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarqueeModule = void 0;
const common_1 = require("@nestjs/common");
const marquee_controller_1 = require("./marquee.controller");
const marquee_service_1 = require("./marquee.service");
const prisma_service_1 = require("../../common/services/prisma.service");
let MarqueeModule = class MarqueeModule {
};
exports.MarqueeModule = MarqueeModule;
exports.MarqueeModule = MarqueeModule = __decorate([
    (0, common_1.Module)({
        controllers: [marquee_controller_1.MarqueeController],
        providers: [marquee_service_1.MarqueeService, prisma_service_1.PrismaService],
        exports: [marquee_service_1.MarqueeService],
    })
], MarqueeModule);
//# sourceMappingURL=marquee.module.js.map