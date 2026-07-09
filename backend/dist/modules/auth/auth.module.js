"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../../common/services/prisma.service");
const email_module_1 = require("../email/email.module");
const affiliate_module_1 = require("../affiliate/affiliate.module");
const config_1 = require("@nestjs/config");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'velxo-fallback-secret-change-in-prod',
                    signOptions: { expiresIn: '7d' },
                }),
            }),
            email_module_1.EmailModule,
            affiliate_module_1.AffiliateModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, prisma_service_1.PrismaService],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map