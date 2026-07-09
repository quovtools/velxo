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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const sellers_service_1 = require("../sellers/sellers.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, notifications, sellersService) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.sellersService = sellersService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboardStats() {
        this.logger.log('Fetching dashboard statistics');
        const [totalUsers, totalSellers, totalListings, activeListings, pendingListings, totalOrders, completedOrders, totalRevenue, pendingDisputes, flaggedUsers,] = await Promise.all([
            this.prisma.users.count(),
            this.prisma.sellers.count(),
            this.prisma.listings.count(),
            this.prisma.listings.count({ where: { status: client_1.ListingStatus.ACTIVE } }),
            this.prisma.listings.count({ where: { status: client_1.ListingStatus.PENDING_APPROVAL } }),
            this.prisma.orders.count(),
            this.prisma.orders.count({ where: { status: client_1.OrderStatus.COMPLETED } }),
            this.prisma.orders.aggregate({
                where: { status: client_1.OrderStatus.COMPLETED },
                _sum: { totalAmount: true },
            }),
            this.prisma.disputes.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
            this.prisma.users.count({ where: { isBanned: true } }),
        ]);
        const avgOrderValue = completedOrders > 0 ? Number(totalRevenue._sum.totalAmount || 0) / completedOrders : 0;
        return {
            totalUsers,
            totalSellers,
            totalListings,
            activeListings,
            pendingListings,
            listingApprovalRate: totalListings > 0 ? (activeListings / totalListings) * 100 : 0,
            totalOrders,
            completedOrders,
            orderCompletionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            avgOrderValue,
            gmv: totalRevenue._sum.totalAmount || 0,
            pendingDisputes,
            disputeRate: totalOrders > 0 ? (pendingDisputes / totalOrders) * 100 : 0,
            flaggedUsers,
        };
    }
    async getPendingListings(limit) {
        const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const take = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
        return this.prisma.listings.findMany({
            where: { status: client_1.ListingStatus.PENDING_APPROVAL },
            include: {
                seller: { include: { user: true } },
                category: true,
            },
            orderBy: { createdAt: 'asc' },
            take,
        });
    }
    async approveListing(listingId, moderatorId) {
        this.logger.log(`Approving listing ${listingId} by moderator ${moderatorId}`);
        const listing = await this.prisma.listings.update({
            where: { id: listingId },
            data: {
                status: client_1.ListingStatus.ACTIVE,
                moderatedAt: new Date(),
                moderatedBy: moderatorId,
            },
            include: { seller: true },
        });
        if (listing.seller?.userId) {
            await this.notifications
                .notifyListingApproved(listing.id, listing.seller.userId)
                .catch(() => { });
        }
        return listing;
    }
    async rejectListing(listingId, moderatorId, reason) {
        this.logger.log(`Rejecting listing ${listingId}`);
        const listing = await this.prisma.listings.update({
            where: { id: listingId },
            data: {
                status: client_1.ListingStatus.REJECTED,
                moderationNotes: reason,
                moderatedAt: new Date(),
                moderatedBy: moderatorId,
            },
            include: { seller: true },
        });
        if (listing.seller?.userId) {
            await this.notifications
                .notifyListingRejected(listing.id, listing.seller.userId, reason)
                .catch(() => { });
        }
        return listing;
    }
    async getFlaggedListings(limit = 50) {
        const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const take = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
        return this.prisma.fraudFlags.findMany({
            where: { listingId: { not: null } },
            include: {
                listing: {
                    include: { seller: { include: { user: true } } },
                },
                user: true,
            },
            orderBy: { createdAt: 'desc' },
            take,
        });
    }
    async getSuspiciousUsers(limit = 50) {
        const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const take = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
        return this.prisma.fraudFlags.findMany({
            where: { listingId: null, orderId: null },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
            take,
        });
    }
    async getRevenueAnalytics(startDate, endDate) {
        const orders = await this.prisma.orders.findMany({
            where: {
                status: client_1.OrderStatus.COMPLETED,
                completedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: { commissions: true },
        });
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0);
        const totalCommissions = orders.reduce((sum, order) => sum + order.commissions.reduce((s, c) => s + c.amount.toNumber(), 0), 0);
        return {
            totalOrders: orders.length,
            totalRevenue,
            totalCommissions,
            netRevenue: totalRevenue - totalCommissions,
            avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        };
    }
    async getSellerMetrics(sellerId) {
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
            include: { user: true },
        });
        if (!seller)
            return null;
        const [orders, reviews, disputes] = await Promise.all([
            this.prisma.orders.findMany({ where: { sellerId: seller.id } }),
            this.prisma.reviews.findMany({ where: { sellerId: seller.id } }),
            this.prisma.disputes.findMany({
                where: {
                    order: { sellerId: seller.id },
                },
            }),
        ]);
        return {
            seller,
            totalOrders: orders.length,
            completedOrders: orders.filter((o) => o.status === client_1.OrderStatus.COMPLETED).length,
            totalReviews: reviews.length,
            avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
            disputes: disputes.length,
            totalEarnings: seller.totalRevenue,
        };
    }
    async createAuditLog(actorId, action, entityType, entityId, oldValue, newValue) {
        return this.prisma.adminAuditLogs.create({
            data: {
                actorId,
                action,
                entityType,
                entityId,
                oldValue,
                newValue,
            },
        });
    }
    async getPendingKyc(limit) {
        const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const take = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
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
            take,
        });
    }
    async approveKyc(sellerId, moderatorId) {
        this.logger.log(`Admin approving KYC for seller ${sellerId}`);
        return this.sellersService.approveKyc(sellerId, moderatorId);
    }
    async rejectKyc(sellerId, moderatorId, reason) {
        this.logger.log(`Admin rejecting KYC for seller ${sellerId}`);
        return this.sellersService.rejectKyc(sellerId, moderatorId, reason);
    }
    async listUsers(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 25));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.role)
            where.role = filters.role;
        if (filters.status === 'banned')
            where.isBanned = true;
        if (filters.status === 'inactive')
            where.isActive = false;
        if (filters.status === 'active')
            where.isActive = true;
        if (filters.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.users.findMany({
                where,
                include: { sellers: { select: { id: true, storeName: true, isVerified: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.users.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getUser(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            include: {
                sellers: { include: { user: true } },
                wallet: true,
                velxoCoins: true,
            },
        });
        if (!user)
            return null;
        const [orders, disputes, tickets] = await Promise.all([
            this.prisma.orders.count({ where: { buyerId: userId } }),
            this.prisma.disputes.count({ where: { initiatedById: userId } }),
            this.prisma.supportTickets.count({ where: { userId } }),
        ]);
        return { ...user, stats: { orders, disputes, tickets } };
    }
    async setUserBan(userId, banned, reason, moderatorId) {
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: { isBanned: banned, banReason: banned ? reason || null : null },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'user', userId, { isBanned: !banned }, { isBanned: banned, reason });
        if (user.email) {
            await this.notifications
                .createNotification(userId, 'SYSTEM', banned ? 'Account Suspended' : 'Account Restored', banned
                ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ''}`
                : 'Your account access has been restored.')
                .catch(() => { });
        }
        return user;
    }
    async setUserActive(userId, active, moderatorId) {
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: { isActive: active },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'user', userId, { isActive: !active }, { isActive: active });
        return user;
    }
    async changeUserRole(userId, role, moderatorId) {
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: { role },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'ROLE_CHANGE', 'user', userId, { role: user.role }, { role });
        return user;
    }
    async verifyUserEmail(userId, moderatorId) {
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: { emailVerified: true },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'VERIFICATION_CHANGE', 'user', userId, {}, { emailVerified: true });
        return user;
    }
    async listSellers(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 25));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status === 'verified')
            where.isVerified = true;
        if (filters.status === 'unverified')
            where.isVerified = false;
        if (filters.status === 'suspended')
            where.isSuspended = true;
        if (filters.search) {
            where.OR = [
                { storeName: { contains: filters.search, mode: 'insensitive' } },
                { user: { email: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.sellers.findMany({
                where,
                include: {
                    user: { select: { id: true, email: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.sellers.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getSellerAdmin(sellerId) {
        const seller = await this.prisma.sellers.findUnique({
            where: { id: sellerId },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
                listings: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!seller)
            return null;
        const [orders, disputes, reviews] = await Promise.all([
            this.prisma.orders.count({ where: { sellerId: seller.id } }),
            this.prisma.disputes.count({ where: { order: { sellerId: seller.id } } }),
            this.prisma.reviews.count({ where: { sellerId: seller.id } }),
        ]);
        return { ...seller, stats: { orders, disputes, reviews } };
    }
    async setSellerVerified(sellerId, verified, moderatorId) {
        const seller = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: { isVerified: verified, verifiedAt: verified ? new Date() : null },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'VERIFICATION_CHANGE', 'seller', sellerId, { isVerified: !verified }, { isVerified: verified });
        if (seller.userId) {
            await this.notifications
                .createNotification(seller.userId, 'KYC_APPROVED', verified ? 'Store Verified' : 'Verification Removed', verified
                ? 'Your seller store has been verified by an administrator.'
                : 'Your seller verification has been removed by an administrator.')
                .catch(() => { });
        }
        return seller;
    }
    async setSellerSuspended(sellerId, suspended, reason, moderatorId) {
        const seller = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: { isSuspended: suspended, suspensionReason: suspended ? reason || null : null },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'seller', sellerId, { isSuspended: !suspended }, { isSuspended: suspended, reason });
        if (seller.userId) {
            await this.notifications
                .createNotification(seller.userId, 'SYSTEM', suspended ? 'Store Suspended' : 'Store Reinstated', suspended
                ? `Your store has been suspended. ${reason ? `Reason: ${reason}` : ''}`
                : 'Your store has been reinstated.')
                .catch(() => { });
        }
        return seller;
    }
    async setSellerFeatured(sellerId, featured, moderatorId) {
        const seller = await this.prisma.sellers.update({
            where: { id: sellerId },
            data: { featuredUntil: featured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'seller', sellerId, { featured: !featured }, { featured });
        return seller;
    }
    async listListings(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 25));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.game)
            where.gameName = filters.game;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { gameName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.listings.findMany({
                where,
                include: { seller: { include: { user: { select: { email: true } } } }, category: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.listings.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getListingAdmin(listingId) {
        return this.prisma.listings.findUnique({
            where: { id: listingId },
            include: {
                seller: { include: { user: true } },
                category: true,
                subcategory: true,
                orderItems: { include: { order: true } },
            },
        });
    }
    async setListingFeatured(listingId, featured, moderatorId) {
        const listing = await this.prisma.listings.update({
            where: { id: listingId },
            data: { isFeatured: featured },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'listing', listingId, { isFeatured: !featured }, { isFeatured: featured });
        return listing;
    }
    async suspendListing(listingId, reason, moderatorId) {
        const listing = await this.prisma.listings.update({
            where: { id: listingId },
            data: {
                status: client_1.ListingStatus.SUSPENDED,
                moderationNotes: reason,
                moderatedAt: new Date(),
                moderatedBy: moderatorId || 'admin-console',
            },
            include: { seller: true },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'listing', listingId, { status: listing.status }, { status: client_1.ListingStatus.SUSPENDED, reason });
        if (listing.seller?.userId) {
            await this.notifications
                .createNotification(listing.seller.userId, 'SYSTEM', 'Listing Suspended', `Your listing "${listing.title}" was suspended. ${reason ? `Reason: ${reason}` : ''}`)
                .catch(() => { });
        }
        return listing;
    }
    async forceApproveListing(listingId, moderatorId) {
        const listing = await this.prisma.listings.update({
            where: { id: listingId },
            data: {
                status: client_1.ListingStatus.ACTIVE,
                moderatedAt: new Date(),
                moderatedBy: moderatorId || 'admin-console',
            },
            include: { seller: true },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'listing', listingId, { status: listing.status }, { status: client_1.ListingStatus.ACTIVE });
        if (listing.seller?.userId) {
            await this.notifications.notifyListingApproved(listing.id, listing.seller.userId).catch(() => { });
        }
        return listing;
    }
    async deleteListing(listingId, moderatorId) {
        const listing = await this.prisma.listings.delete({ where: { id: listingId } });
        await this.createAuditLog(moderatorId || 'admin-console', 'DELETE', 'listing', listingId, { title: listing.title }, {});
        return { deleted: true, id: listingId };
    }
    async listOrders(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 25));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status)
            where.status = filters.status;
        const [items, total] = await Promise.all([
            this.prisma.orders.findMany({
                where,
                include: {
                    buyer: { select: { email: true, firstName: true, lastName: true } },
                    seller: { select: { storeName: true } },
                    orderItems: { include: { listing: { select: { title: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.orders.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getOrderAdmin(orderId) {
        return this.prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                buyer: { select: { email: true, firstName: true, lastName: true } },
                seller: { include: { user: { select: { email: true } } } },
                orderItems: { include: { listing: true } },
                escrow: true,
                payments: true,
                disputes: true,
            },
        });
    }
    async cancelOrder(orderId, reason, moderatorId) {
        const order = await this.prisma.orders.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.CANCELLED, cancelledAt: new Date() },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'order', orderId, { status: order.status }, { status: client_1.OrderStatus.CANCELLED, reason });
        await this.notifications.notifyOrderStatus(orderId, 'CANCELLED').catch(() => { });
        return order;
    }
    async refundOrder(orderId, amount, reason, moderatorId) {
        const order = await this.prisma.orders.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.REFUNDED, refundedAt: new Date() },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'REFUND', 'order', orderId, { status: order.status }, { status: client_1.OrderStatus.REFUNDED, amount, reason });
        await this.notifications.notifyRefunded(order, `$${amount}`).catch(() => { });
        return order;
    }
    async listWithdrawals(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 25));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status)
            where.status = filters.status;
        const [items, total] = await Promise.all([
            this.prisma.withdrawalRequests.findMany({
                where,
                include: { seller: { include: { user: { select: { email: true } } } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.withdrawalRequests.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getWithdrawal(id) {
        return this.prisma.withdrawalRequests.findUnique({
            where: { id },
            include: { seller: { include: { user: true } } },
        });
    }
    async approveWithdrawal(id, moderatorId) {
        return this.prisma.$transaction(async (tx) => {
            const withdrawal = await tx.withdrawalRequests.findUnique({
                where: { id },
                include: { seller: true },
            });
            if (!withdrawal)
                throw new Error('Withdrawal not found');
            if (withdrawal.status !== 'PENDING')
                throw new Error('Withdrawal already processed');
            await tx.withdrawalRequests.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    processedBy: moderatorId || 'admin-console',
                    completedAt: new Date(),
                },
            });
            const wallet = await tx.wallet.findUnique({ where: { userId: withdrawal.seller.userId } });
            if (wallet) {
                const newBalance = wallet.balance.minus(withdrawal.amount);
                await tx.wallet.update({
                    where: { userId: withdrawal.seller.userId },
                    data: { balance: newBalance, totalWithdrawn: wallet.totalWithdrawn.plus(withdrawal.amount) },
                });
                await tx.walletTransactions.create({
                    data: {
                        walletId: wallet.id,
                        type: 'DEBIT',
                        amount: withdrawal.amount,
                        currency: withdrawal.currency,
                        balanceAfter: newBalance,
                        description: `Withdrawal approved #${withdrawal.id}`,
                        relatedId: withdrawal.id,
                    },
                });
            }
            await this.prisma.adminAuditLogs.create({
                data: {
                    actorId: moderatorId || 'admin-console',
                    action: 'WITHDRAWAL',
                    entityType: 'withdrawal',
                    entityId: id,
                    newValue: { status: 'COMPLETED' },
                },
            });
            if (withdrawal.seller.userId) {
                await this.notifications
                    .createNotification(withdrawal.seller.userId, 'WITHDRAWAL', 'Withdrawal Approved', `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been approved and processed.`)
                    .catch(() => { });
            }
            return withdrawal;
        });
    }
    async rejectWithdrawal(id, reason, moderatorId) {
        const withdrawal = await this.prisma.withdrawalRequests.update({
            where: { id },
            data: {
                status: 'REJECTED',
                processedBy: moderatorId || 'admin-console',
                notes: reason,
            },
            include: { seller: { include: { user: true } } },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'WITHDRAWAL', 'withdrawal', id, {}, { status: 'REJECTED', reason });
        if (withdrawal.seller.userId) {
            await this.notifications
                .createNotification(withdrawal.seller.userId, 'WITHDRAWAL', 'Withdrawal Rejected', `Your withdrawal request was rejected. ${reason ? `Reason: ${reason}` : ''}`)
                .catch(() => { });
        }
        return withdrawal;
    }
    async listTickets(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 25));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.category)
            where.category = filters.category;
        if (filters.priority)
            where.priority = filters.priority;
        const [items, total] = await Promise.all([
            this.prisma.supportTickets.findMany({
                where,
                include: { user: { select: { email: true, firstName: true, lastName: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.supportTickets.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getTicket(id) {
        return this.prisma.supportTickets.findUnique({
            where: { id },
            include: { user: { select: { email: true, firstName: true, lastName: true } } },
        });
    }
    async updateTicketStatus(id, status, moderatorId) {
        const data = { status };
        if (status === 'CLOSED' || status === 'RESOLVED')
            data.closedAt = new Date();
        const ticket = await this.prisma.supportTickets.update({ where: { id }, data });
        await this.createAuditLog(moderatorId || 'admin-console', 'STATUS_CHANGE', 'ticket', id, { status }, { status });
        return ticket;
    }
    async updateTicketPriority(id, priority, moderatorId) {
        const ticket = await this.prisma.supportTickets.update({
            where: { id },
            data: { priority },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'ticket', id, {}, { priority });
        return ticket;
    }
    async assignTicket(id, assigneeId, moderatorId) {
        const ticket = await this.prisma.supportTickets.update({
            where: { id },
            data: { assigneeId },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'ticket', id, {}, { assigneeId });
        return ticket;
    }
    async listCategories() {
        return this.prisma.categories.findMany({
            include: {
                subcategories: true,
                _count: { select: { listings: true } },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async createCategory(dto) {
        return this.prisma.categories.create({ data: { ...dto, isActive: dto.isActive ?? true } });
    }
    async updateCategory(id, dto, moderatorId) {
        const category = await this.prisma.categories.update({ where: { id }, data: dto });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'category', id, {}, dto);
        return category;
    }
    async deleteCategory(id, moderatorId) {
        const category = await this.prisma.categories.delete({ where: { id } });
        await this.createAuditLog(moderatorId || 'admin-console', 'DELETE', 'category', id, { name: category.name }, {});
        return { deleted: true, id };
    }
    async createSubcategory(categoryId, dto, moderatorId) {
        const sub = await this.prisma.subcategories.create({
            data: { categoryId, ...dto, isActive: dto.isActive ?? true },
        });
        await this.createAuditLog(moderatorId || 'admin-console', 'CREATE', 'subcategory', sub.id, {}, { categoryId, name: dto.name });
        return sub;
    }
    async updateSubcategory(id, dto, moderatorId) {
        const sub = await this.prisma.subcategories.update({ where: { id }, data: dto });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'subcategory', id, {}, dto);
        return sub;
    }
    async deleteSubcategory(id, moderatorId) {
        const sub = await this.prisma.subcategories.delete({ where: { id } });
        await this.createAuditLog(moderatorId || 'admin-console', 'DELETE', 'subcategory', id, { name: sub.name }, {});
        return { deleted: true, id };
    }
    async listTopups() {
        return this.prisma.topupProducts.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    async createTopup(dto) {
        return this.prisma.topupProducts.create({
            data: {
                ...dto,
                currency: dto.currency ?? 'USD',
                region: dto.region ?? 'Global',
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateTopup(id, dto, moderatorId) {
        const product = await this.prisma.topupProducts.update({ where: { id }, data: dto });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'topup', id, {}, dto);
        return product;
    }
    async deleteTopup(id, moderatorId) {
        const product = await this.prisma.topupProducts.delete({ where: { id } });
        await this.createAuditLog(moderatorId || 'admin-console', 'DELETE', 'topup', id, { title: product.title }, {});
        return { deleted: true, id };
    }
    async listBlogPosts() {
        return this.prisma.blogPosts.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async createBlogPost(dto) {
        return this.prisma.blogPosts.create({
            data: {
                ...dto,
                category: dto.category ?? 'Platform',
                author: dto.author ?? 'Velxo Team',
                isPublished: dto.isPublished ?? false,
                publishedAt: dto.isPublished ? new Date() : null,
            },
        });
    }
    async updateBlogPost(id, dto, moderatorId) {
        const data = { ...dto };
        if (typeof dto.isPublished === 'boolean') {
            data.publishedAt = dto.isPublished ? new Date() : null;
        }
        const post = await this.prisma.blogPosts.update({ where: { id }, data });
        await this.createAuditLog(moderatorId || 'admin-console', 'UPDATE', 'blog', id, {}, dto);
        return post;
    }
    async deleteBlogPost(id, moderatorId) {
        const post = await this.prisma.blogPosts.delete({ where: { id } });
        await this.createAuditLog(moderatorId || 'admin-console', 'DELETE', 'blog', id, { title: post.title }, {});
        return { deleted: true, id };
    }
    async listAuditLogs(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 50));
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.action)
            where.action = filters.action;
        if (filters.entityType)
            where.entityType = filters.entityType;
        if (filters.actorId)
            where.actorId = filters.actorId;
        const [items, total] = await Promise.all([
            this.prisma.adminAuditLogs.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.adminAuditLogs.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        sellers_service_1.SellersService])
], AdminService);
//# sourceMappingURL=admin.service.js.map