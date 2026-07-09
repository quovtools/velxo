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
var AffiliateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const nanoid_1 = require("nanoid");
let AffiliateService = AffiliateService_1 = class AffiliateService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AffiliateService_1.name);
    }
    async getMyReferral(userId) {
        let referral = await this.prisma.affiliateReferrals.findFirst({ where: { referrerId: userId, referredUserId: null } });
        if (!referral) {
            const code = 'VLX-' + (0, nanoid_1.nanoid)(8).toUpperCase();
            referral = await this.prisma.affiliateReferrals.create({
                data: { referrerId: userId, referralCode: code, status: 'ACTIVE' },
            });
        }
        return referral;
    }
    async trackClick(code) {
        return this.prisma.affiliateReferrals.updateMany({
            where: { referralCode: code },
            data: { clickCount: { increment: 1 } },
        });
    }
    async registerReferral(code, newUserId) {
        const referral = await this.prisma.affiliateReferrals.findFirst({
            where: { referralCode: code, referredUserId: null },
        });
        if (!referral)
            return null;
        return this.prisma.affiliateReferrals.update({
            where: { id: referral.id },
            data: {
                referredUserId: newUserId,
                signupCount: { increment: 1 },
                status: 'CONVERTED',
            },
        });
    }
    async creditCommission(referredUserId, tradeAmount) {
        const referral = await this.prisma.affiliateReferrals.findFirst({
            where: { referredUserId },
        });
        if (!referral)
            return null;
        const commission = tradeAmount * Number(referral.commissionRate);
        return this.prisma.affiliateReferrals.update({
            where: { id: referral.id },
            data: {
                totalEarned: { increment: commission },
                tradeCount: { increment: 1 },
            },
        });
    }
    async getAllReferrals(limit = 50) {
        return this.prisma.affiliateReferrals.findMany({
            include: {
                referrer: { select: { id: true, email: true, firstName: true, lastName: true } },
                referredUser: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
            orderBy: { totalEarned: 'desc' },
            take: limit,
        });
    }
    async getStats(userId) {
        const referrals = await this.prisma.affiliateReferrals.findMany({ where: { referrerId: userId } });
        const totalClicks = referrals.reduce((s, r) => s + r.clickCount, 0);
        const totalSignups = referrals.reduce((s, r) => s + r.signupCount, 0);
        const totalTrades = referrals.reduce((s, r) => s + r.tradeCount, 0);
        const totalEarned = referrals.reduce((s, r) => s + Number(r.totalEarned), 0);
        return { totalClicks, totalSignups, totalTrades, totalEarned, referrals };
    }
};
exports.AffiliateService = AffiliateService;
exports.AffiliateService = AffiliateService = AffiliateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AffiliateService);
//# sourceMappingURL=affiliate.service.js.map