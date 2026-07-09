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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = exports.ESCROW_BUYER_WINDOW_MS = exports.ESCROW_SELLER_WINDOW_MS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
exports.ESCROW_SELLER_WINDOW_MS = 60 * 60 * 1000;
exports.ESCROW_BUYER_WINDOW_MS = 60 * 60 * 1000;
const rewards_service_1 = require("../rewards/rewards.service");
const notifications_service_1 = require("../notifications/notifications.service");
function commissionRateForTier(tier) {
    switch (tier) {
        case 'PRO':
            return 0.05;
        case 'PREMIUM':
            return 0.03;
        default:
            return 0.1;
    }
}
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(prisma, rewardsService, notifications) {
        this.prisma = prisma;
        this.rewardsService = rewardsService;
        this.notifications = notifications;
        this.logger = new common_1.Logger(OrdersService_1.name);
    }
    async createOrder(buyerId, dto) {
        this.logger.log(`Creating order for buyer ${buyerId}`);
        const listing = await this.prisma.listings.findUnique({
            where: { id: dto.listingId },
            include: { seller: true },
        });
        if (!listing) {
            throw new custom_exceptions_1.NotFoundException('Listing');
        }
        if (listing.status !== 'ACTIVE' || listing.isSold) {
            throw new custom_exceptions_1.BadRequestException('This listing is not available for purchase');
        }
        if (listing.seller.userId === buyerId) {
            throw new custom_exceptions_1.ForbiddenException('Cannot purchase your own listing');
        }
        let sellerId = listing.seller?.id;
        if (!sellerId) {
            const sellerByUser = await this.prisma.sellers.findUnique({
                where: { userId: listing.sellerId },
            });
            sellerId = sellerByUser?.id;
        }
        if (!sellerId) {
            throw new custom_exceptions_1.BadRequestException('This listing is not linked to a valid seller');
        }
        const commissionRate = commissionRateForTier(listing.seller?.subscriptionTier);
        const subtotal = new library_1.Decimal(listing.price).times(dto.quantity);
        const commissionAmount = subtotal.times(commissionRate);
        const sellerPayout = subtotal.minus(commissionAmount);
        const order = await this.prisma.$transaction(async (tx) => {
            const liveListing = await tx.listings.findUnique({ where: { id: dto.listingId } });
            if (!liveListing || liveListing.status !== 'ACTIVE' || liveListing.isSold) {
                throw new custom_exceptions_1.BadRequestException('This listing is no longer available for purchase');
            }
            const newOrder = await tx.orders.create({
                data: {
                    orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    buyerId,
                    sellerId,
                    subtotal,
                    totalAmount: subtotal,
                    commissionRate: new library_1.Decimal(commissionRate),
                    commissionAmount,
                    sellerPayout,
                    currency: listing.currency,
                    buyerNote: dto.buyerNote,
                    status: client_1.OrderStatus.PENDING,
                    metadata: dto.paymentMethodId ? { paymentMethod: dto.paymentMethodId } : undefined,
                    orderItems: {
                        create: {
                            listingId: dto.listingId,
                            quantity: dto.quantity,
                            unitPrice: listing.price,
                            totalPrice: subtotal,
                        },
                    },
                    escrow: {
                        create: {
                            amount: subtotal,
                            currency: listing.currency,
                            status: client_1.EscrowStatus.HELD,
                        },
                    },
                },
                include: {
                    orderItems: { include: { listing: true } },
                    escrow: true,
                    buyer: true,
                    seller: true,
                },
            });
            await tx.commissions.create({
                data: {
                    orderId: newOrder.id,
                    sellerId,
                    rate: new library_1.Decimal(commissionRate),
                    amount: commissionAmount,
                    currency: listing.currency,
                },
            });
            await tx.listings.update({
                where: { id: dto.listingId },
                data: { salesCount: { increment: 1 } },
            });
            await tx.listings.update({
                where: { id: dto.listingId },
                data: { isSold: true, status: client_1.ListingStatus.SOLD },
            });
            return newOrder;
        });
        await this.notifications.notifyNewOrder(order).catch(() => { });
        return order;
    }
    async createServiceOrder(buyerId, dto) {
        this.logger.log(`Creating ${dto.sourceType} service order for buyer ${buyerId}`);
        const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;
        const currency = dto.currency || 'USD';
        const seller = await this.prisma.sellers.findUnique({
            where: { id: dto.sellerId },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller');
        }
        if (seller.userId === buyerId) {
            throw new custom_exceptions_1.ForbiddenException('Cannot purchase your own service');
        }
        const commissionRate = commissionRateForTier(seller.subscriptionTier);
        const subtotal = new library_1.Decimal(dto.price).times(quantity);
        const commissionAmount = subtotal.times(commissionRate);
        const sellerPayout = subtotal.minus(commissionAmount);
        const order = await this.prisma.$transaction(async (tx) => {
            const newOrder = await tx.orders.create({
                data: {
                    orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    buyerId,
                    sellerId: dto.sellerId,
                    subtotal,
                    totalAmount: subtotal,
                    commissionRate: new library_1.Decimal(commissionRate),
                    commissionAmount,
                    sellerPayout,
                    currency,
                    buyerNote: dto.buyerNote,
                    status: client_1.OrderStatus.PENDING,
                    metadata: {
                        sourceType: dto.sourceType,
                        sourceId: dto.sourceId,
                        title: dto.title,
                    },
                    orderItems: {
                        create: {
                            listingId: null,
                            quantity,
                            unitPrice: new library_1.Decimal(dto.price),
                            totalPrice: subtotal,
                        },
                    },
                    escrow: {
                        create: {
                            amount: subtotal,
                            currency,
                            status: client_1.EscrowStatus.HELD,
                        },
                    },
                },
                include: {
                    orderItems: true,
                    escrow: true,
                    buyer: true,
                    seller: true,
                },
            });
            await tx.commissions.create({
                data: {
                    orderId: newOrder.id,
                    sellerId: dto.sellerId,
                    rate: new library_1.Decimal(commissionRate),
                    amount: commissionAmount,
                    currency,
                },
            });
            return newOrder;
        });
        await this.notifications.notifyNewOrder(order).catch(() => { });
        return order;
    }
    async acceptOrder(orderId, sellerId) {
        this.logger.log(`Seller accepting order ${orderId}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { seller: true, buyer: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.seller?.userId !== sellerId) {
            throw new custom_exceptions_1.ForbiddenException('Only the seller can accept this order');
        }
        if (order.status !== client_1.OrderStatus.PAID) {
            throw new custom_exceptions_1.BadRequestException('Order must be paid before it can be accepted');
        }
        if (order.acceptedAt) {
            throw new custom_exceptions_1.BadRequestException('Order has already been accepted');
        }
        const acceptedAt = new Date();
        const updated = await this.prisma.orders.update({
            where: { id: orderId },
            data: {
                acceptedAt,
                sellerDeliverDeadline: new Date(acceptedAt.getTime() + exports.ESCROW_SELLER_WINDOW_MS),
            },
            include: { buyer: true, seller: true, orderItems: { include: { listing: true } } },
        });
        await this.notifications.notifyOrderAccepted?.(updated).catch(() => { });
        return updated;
    }
    async getOrderById(orderId, userId) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                buyer: true,
                seller: true,
                orderItems: { include: { listing: true } },
                escrow: true,
                payments: true,
                disputes: true,
            },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.buyerId !== userId && order.seller?.userId !== userId) {
            throw new custom_exceptions_1.ForbiddenException('You do not have access to this order');
        }
        return order;
    }
    async confirmDelivery(orderId, buyerId) {
        this.logger.log(`Confirming delivery for order ${orderId}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { escrow: true, seller: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.buyerId !== buyerId) {
            throw new custom_exceptions_1.ForbiddenException('Only the buyer can confirm delivery');
        }
        if (order.status !== client_1.OrderStatus.IN_PROGRESS) {
            throw new custom_exceptions_1.InvalidEscrowStateException('Order is not in progress');
        }
        if (!order.escrow) {
            throw new custom_exceptions_1.InvalidEscrowStateException('No escrow record for this order');
        }
        if (order.escrow.status !== client_1.EscrowStatus.HELD) {
            throw new custom_exceptions_1.InvalidEscrowStateException('Escrow is not held');
        }
        const updatedOrder = await this.prisma.$transaction(async (tx) => {
            await tx.escrowTransactions.update({
                where: { id: order.escrow.id },
                data: {
                    status: client_1.EscrowStatus.RELEASED,
                    releasedAt: new Date(),
                },
            });
            const updatedOrder = await tx.orders.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    completedAt: new Date(),
                    paidAt: new Date(),
                },
                include: {
                    buyer: true,
                    seller: true,
                    orderItems: { include: { listing: true } },
                },
            });
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
                        description: `Payment for order ${order.orderNumber}`,
                        relatedId: orderId,
                    },
                });
            }
            await tx.commissions.updateMany({
                where: {
                    orderId,
                },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });
            const buyerCoinAmount = Math.floor(Number(order.totalAmount));
            const sellerCoinAmount = Math.floor(Number(order.sellerPayout)) * 2;
            await this.rewardsService.creditCoins(order.buyerId, buyerCoinAmount, 'PURCHASE', `Earned ${buyerCoinAmount} coins from order ${order.orderNumber}`, orderId);
            const sellerUserId = order.seller?.userId;
            if (sellerUserId) {
                await this.rewardsService.creditCoins(sellerUserId, sellerCoinAmount, 'SALE', `Earned ${sellerCoinAmount} coins from order ${order.orderNumber}`, orderId);
            }
            const referral = await tx.affiliateReferrals.findFirst({
                where: { referredUserId: order.buyerId },
            });
            if (referral) {
                const affiliateCommission = Number(order.totalAmount) * Number(referral.commissionRate);
                await tx.affiliateReferrals.update({
                    where: { id: referral.id },
                    data: {
                        totalEarned: { increment: affiliateCommission },
                        tradeCount: { increment: 1 },
                    },
                });
                const referrerCoins = Math.floor(affiliateCommission * 10);
                await this.rewardsService.creditCoins(referral.referrerId, referrerCoins, 'REFERRAL', `Earned ${referrerCoins} coins from referral trade ${order.orderNumber}`, orderId);
            }
            return updatedOrder;
        });
        await this.notifications.notifyCompleted(updatedOrder).catch(() => { });
        return updatedOrder;
    }
    async getBuyerOrders(buyerId) {
        return this.prisma.orders.findMany({
            where: { buyerId },
            include: {
                seller: true,
                orderItems: { include: { listing: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSellerOrders(sellerId) {
        return this.prisma.orders.findMany({
            where: { sellerId },
            include: {
                buyer: true,
                orderItems: { include: { listing: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markDelivered(orderId, sellerId, deliveryData) {
        this.logger.log(`Seller marking order ${orderId} as delivered`);
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { seller: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.seller?.userId !== sellerId) {
            throw new custom_exceptions_1.ForbiddenException('Only the seller can mark this order as delivered');
        }
        if (order.status !== client_1.OrderStatus.PAID) {
            throw new custom_exceptions_1.BadRequestException('Order must be paid before it can be marked delivered');
        }
        const updated = await this.prisma.orders.update({
            where: { id: orderId },
            data: {
                status: client_1.OrderStatus.IN_PROGRESS,
                deliveryData: deliveryData ?? order.deliveryData,
                deliveredAt: new Date(),
                buyerConfirmDeadline: new Date(Date.now() + exports.ESCROW_BUYER_WINDOW_MS),
            },
            include: {
                buyer: true,
                seller: true,
                orderItems: { include: { listing: true } },
            },
        });
        await this.notifications.notifyDelivered(updated).catch(() => { });
        return updated;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rewards_service_1.RewardsService,
        notifications_service_1.NotificationsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map