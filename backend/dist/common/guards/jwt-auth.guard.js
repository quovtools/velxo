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
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../services/prisma.service");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    constructor(jwtService, configService, prisma) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(JwtAuthGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException('No token provided');
        }
        try {
            const secret = this.configService.get('JWT_SECRET') || 'velxo-fallback-secret-change-in-prod';
            const payload = await this.jwtService.verifyAsync(token, {
                secret,
            });
            const user = await this.prisma.users.findUnique({ where: { id: payload.sub } });
            if (!user) {
                throw new common_1.UnauthorizedException('Session expired, please sign in again');
            }
            request['user'] = payload;
            request['userId'] = payload.sub;
            request['userRole'] = payload.role;
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException)
                throw err;
            this.logger.warn('JWT verification failed:', err?.message);
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    extractToken(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader)
            return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer')
            return null;
        return parts[1];
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map