import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '@/common/services/prisma.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import { EmailService } from '@/shared/email.service';
import { AffiliateService } from '@/modules/affiliate/affiliate.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private emailService;
    private affiliateService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService, affiliateService: AffiliateService);
    private signToken;
    private googleRedirectUri;
    getGoogleAuthUrl(req?: Request): string;
    private signVerificationToken;
    register(dto: RegisterDto): Promise<{
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
        };
        accessToken: string;
        emailSent: boolean;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.Role;
            avatarUrl: string;
            emailVerified: boolean;
        };
        accessToken: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        createdAt: Date;
        emailVerified: boolean;
        phone: string;
        avatarUrl: string;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue;
    }>;
    verifyEmailToken(token: string): Promise<{
        email: string;
        id: string;
        emailVerified: boolean;
    }>;
    resendVerificationEmail(userId: string): Promise<{
        alreadyVerified: boolean;
        sent?: undefined;
    } | {
        sent: boolean;
        alreadyVerified?: undefined;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    forgotPassword(email: string): Promise<void>;
    resetPasswordWithToken(token: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    logout(userId: string): Promise<{
        success: boolean;
    }>;
    updateUserRole(userId: string, role: Role, moderatorId: string): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        emailVerified: boolean;
        phone: string | null;
        phoneVerified: boolean;
        passwordHash: string | null;
        avatarUrl: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        isBanned: boolean;
        banReason: string | null;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    handleGoogleCallback(code: string, req?: Request): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.Role;
            emailVerified: boolean;
        };
        accessToken: string;
    }>;
    banUser(userId: string, reason: string, moderatorId: string): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        emailVerified: boolean;
        phone: string | null;
        phoneVerified: boolean;
        passwordHash: string | null;
        avatarUrl: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        isBanned: boolean;
        banReason: string | null;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
}
