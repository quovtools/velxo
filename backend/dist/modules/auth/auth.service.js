"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const client_1 = require("@prisma/client");
const email_service_1 = require("../../shared/email.service");
const affiliate_service_1 = require("../affiliate/affiliate.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, emailService, affiliateService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.affiliateService = affiliateService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    signToken(userId, email, role) {
        return this.jwtService.sign({ sub: userId, email, role });
    }
    googleRedirectUri(req) {
        if (process.env.GOOGLE_REDIRECT_URI)
            return process.env.GOOGLE_REDIRECT_URI;
        const proto = req?.headers?.['x-forwarded-proto'] || req?.protocol || 'https';
        const host = req?.get?.('host') || process.env.API_URL || 'http://localhost:3001';
        const base = String(host).startsWith('http') ? String(host) : `${proto}://${host}`;
        return `${base.replace(/\/$/, '')}/api/v1/auth/google/callback`;
    }
    getGoogleAuthUrl(req) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = this.googleRedirectUri(req);
        const scope = 'openid email profile';
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`;
    }
    signVerificationToken(userId, email) {
        return this.jwtService.sign({ sub: userId, email, purpose: 'email_verification' }, { expiresIn: '72h' });
    }
    async register(dto) {
        this.logger.log(`Registering new user: ${dto.email}`);
        const existing = await this.prisma.users.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new custom_exceptions_1.ConflictException('An account with this email already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        let user;
        try {
            user = await this.prisma.users.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    emailVerified: false,
                    role: dto.role === client_1.Role.BUYER || dto.role === client_1.Role.SELLER
                        ? dto.role
                        : client_1.Role.BUYER,
                    preferences: dto.preferences ?? undefined,
                },
            });
        }
        catch (prismaError) {
            this.logger.error('Prisma user creation error:', prismaError);
            if (prismaError?.code === 'P2002') {
                throw new custom_exceptions_1.ConflictException('An account with this email already exists');
            }
            throw new Error('Failed to create user profile. Please try again.');
        }
        try {
            await this.prisma.wallet.create({ data: { userId: user.id } });
        }
        catch (walletError) {
            this.logger.error('Wallet creation error:', walletError);
        }
        if (dto.referralCode) {
            try {
                const referral = await this.affiliateService.registerReferral(dto.referralCode, user.id);
                if (referral) {
                    this.logger.log(`User ${user.id} registered via referral ${dto.referralCode}`);
                }
            }
            catch (referralError) {
                this.logger.error('Affiliate referral recording error (non-fatal):', referralError);
            }
        }
        let emailSent = false;
        try {
            const verificationToken = this.signVerificationToken(user.id, user.email);
            const result = await this.emailService.sendVerificationEmail(user.email, verificationToken);
            emailSent = result.success;
            if (!result.success) {
                this.logger.error('Verification email failed to send:', result.error);
            }
        }
        catch (emailError) {
            this.logger.error('Verification email send error:', emailError);
        }
        const accessToken = this.signToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            accessToken,
            emailSent,
        };
    }
    async login(dto) {
        this.logger.log(`User login attempt: ${dto.email}`);
        const user = await this.prisma.users.findUnique({ where: { email: dto.email } });
        if (!user || !user.passwordHash) {
            throw new custom_exceptions_1.UnauthorizedException('Invalid email or password');
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch) {
            this.logger.warn(`Login failed for ${dto.email} — wrong password`);
            throw new custom_exceptions_1.UnauthorizedException('Invalid email or password');
        }
        if (user.isBanned) {
            throw new custom_exceptions_1.UnauthorizedException('Your account has been suspended');
        }
        await this.prisma.users.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const accessToken = this.signToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                emailVerified: user.emailVerified,
            },
            accessToken,
        };
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                phone: true,
                emailVerified: true,
                notificationPreferences: true,
                preferences: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new custom_exceptions_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async verifyEmailToken(token) {
        try {
            const decoded = this.jwtService.verify(token);
            if (decoded.purpose !== 'email_verification') {
                throw new custom_exceptions_1.UnauthorizedException('Invalid verification token');
            }
            const user = await this.prisma.users.update({
                where: { id: decoded.sub },
                data: { emailVerified: true },
                select: { id: true, email: true, emailVerified: true },
            });
            return user;
        }
        catch {
            throw new custom_exceptions_1.UnauthorizedException('Invalid or expired verification link');
        }
    }
    async resendVerificationEmail(userId) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user)
            throw new custom_exceptions_1.UnauthorizedException('User not found');
        if (user.emailVerified)
            return { alreadyVerified: true };
        const token = this.signVerificationToken(user.id, user.email);
        const result = await this.emailService.sendVerificationEmail(user.email, token);
        if (!result.success) {
            throw new Error(result.error || 'Failed to send verification email');
        }
        return { sent: true };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user)
            throw new custom_exceptions_1.UnauthorizedException('User not found');
        if (user.passwordHash) {
            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid)
                throw new custom_exceptions_1.UnauthorizedException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.users.update({ where: { id: userId }, data: { passwordHash } });
        return { success: true };
    }
    async forgotPassword(email) {
        const user = await this.prisma.users.findUnique({ where: { email } });
        if (user) {
            const resetToken = this.jwtService.sign({ sub: user.id, email: user.email, purpose: 'password_reset' }, { expiresIn: '24h' });
            await this.emailService.sendPasswordResetEmail(user.email, resetToken);
        }
    }
    async resetPasswordWithToken(token, newPassword) {
        try {
            const decoded = this.jwtService.verify(token);
            if (decoded.purpose !== 'password_reset') {
                throw new custom_exceptions_1.UnauthorizedException('Invalid reset token');
            }
            const passwordHash = await bcrypt.hash(newPassword, 12);
            await this.prisma.users.update({
                where: { id: decoded.sub },
                data: { passwordHash },
            });
            return { success: true };
        }
        catch {
            throw new custom_exceptions_1.UnauthorizedException('Invalid or expired reset link');
        }
    }
    async logout(userId) {
        this.logger.log(`User logout: ${userId}`);
        return { success: true };
    }
    async updateUserRole(userId, role, moderatorId) {
        const user = await this.prisma.users.update({ where: { id: userId }, data: { role } });
        await this.prisma.adminAuditLogs.create({
            data: { actorId: moderatorId, action: 'ROLE_CHANGE', entityType: 'user', entityId: userId, newValue: { role } },
        });
        return user;
    }
    async handleGoogleCallback(code, req) {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: this.googleRedirectUri(req),
                grant_type: 'authorization_code',
            }),
        });
        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            this.logger.error('Google token exchange failed:', err);
            throw new Error('Google authentication failed');
        }
        const tokens = await tokenRes.json();
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const googleUser = await userInfoRes.json();
        const { email, given_name, family_name } = googleUser;
        let user = await this.prisma.users.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.users.create({
                data: {
                    email,
                    firstName: given_name || '',
                    lastName: family_name || '',
                    emailVerified: true,
                    role: client_1.Role.BUYER,
                },
            });
            await this.prisma.wallet.create({ data: { userId: user.id } }).catch(() => { });
        }
        else {
            await this.prisma.users.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    ...(user.firstName ? {} : { firstName: given_name, lastName: family_name }),
                },
            });
        }
        if (user.isBanned)
            throw new Error('Your account has been suspended');
        await this.prisma.users.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const accessToken = this.signToken(user.id, user.email, user.role);
        return {
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, emailVerified: true },
            accessToken,
        };
    }
    async banUser(userId, reason, moderatorId) {
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: { isBanned: true, banReason: reason },
        });
        await this.prisma.adminAuditLogs.create({
            data: { actorId: moderatorId, action: 'STATUS_CHANGE', entityType: 'user', entityId: userId, newValue: { isBanned: true, reason } },
        });
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        affiliate_service_1.AffiliateService])
], AuthService);
//# sourceMappingURL=auth.service.js.map