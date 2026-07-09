import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/services/prisma.service';
export declare class JwtAuthGuard implements CanActivate {
    private jwtService;
    private configService;
    private prisma;
    private readonly logger;
    constructor(jwtService: JwtService, configService: ConfigService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractToken;
}
