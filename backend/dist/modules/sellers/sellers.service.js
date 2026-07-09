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
var SellersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellersService = exports.STORE_ENABLED_TIERS = exports.SUBSCRIPTION_PLANS = void 0;
exports.commissionRateForTier = commissionRateForTier;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const notifications_service_1 = require("../notifications/notifications.service");
const paymentio_service_1 = require("../payments/paymentio.service");
const library_1 = require("@prisma/client/runtime/library");
exports.SUBSCRIPTION_PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Free',
        price: 0,
        currency: 'USD',
        durationMonths: 0,
        commissionRate: 0.1,
        storeEnabled: false,
        featuredAllowed: false,
        highlightColor: '#64748b',
        features: [
            'Standard 10% escrow commission',
            'Unlimited listings',
            'Escrow-backed payments',
            'Seller dashboard & analytics',
            'Wallet & withdrawals',
        ],
    },
    PRO: {
        id: 'PRO',
        name: 'Seller Pro',
        price: 19.99,
        currency: 'USD',
        durationMonths: 1,
        commissionRate: 0.05,
        storeEnabled: true,
        featuredAllowed: true,
        highlightColor: '#8b5cf6',
        features: [
            'Public, shareable live store link',
            'Half-price 5% escrow commission',
            'Verified "Seller Pro" badge',
            'Up to 3 featured listings',
            'Priority search placement',
            'Advanced store analytics',
            'Priority support',
        ],
    },
    PREMIUM: {
        id: 'PREMIUM',
        name: 'Seller Pro Premium',
        price: 49.99,
        currency: 'USD',
        durationMonths: 1,
        commissionRate: 0.03,
        storeEnabled: true,
        featuredAllowed: true,
        highlightColor: '#f59e0b',
        features: [
            'Everything in Seller Pro',
            'Lowest 3% escrow commission',
            'Up to 10 featured listings',
            'Premium store theme & branding',
            'Top-of-search "Verified Pro" boost',
            'Dedicated account manager',
        ],
    },
};
exports.STORE_ENABLED_TIERS = ['PRO', 'PREMIUM'];
function commissionRateForTier(tier) {
    const plan = tier || 'FREE';
    return exports.SUBSCRIPTION_PLANS[plan]?.commissionRate ?? exports.SUBSCRIPTION_PLANS.FREE.commissionRate;
}
let SellersService = SellersService_1 = class SellersService {
    constructor(prisma, notifications, paymentIo) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.paymentIo = paymentIo;
        this.logger = new common_1.Logger(SellersService_1.name);
    }
    async createSeller(userId, dto) {
        this.logger.log(`Creating seller account for user ${userId}`);
        const existing = await this.prisma.sellers.findUnique({
            where: { userId },
        });
        if (existing) {
            throw new custom_exceptions_1.ConflictException('Seller account already exists for this user');
        }
        const seller = await this.prisma.$transaction(async (tx) => {
            const newSeller = await tx.sellers.create({
                data: {
                    userId,
                    storeName: dto.storeName,
                    storeDescription: dto.storeDescription,
                    reputationScore: 5.0,
                },
            });
            await tx.users.update({
                where: { id: userId },
                data: { role: 'SELLER' },
            });
            await tx.wallet.upsert({
                where: { userId },
                create: { userId, balance: new library_1.Decimal(0) },
                update: {},
            });
            return newSeller;
        });
        return seller;
    }
    async getSellerProfile(sellerId) {
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const [totalListings, activeListings, recentListings] = await Promise.all([
            this.prisma.listings.count({ where: { sellerId: seller.id } }),
            this.prisma.listings.count({ where: { sellerId: seller.id, status: 'ACTIVE' } }),
            this.prisma.listings.findMany({
                where: { sellerId: seller.id, status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 12,
                select: {
                    id: true,
                    title: true,
                    price: true,
                    gameName: true,
                    platform: true,
                    region: true,
                    images: true,
                    status: true,
                    salesCount: true,
                    createdAt: true,
                },
            }),
        ]);
        return {
            id: seller.id,
            storeName: seller.storeName,
            storeDescription: seller.storeDescription,
            isVerified: seller.isVerified,
            verifiedAt: seller.verifiedAt,
            averageRating: seller.averageRating,
            totalSales: seller.totalSales,
            totalRevenue: Number(seller.totalRevenue || 0),
            responseTime: seller.responseTime,
            responseRate: seller.responseRate,
            reputationScore: seller.reputationScore,
            subscriptionTier: seller.subscriptionTier,
            isSuspended: seller.isSuspended,
            createdAt: seller.createdAt,
            user: seller.user,
            stats: {
                totalListings,
                activeListings,
                totalSales: seller.totalSales,
                averageRating: seller.averageRating,
                responseTime: seller.responseTime,
                responseRate: seller.responseRate,
                memberSince: seller.createdAt,
            },
            listings: recentListings.map((l) => ({
                id: l.id,
                title: l.title,
                price: Number(l.price),
                gameName: l.gameName,
                platform: l.platform,
                region: l.region,
                images: l.images,
                status: l.status,
                salesCount: l.salesCount,
                createdAt: l.createdAt,
            })),
        };
    }
    async reportSeller(sellerId, reporterUserId, reason, details) {
        this.logger.log(`Report submitted for seller ${sellerId} by user ${reporterUserId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
            select: { id: true, storeName: true, userId: true },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const ticket = await this.prisma.supportTickets.create({
            data: {
                userId: reporterUserId,
                subject: `Seller report: ${seller.storeName}`,
                category: 'OTHER',
                priority: 'MEDIUM',
                metadata: {
                    type: 'SELLER_REPORT',
                    reportedSellerId: seller.id,
                    reportedSellerUserId: seller.userId,
                    reportedStoreName: seller.storeName,
                    reason,
                    details: details || null,
                },
            },
        });
        return { id: ticket.id, message: 'Report submitted successfully' };
    }
    async getSellerByUserId(userId) {
        const seller = await this.prisma.sellers.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        return seller;
    }
    async updateSeller(sellerId, dto) {
        this.logger.log(`Updating seller ${sellerId}`);
        const seller = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                storeName: dto.storeName,
                storeDescription: dto.storeDescription,
                responseTime: dto.responseTime,
            },
            include: { user: true },
        });
        return seller;
    }
    async uploadVerificationDocuments(sellerId, documents) {
        this.logger.log(`Uploading verification documents for seller ${sellerId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const updatedDocs = {
            ...seller.verificationDocuments,
            ...documents.reduce((acc, doc) => {
                acc[doc.documentType] = doc.documentUrl;
                return acc;
            }, {}),
        };
        const updated = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                verificationDocuments: updatedDocs,
            },
        });
        return updated;
    }
    async submitKyc(sellerId, dto) {
        this.logger.log(`Submitting KYC for seller ${sellerId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        if (seller.isVerified) {
            throw new custom_exceptions_1.ConflictException('Seller is already verified');
        }
        const updated = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                kycStatus: 'SUBMITTED',
                kycIdType: dto.idType,
                kycFullName: dto.fullName,
                kycDocumentNumber: dto.documentNumber || null,
                kycIdImageUrl: dto.idImageUrl,
                kycSelfieImageUrl: dto.selfieImageUrl,
                kycSubmittedAt: new Date(),
                kycRejectionReason: null,
            },
        });
        return updated;
    }
    async getPendingKyc(limit = 50) {
        return this.prisma.sellers.findMany({
            where: { kycStatus: 'SUBMITTED' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        phone: true,
                    },
                },
            },
            orderBy: { kycSubmittedAt: 'asc' },
            take: limit,
        });
    }
    async approveKyc(sellerId, moderatorId) {
        this.logger.log(`Approving KYC for seller ${sellerId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
            include: { user: true },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const updated = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                kycStatus: 'APPROVED',
                isVerified: true,
                verifiedAt: new Date(),
                kycReviewedAt: new Date(),
                kycRejectionReason: null,
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: moderatorId,
                action: 'VERIFICATION_CHANGE',
                entityType: 'seller',
                entityId: sellerId,
                newValue: { kycStatus: 'APPROVED', isVerified: true },
            },
        });
        if (seller.userId) {
            await this.notifications
                .notifyKycApproved(seller.userId, seller.storeName)
                .catch(() => { });
        }
        return updated;
    }
    async rejectKyc(sellerId, moderatorId, reason) {
        this.logger.log(`Rejecting KYC for seller ${sellerId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
            include: { user: true },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const updated = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                kycStatus: 'REJECTED',
                isVerified: false,
                kycReviewedAt: new Date(),
                kycRejectionReason: reason,
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: moderatorId,
                action: 'VERIFICATION_CHANGE',
                entityType: 'seller',
                entityId: sellerId,
                newValue: { kycStatus: 'REJECTED', reason },
            },
        });
        if (seller.userId) {
            await this.notifications
                .notifyKycRejected(seller.userId, seller.storeName, reason)
                .catch(() => { });
        }
        return updated;
    }
    async verifySellerIdentity(sellerId, moderatorId) {
        this.logger.log(`Verifying seller ${sellerId}`);
        const seller = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: moderatorId,
                action: 'VERIFICATION_CHANGE',
                entityType: 'seller',
                entityId: sellerId,
                newValue: { isVerified: true },
            },
        });
        return seller;
    }
    async getTopSellers(limit = 10) {
        return this.prisma.sellers.findMany({
            where: { isVerified: true, isSuspended: false },
            orderBy: { reputationScore: 'desc' },
            take: limit,
            include: {
                user: {
                    select: { email: true, firstName: true, avatarUrl: true },
                },
            },
        });
    }
    async suspendSeller(sellerId, reason, moderatorId) {
        this.logger.log(`Suspending seller ${sellerId}`);
        const seller = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                isSuspended: true,
                suspensionReason: reason,
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: moderatorId,
                action: 'STATUS_CHANGE',
                entityType: 'seller',
                entityId: sellerId,
                newValue: { isSuspended: true, reason },
            },
        });
        return seller;
    }
    async updateSellerStats(sellerId) {
        this.logger.log(`Updating stats for seller ${sellerId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const completedOrders = await this.prisma.orders.findMany({
            where: { sellerId: seller.id, status: 'COMPLETED' },
        });
        const totalSales = completedOrders.length;
        const totalRevenue = completedOrders.reduce((sum, order) => sum.plus(order.totalAmount), new library_1.Decimal(0));
        const allReviews = await this.prisma.reviews.findMany({
            where: { sellerId: seller.id },
        });
        const avgRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;
        const reputationScore = Math.min(5, (avgRating * 0.7) + ((totalSales / 100) * 0.3));
        return this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                totalSales,
                totalRevenue,
                averageRating: avgRating,
                reputationScore,
            },
        });
    }
    async getPublicStore(identifier) {
        const seller = await this.prisma.sellers.findFirst({
            where: { OR: [{ id: identifier }, { storeSlug: identifier }] },
            include: {
                user: {
                    select: { firstName: true, lastName: true, avatarUrl: true },
                },
                listings: {
                    where: { status: 'ACTIVE' },
                    orderBy: { isFeatured: 'desc' },
                    include: { category: true },
                },
            },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        if (!this.hasLiveStore(seller)) {
            throw new custom_exceptions_1.ForbiddenException('This seller does not have a public store');
        }
        const plan = exports.SUBSCRIPTION_PLANS[seller.subscriptionTier || 'FREE'];
        return {
            ...seller,
            planName: plan.name,
            commissionRate: plan.commissionRate,
            storeUrl: `/store/${seller.storeSlug || seller.id}`,
        };
    }
    async getMySubscription(userId) {
        const seller = await this.prisma.sellers.findUnique({
            where: { userId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        await this.enforceExpiry(seller);
        const refreshed = await this.prisma.sellers.findUnique({
            where: { userId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        const tier = refreshed?.subscriptionTier || 'FREE';
        const plan = exports.SUBSCRIPTION_PLANS[tier];
        const activeSub = refreshed?.subscriptions?.[0];
        return {
            sellerId: refreshed.id,
            tier,
            planName: plan.name,
            isPro: exports.STORE_ENABLED_TIERS.includes(tier),
            commissionRate: plan.commissionRate,
            storeEnabled: plan.storeEnabled,
            featuredAllowed: plan.featuredAllowed,
            features: plan.features,
            storeSlug: refreshed.storeSlug,
            storeUrl: refreshed.storeSlug
                ? `${process.env.FRONTEND_URL || ''}/store/${refreshed.storeSlug}`.replace(/([^:])\/\//, '$1/')
                : null,
            liveStore: this.hasLiveStore(refreshed),
            isVerified: refreshed.isVerified,
            kycStatus: refreshed.kycStatus,
            subscriptionEndsAt: refreshed.subscriptionEndsAt,
            subscription: activeSub
                ? {
                    id: activeSub.id,
                    plan: activeSub.plan,
                    status: activeSub.status,
                    startsAt: activeSub.startsAt,
                    endsAt: activeSub.endsAt,
                    amount: Number(activeSub.amount),
                    currency: activeSub.currency,
                }
                : null,
        };
    }
    getPlans() {
        return Object.values(exports.SUBSCRIPTION_PLANS).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            durationMonths: p.durationMonths,
            storeEnabled: p.storeEnabled,
            featuredAllowed: p.featuredAllowed,
            commissionRate: p.commissionRate,
            features: p.features,
        }));
    }
    async createSubscription(userId, planId, provider, callbackUrl) {
        const plan = exports.SUBSCRIPTION_PLANS[planId];
        if (!plan || plan.id === 'FREE') {
            throw new custom_exceptions_1.BadRequestException('Invalid subscription plan');
        }
        const seller = await this.prisma.sellers.findUnique({ where: { userId } });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        if (!seller.isVerified) {
            throw new custom_exceptions_1.ForbiddenException('You must complete identity verification before subscribing to Seller Pro');
        }
        const subscription = await this.prisma.sellerSubscriptions.create({
            data: {
                sellerId: seller.id,
                plan: plan.id,
                status: 'PENDING',
                amount: new library_1.Decimal(plan.price),
                currency: plan.currency,
                provider,
            },
        });
        const returnUrl = callbackUrl ||
            `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/seller/pro?checkout=${subscription.id}`;
        const charge = await this.paymentIo.createCharge({
            reference: subscription.id,
            amount: plan.price,
            currency: plan.currency,
            callbackUrl: returnUrl,
        });
        if (!charge.configured) {
            await this.activateSubscription(subscription.id);
            return {
                subscriptionId: subscription.id,
                paymentUrl: null,
                configured: false,
                sandbox: true,
                message: 'Payment provider not configured — subscription activated in sandbox mode.',
            };
        }
        if (charge.chargeId) {
            await this.prisma.sellerSubscriptions.update({
                where: { id: subscription.id },
                data: { providerRef: charge.chargeId },
            });
        }
        return {
            subscriptionId: subscription.id,
            paymentUrl: charge.paymentUrl,
            configured: true,
            sandbox: false,
        };
    }
    async activateSubscription(subscriptionId) {
        const sub = await this.prisma.sellerSubscriptions.findUnique({
            where: { id: subscriptionId },
            include: { seller: true },
        });
        if (!sub) {
            throw new custom_exceptions_1.NotFoundException('Subscription');
        }
        if (sub.status === 'ACTIVE') {
            return sub;
        }
        const plan = exports.SUBSCRIPTION_PLANS[sub.plan];
        const now = new Date();
        const endsAt = new Date(now.getTime() + plan.durationMonths * 30 * 24 * 60 * 60 * 1000);
        const updated = await this.prisma.sellerSubscriptions.update({
            where: { id: subscriptionId },
            data: {
                status: 'ACTIVE',
                startsAt: now,
                endsAt,
            },
        });
        await this.prisma.sellers.update({
            where: { id: sub.sellerId },
            data: {
                subscriptionTier: sub.plan,
                subscriptionEndsAt: endsAt,
                storeSlug: sub.seller.storeSlug || this.generateStoreSlug(sub.seller.storeName, sub.seller.id),
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: sub.seller.userId,
                action: 'UPDATE',
                entityType: 'seller_subscription',
                entityId: subscriptionId,
                newValue: { plan: sub.plan, status: 'ACTIVE', endsAt },
            },
        });
        if (sub.seller.userId) {
            await this.notifications
                .notifySubscriptionActivated(sub.seller.userId, plan.name, endsAt)
                .catch(() => { });
        }
        return updated;
    }
    async enforceExpiry(seller) {
        if (seller.subscriptionTier &&
            seller.subscriptionTier !== 'FREE' &&
            seller.subscriptionEndsAt &&
            new Date(seller.subscriptionEndsAt).getTime() <= Date.now()) {
            await this.prisma.sellers.update({
                where: { id: seller.id },
                data: { subscriptionTier: 'FREE', subscriptionEndsAt: null },
            });
            await this.prisma.sellerSubscriptions.updateMany({
                where: { sellerId: seller.id, status: 'ACTIVE' },
                data: { status: 'EXPIRED' },
            });
            return true;
        }
        return false;
    }
    generateStoreSlug(storeName, sellerId) {
        const base = storeName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40);
        const suffix = sellerId.slice(-4);
        return `${base || 'store'}-${suffix}`;
    }
    hasLiveStore(seller) {
        if (!seller.isVerified)
            return false;
        if (!seller.subscriptionTier)
            return false;
        if (!exports.STORE_ENABLED_TIERS.includes(seller.subscriptionTier))
            return false;
        if (!seller.subscriptionEndsAt)
            return true;
        return new Date(seller.subscriptionEndsAt).getTime() > Date.now();
    }
    async subscribe(sellerId, plan, durationMonths = 1) {
        const allowed = ['PRO', 'PREMIUM'];
        if (!allowed.includes(plan)) {
            throw new custom_exceptions_1.BadRequestException('Invalid subscription plan');
        }
        if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
            durationMonths = 1;
        }
        const seller = await this.prisma.sellers.findUnique({ where: { id: sellerId } });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        const subscriptionEndsAt = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);
        const updated = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: {
                subscriptionTier: plan,
                subscriptionEndsAt,
                storeSlug: seller.storeSlug || this.generateStoreSlug(seller.storeName, seller.id),
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: seller.userId,
                action: 'UPDATE',
                entityType: 'seller',
                entityId: sellerId,
                newValue: { subscriptionTier: plan, subscriptionEndsAt },
            },
        });
        return updated;
    }
};
exports.SellersService = SellersService;
exports.SellersService = SellersService = SellersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        paymentio_service_1.PaymentIoService])
], SellersService);
//# sourceMappingURL=sellers.service.js.map