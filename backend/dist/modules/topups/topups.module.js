"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopupsModule = void 0;
const common_1 = require("@nestjs/common");
const topups_controller_1 = require("./topups.controller");
const topups_service_1 = require("./topups.service");
const prisma_service_1 = require("../../common/services/prisma.service");
const orders_module_1 = require("../orders/orders.module");
let TopupsModule = class TopupsModule {
};
exports.TopupsModule = TopupsModule;
exports.TopupsModule = TopupsModule = __decorate([
    (0, common_1.Module)({
        controllers: [topups_controller_1.TopupsController],
        providers: [topups_service_1.TopupsService, prisma_service_1.PrismaService],
        exports: [topups_service_1.TopupsService],
        imports: [orders_module_1.OrdersModule],
    })
], TopupsModule);
//# sourceMappingURL=topups.module.js.map