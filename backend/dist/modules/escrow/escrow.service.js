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
var EscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const notifications_service_1 = require("../notifications/notifications.service");
const payments_service_1 = require("../payments/payments.service");
let EscrowService = EscrowService_1 = class EscrowService {
    constructor(prisma, notifications, payments) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.payments = payments;
        this.logger = new common_1.Logger(EscrowService_1.name);
    }
    async getEscrowStatus(orderId) {
        const escrow = await this.prisma.escrowTransactions.findUnique({
            where: { orderId },
        });
        if (!escrow) {
            throw new custom_exceptions_1.NotFoundException('Escrow');
        }
        return escrow;
    }
    async getEscrowForOrder(orderId, userId) {
        const escrow = await this.prisma.escrowTransactions.findUnique({
            where: { orderId },
        });
        if (!escrow) {
            throw new custom_exceptions_1.NotFoundException('Escrow');
        }
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                buyer: { select: { id: true, email: true, firstName: true, lastName: true } },
                seller: { include: { user: { select: { id: true, email: true } } } },
                orderItems: { include: { listing: { select: { id: true, title: true, price: true } } } },
            },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (userId) {
            const isBuyer = order.buyerId === userId;
            const isSeller = order.seller?.userId === userId;
            const isAdmin = false;
            if (!isBuyer && !isSeller && !isAdmin) {
                throw new custom_exceptions_1.ForbiddenException('You do not have access to this escrow');
            }
        }
        let paymentLink = order.metadata?.paymentLink ?? null;
        if (!paymentLink) {
            const payment = await this.prisma.payments.findFirst({
                where: { orderId },
                orderBy: { createdAt: 'desc' },
            });
            paymentLink = payment?.metadata?.paymentLink ?? null;
        }
        const chosenProvider = order.metadata?.paymentMethod;
        return {
            id: escrow.id,
            status: escrow.status,
            amount: escrow.amount,
            currency: escrow.currency,
            paymentLink,
            paymentMethod: chosenProvider ?? null,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                totalAmount: order.totalAmount,
                currency: order.currency,
                buyerId: order.buyerId,
                sellerId: order.sellerId,
                buyer: order.buyer,
                seller: order.seller,
                items: order.orderItems,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            },
        };
    }
    async generatePaymentLink(orderId, userId) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { buyer: true, seller: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (userId && order.buyerId !== userId) {
            const isAdmin = false;
            if (!isAdmin) {
                throw new custom_exceptions_1.ForbiddenException('Only the buyer can generate a payment link');
            }
        }
        if (order.status === 'PAID' ||
            order.status === 'COMPLETED' ||
            order.status === 'IN_PROGRESS' ||
            order.status === 'DELIVERED') {
            throw new custom_exceptions_1.InvalidEscrowStateException('This order has already been paid');
        }
        const chosenProvider = order.metadata?.paymentMethod;
        const existing = await this.prisma.payments.findFirst({
            where: { orderId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
        const existingLink = existing?.metadata?.paymentLink;
        if (existing && existingLink) {
            return { url: existingLink, provider: existing.provider, configured: true };
        }
        const link = await this.payments.createPaymentLink(orderId, chosenProvider);
        return { url: link.url, provider: link.provider, configured: link.configured };
    }
    async holdFunds(orderId, amount, currency) {
        this.logger.log(`Holding ${amount} ${currency} in escrow for order ${orderId}`);
        const escrow = await this.prisma.escrowTransactions.create({
            data: {
                orderId,
                amount,
                currency,
                status: client_1.EscrowStatus.HELD,
            },
        });
        return escrow;
    }
    async releaseFunds(orderId) {
        this.logger.log(`Releasing funds from escrow for order ${orderId}`);
        const escrow = await this.prisma.escrowTransactions.findUnique({
            where: { orderId },
        });
        if (!escrow) {
            throw new custom_exceptions_1.NotFoundException('Escrow');
        }
        if (escrow.status !== client_1.EscrowStatus.HELD) {
            throw new custom_exceptions_1.InvalidEscrowStateException(`Cannot release funds. Current status: ${escrow.status}`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const updatedEscrow = await tx.escrowTransactions.update({
                where: { id: escrow.id },
                data: {
                    status: client_1.EscrowStatus.RELEASED,
                    releasedAt: new Date(),
                },
            });
            const order = await tx.orders.findUnique({
                where: { id: orderId },
                include: { seller: true },
            });
            if (order) {
                const wallet = await tx.wallet.findUnique({
                    where: { userId: order.seller?.userId ?? '' },
                });
                if (wallet) {
                    const newBalance = wallet.balance.plus(order.sellerPayout);
                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: newBalance,
                            totalEarnings: wallet.totalEarnings.plus(order.sellerPayout),
                        },
                    });
                    await tx.walletTransactions.create({
                        data: {
                            walletId: wallet.id,
                            type: 'CREDIT',
                            amount: order.sellerPayout,
                            currency: order.currency,
                            balanceAfter: newBalance,
                            description: `Escrow release for order ${order.orderNumber}`,
                            relatedId: orderId,
                        },
                    });
                }
            }
            return updatedEscrow;
        });
        const releasedOrder = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { seller: true, buyer: true },
        });
        if (releasedOrder) {
            await this.notifications.notifyCompleted(releasedOrder).catch(() => { });
        }
        return updated;
    }
    async refundFunds(orderId, reason) {
        this.logger.log(`Refunding funds for order ${orderId}. Reason: ${reason}`);
        const escrow = await this.prisma.escrowTransactions.findUnique({
            where: { orderId },
        });
        if (!escrow) {
            throw new custom_exceptions_1.NotFoundException('Escrow');
        }
        if (escrow.status === client_1.EscrowStatus.REFUNDED) {
            throw new custom_exceptions_1.InvalidEscrowStateException('Escrow already refunded');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const updatedEscrow = await tx.escrowTransactions.update({
                where: { id: escrow.id },
                data: {
                    status: client_1.EscrowStatus.REFUNDED,
                    refundedAt: new Date(),
                },
            });
            const order = await tx.orders.findUnique({
                where: { id: orderId },
                include: { buyer: true },
            });
            if (order && order.buyer) {
                const buyerWallet = await tx.wallet.findUnique({
                    where: { userId: order.buyer.id },
                });
                if (buyerWallet) {
                    await tx.walletTransactions.create({
                        data: {
                            walletId: buyerWallet.id,
                            type: 'REFUND',
                            amount: order.totalAmount,
                            currency: order.currency,
                            balanceAfter: buyerWallet.balance,
                            description: `Refund for order ${order.orderNumber}. Reason: ${reason}`,
                            relatedId: orderId,
                        },
                    });
                }
            }
            return updatedEscrow;
        });
        const refundedOrder = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { seller: true, buyer: true },
        });
        if (refundedOrder) {
            await this.notifications
                .notifyRefunded(refundedOrder, `${refundedOrder.totalAmount} ${refundedOrder.currency}`)
                .catch(() => { });
        }
        return updated;
    }
    async getEscrowHistory(limit = 50) {
        return this.prisma.escrowTransactions.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                order: {
                    include: {
                        buyer: { select: { id: true, email: true } },
                        seller: { select: { id: true } },
                    },
                },
            },
        });
    }
    async getSellerEscrowBalance(sellerId) {
        const escrows = await this.prisma.escrowTransactions.findMany({
            where: {
                order: { sellerId },
                status: client_1.EscrowStatus.HELD,
            },
        });
        const totalHeld = escrows.reduce((sum, e) => sum.plus(e.amount), new library_1.Decimal(0));
        return {
            totalHeld,
            escrowCount: escrows.length,
        };
    }
};
exports.EscrowService = EscrowService;
exports.EscrowService = EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        payments_service_1.PaymentsService])
], EscrowService);
//# sourceMappingURL=escrow.service.js.map