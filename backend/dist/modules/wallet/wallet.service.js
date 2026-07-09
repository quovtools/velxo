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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const library_1 = require("@prisma/client/runtime/library");
let WalletService = WalletService_1 = class WalletService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WalletService_1.name);
    }
    async getOrCreateWallet(userId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: {
                    userId,
                    balance: new library_1.Decimal(0),
                    currency: 'USD',
                },
            });
        }
        return wallet;
    }
    async getWalletBalance(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new custom_exceptions_1.NotFoundException('Wallet');
        }
        return wallet;
    }
    async creditBalance(userId, amount, description, relatedId) {
        this.logger.log(`Crediting ${amount} to user ${userId}`);
        return await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });
            if (!wallet) {
                throw new custom_exceptions_1.NotFoundException('Wallet');
            }
            const newBalance = wallet.balance.plus(amount);
            await tx.wallet.update({
                where: { userId },
                data: {
                    balance: newBalance,
                    totalEarnings: wallet.totalEarnings.plus(amount),
                },
            });
            await tx.walletTransactions.create({
                data: {
                    walletId: wallet.id,
                    type: 'CREDIT',
                    amount,
                    currency: wallet.currency,
                    balanceAfter: newBalance,
                    description,
                    relatedId,
                },
            });
            return newBalance;
        });
    }
    async debitBalance(userId, amount, description, relatedId) {
        this.logger.log(`Debiting ${amount} from user ${userId}`);
        return await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });
            if (!wallet) {
                throw new custom_exceptions_1.NotFoundException('Wallet');
            }
            if (wallet.balance.lessThan(amount)) {
                throw new custom_exceptions_1.InsufficientFundsException('Insufficient wallet balance');
            }
            const newBalance = wallet.balance.minus(amount);
            await tx.wallet.update({
                where: { userId },
                data: {
                    balance: newBalance,
                },
            });
            await tx.walletTransactions.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEBIT',
                    amount,
                    currency: wallet.currency,
                    balanceAfter: newBalance,
                    description,
                    relatedId,
                },
            });
            return newBalance;
        });
    }
    async getTransactionHistory(userId, limit = 50) {
        const wallet = await this.getWalletBalance(userId);
        return this.prisma.walletTransactions.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async withdraw(userId, amount, method, destination) {
        if (amount.lessThanOrEqualTo(0)) {
            throw new common_1.BadRequestException('Withdrawal amount must be greater than zero');
        }
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });
            if (!wallet) {
                throw new custom_exceptions_1.NotFoundException('Wallet');
            }
            if (wallet.balance.lessThan(amount)) {
                throw new custom_exceptions_1.InsufficientFundsException('Insufficient wallet balance');
            }
            const newBalance = wallet.balance.minus(amount);
            await tx.wallet.update({
                where: { userId },
                data: {
                    balance: newBalance,
                    totalWithdrawn: wallet.totalWithdrawn.plus(amount),
                },
            });
            await tx.walletTransactions.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEBIT',
                    amount,
                    currency: wallet.currency,
                    balanceAfter: newBalance,
                    description: `Withdrawal via ${method}${destination ? ` (${destination})` : ''}`,
                },
            });
            return { balance: newBalance, totalWithdrawn: wallet.totalWithdrawn.plus(amount) };
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map