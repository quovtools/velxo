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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
let UsersService = UsersService_1 = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async getUserProfile(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                phone: true,
                role: true,
                createdAt: true,
                isActive: true,
            },
        });
        if (!user) {
            throw new custom_exceptions_1.NotFoundException('User');
        }
        return user;
    }
    async updateProfile(userId, data) {
        this.logger.log(`Updating profile for user ${userId}`);
        const { notificationPreferences, preferences, ...rest } = data;
        const updateData = { ...rest };
        if (notificationPreferences !== undefined)
            updateData.notificationPreferences = notificationPreferences;
        if (preferences !== undefined)
            updateData.preferences = preferences;
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                notificationPreferences: true,
                preferences: true,
            },
        });
        return user;
    }
    async uploadAvatar(userId, avatarUrl) {
        this.logger.log(`Uploading avatar for user ${userId}`);
        const user = await this.prisma.users.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        return user;
    }
    async getUserStats(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new custom_exceptions_1.NotFoundException('User');
        }
        const [buyerOrders, reviews, wallet] = await Promise.all([
            this.prisma.orders.count({ where: { buyerId: userId } }),
            this.prisma.reviews.count({ where: { buyerId: userId } }),
            this.prisma.wallet.findUnique({ where: { userId } }),
        ]);
        let sellerStats = null;
        const seller = await this.prisma.sellers.findUnique({
            where: { userId },
        });
        if (seller) {
            sellerStats = {
                storeName: seller.storeName,
                isVerified: seller.isVerified,
                totalSales: seller.totalSales,
                averageRating: seller.averageRating,
                reputationScore: seller.reputationScore,
            };
        }
        return {
            role: user.role,
            buyerStats: {
                totalOrders: buyerOrders,
                totalReviews: reviews,
            },
            wallet: {
                balance: wallet?.balance || 0,
                totalEarnings: wallet?.totalEarnings || 0,
            },
            sellerStats,
            memberSince: user.createdAt,
        };
    }
    async searchUsers(query, limit = 20) {
        return this.prisma.users.findMany({
            where: {
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
            },
            take: limit,
        });
    }
    async deactivateAccount(userId) {
        this.logger.log(`Deactivating account for user ${userId}`);
        return this.prisma.users.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });
    }
    async reactivateAccount(userId) {
        this.logger.log(`Reactivating account for user ${userId}`);
        return this.prisma.users.update({
            where: { id: userId },
            data: {
                isActive: true,
                deletedAt: null,
            },
        });
    }
    async getAllUsers(limit = 100) {
        return this.prisma.users.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                isActive: true,
                isBanned: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map