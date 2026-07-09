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
var RewardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
let RewardsService = RewardsService_1 = class RewardsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RewardsService_1.name);
    }
    async getCoinBalance(userId) {
        return this.prisma.velxoCoins.upsert({
            where: { userId },
            create: { userId, balance: 0, currency: 'VXC' },
            update: {},
        });
    }
    async getTransactions(userId, limit = 50) {
        const coins = await this.prisma.velxoCoins.upsert({
            where: { userId },
            create: { userId, balance: 0, currency: 'VXC' },
            update: {},
        });
        return this.prisma.rewardCoinTransactions.findMany({
            where: { coinId: coins.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getCatalog() {
        return this.prisma.rewardCatalog.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async creditCoins(userId, amount, type, description, relatedId) {
        this.logger.log(`Crediting ${amount} coins to user ${userId}`);
        return await this.prisma.$transaction(async (tx) => {
            const coins = await tx.velxoCoins.upsert({
                where: { userId },
                create: { userId, balance: 0, currency: 'VXC' },
                update: {},
            });
            const newBalance = coins.balance + amount;
            await tx.velxoCoins.update({
                where: { userId },
                data: { balance: newBalance },
            });
            await tx.rewardCoinTransactions.create({
                data: {
                    coinId: coins.id,
                    type,
                    amount,
                    balanceAfter: newBalance,
                    description,
                    relatedId,
                },
            });
            return newBalance;
        });
    }
    async debitCoins(userId, amount, description, relatedId) {
        this.logger.log(`Debiting ${amount} coins from user ${userId}`);
        return await this.prisma.$transaction(async (tx) => {
            const coins = await tx.velxoCoins.findUnique({ where: { userId } });
            if (!coins) {
                throw new custom_exceptions_1.NotFoundException('Velxo Coins wallet');
            }
            if (coins.balance < amount) {
                throw new custom_exceptions_1.BadRequestException('Insufficient Velxo Coins');
            }
            const newBalance = coins.balance - amount;
            await tx.velxoCoins.update({
                where: { userId },
                data: { balance: newBalance },
            });
            await tx.rewardCoinTransactions.create({
                data: {
                    coinId: coins.id,
                    type: 'DEBIT',
                    amount,
                    balanceAfter: newBalance,
                    description,
                    relatedId,
                },
            });
            return newBalance;
        });
    }
    async redeem(userId, catalogId) {
        const catalogItem = await this.prisma.rewardCatalog.findUnique({ where: { id: catalogId } });
        if (!catalogItem || !catalogItem.isActive) {
            throw new custom_exceptions_1.NotFoundException('Reward item');
        }
        const coins = await this.prisma.velxoCoins.findUnique({ where: { userId } });
        if (!coins || coins.balance < catalogItem.coinCost) {
            throw new custom_exceptions_1.BadRequestException('Insufficient Velxo Coins');
        }
        const redemption = await this.prisma.$transaction(async (tx) => {
            const newBalance = coins.balance - catalogItem.coinCost;
            await tx.velxoCoins.update({
                where: { userId },
                data: { balance: newBalance },
            });
            await tx.rewardCoinTransactions.create({
                data: {
                    coinId: coins.id,
                    type: 'DEBIT',
                    amount: catalogItem.coinCost,
                    balanceAfter: newBalance,
                    description: `Redeemed: ${catalogItem.name}`,
                },
            });
            const red = await tx.rewardRedemptions.create({
                data: {
                    userId,
                    catalogId,
                    coinCost: catalogItem.coinCost,
                    status: 'PENDING',
                },
            });
            return red;
        });
        return redemption;
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = RewardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RewardsService);
//# sourceMappingURL=rewards.service.js.map