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
var DisputesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const notifications_service_1 = require("../notifications/notifications.service");
let DisputesService = DisputesService_1 = class DisputesService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.logger = new common_1.Logger(DisputesService_1.name);
    }
    async createDispute(initiatorId, dto) {
        this.logger.log(`Creating dispute for order ${dto.orderId}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: dto.orderId },
            include: { seller: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.buyerId !== initiatorId && order.seller?.userId !== initiatorId) {
            throw new custom_exceptions_1.ForbiddenException('Only order participants can create disputes');
        }
        const existingDispute = await this.prisma.disputes.findFirst({
            where: { orderId: dto.orderId, status: { not: client_1.DisputeStatus.CLOSED } },
        });
        if (existingDispute) {
            throw new custom_exceptions_1.InvalidEscrowStateException('An active dispute already exists for this order');
        }
        const dispute = await this.prisma.disputes.create({
            data: {
                orderId: dto.orderId,
                initiatedById: initiatorId,
                reason: dto.reason,
                evidence: dto.evidence || dto.description
                    ? { evidence: dto.evidence ?? null, description: dto.description ?? null }
                    : undefined,
                status: client_1.DisputeStatus.OPEN,
            },
            include: {
                order: { include: { buyer: true, seller: true } },
                initiator: true,
            },
        });
        await this.prisma.orders.update({
            where: { id: dto.orderId },
            data: { status: client_1.OrderStatus.DISPUTED },
        });
        const counterpartyId = initiatorId === order.buyerId ? order.seller?.userId : order.buyerId;
        if (counterpartyId) {
            await this.notifications
                .notifyDispute(dispute.id, counterpartyId)
                .catch(() => { });
        }
        return dispute;
    }
    async getDisputeById(disputeId) {
        const dispute = await this.prisma.disputes.findUnique({
            where: { id: disputeId },
            include: {
                order: { include: { buyer: true, seller: true, orderItems: { include: { listing: true } } } },
                initiator: true,
                resolver: true,
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!dispute) {
            throw new custom_exceptions_1.NotFoundException('Dispute');
        }
        return dispute;
    }
    async getOpenDisputes(limit = 50) {
        return this.prisma.disputes.findMany({
            where: { status: { in: [client_1.DisputeStatus.OPEN, client_1.DisputeStatus.UNDER_REVIEW] } },
            include: {
                order: { include: { buyer: true, seller: true } },
                initiator: true,
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }
    async resolveDispute(disputeId, resolverId, dto) {
        this.logger.log(`Resolving dispute ${disputeId}`);
        const dispute = await this.prisma.disputes.findUnique({
            where: { id: disputeId },
            include: { order: true },
        });
        if (!dispute) {
            throw new custom_exceptions_1.NotFoundException('Dispute');
        }
        if (dispute.status === client_1.DisputeStatus.CLOSED) {
            throw new custom_exceptions_1.InvalidEscrowStateException('Dispute is already closed');
        }
        return await this.prisma.$transaction(async (tx) => {
            const resolvedStatus = dto.resolutionType === 'REFUND_BUYER'
                ? client_1.DisputeStatus.RESOLVED_BUYER
                : dto.resolutionType === 'RELEASE_TO_SELLER'
                    ? client_1.DisputeStatus.RESOLVED_SELLER
                    : client_1.DisputeStatus.RESOLVED_PLATFORM;
            const updatedDispute = await tx.disputes.update({
                where: { id: disputeId },
                data: {
                    status: resolvedStatus,
                    resolvedBy: resolverId,
                    resolvedAt: new Date(),
                    resolutionType: dto.resolutionType,
                    resolutionNotes: dto.resolutionNotes,
                    refundAmount: dto.refundAmount ? new library_1.Decimal(dto.refundAmount) : undefined,
                },
                include: {
                    order: { include: { seller: true } },
                },
            });
            const order = updatedDispute.order;
            if (dto.resolutionType === 'REFUND_BUYER') {
                const escrow = await tx.escrowTransactions.findUnique({
                    where: { orderId: order.id },
                });
                if (escrow && escrow.status !== client_1.EscrowStatus.REFUNDED) {
                    await tx.escrowTransactions.update({
                        where: { id: escrow.id },
                        data: {
                            status: client_1.EscrowStatus.REFUNDED,
                            refundedAt: new Date(),
                        },
                    });
                }
                const requested = dto.refundAmount ? new library_1.Decimal(dto.refundAmount) : order.totalAmount;
                const refundAmount = requested.lessThan(order.totalAmount)
                    ? requested
                    : order.totalAmount;
                const buyerWallet = await tx.wallet.findUnique({
                    where: { userId: order.buyerId },
                });
                if (buyerWallet) {
                    const newBalance = buyerWallet.balance.plus(refundAmount);
                    await tx.wallet.update({
                        where: { id: buyerWallet.id },
                        data: { balance: newBalance },
                    });
                    await tx.walletTransactions.create({
                        data: {
                            walletId: buyerWallet.id,
                            type: 'REFUND',
                            amount: refundAmount,
                            currency: order.currency,
                            balanceAfter: newBalance,
                            description: `Dispute refund for order ${order.orderNumber}`,
                            relatedId: order.id,
                        },
                    });
                }
                await tx.orders.update({
                    where: { id: order.id },
                    data: { status: client_1.OrderStatus.REFUNDED, refundedAt: new Date() },
                });
            }
            else {
                const escrow = await tx.escrowTransactions.findUnique({
                    where: { orderId: order.id },
                });
                if (escrow && escrow.status === client_1.EscrowStatus.HELD) {
                    await tx.escrowTransactions.update({
                        where: { id: escrow.id },
                        data: {
                            status: client_1.EscrowStatus.RELEASED,
                            releasedAt: new Date(),
                        },
                    });
                }
                const sellerWallet = await tx.wallet.findUnique({
                    where: { userId: order.seller?.userId ?? '' },
                });
                if (sellerWallet) {
                    const newBalance = sellerWallet.balance.plus(order.sellerPayout);
                    await tx.wallet.update({
                        where: { id: sellerWallet.id },
                        data: {
                            balance: newBalance,
                            totalEarnings: sellerWallet.totalEarnings.plus(order.sellerPayout),
                        },
                    });
                    await tx.walletTransactions.create({
                        data: {
                            walletId: sellerWallet.id,
                            type: 'CREDIT',
                            amount: order.sellerPayout,
                            currency: order.currency,
                            balanceAfter: newBalance,
                            description: `Dispute payout for order ${order.orderNumber}`,
                            relatedId: order.id,
                        },
                    });
                }
                await tx.orders.update({
                    where: { id: order.id },
                    data: {
                        status: client_1.OrderStatus.COMPLETED,
                        completedAt: new Date(),
                        paidAt: new Date(),
                    },
                });
            }
            return updatedDispute;
        });
    }
    async addDisputeMessage(disputeId, senderId, content, attachments) {
        const dispute = await this.prisma.disputes.findUnique({
            where: { id: disputeId },
            include: { order: { include: { seller: true } } },
        });
        if (!dispute) {
            throw new custom_exceptions_1.NotFoundException('Dispute');
        }
        if (senderId !== dispute.initiatedById &&
            senderId !== dispute.order?.buyerId &&
            senderId !== dispute.order?.seller?.userId) {
            throw new custom_exceptions_1.ForbiddenException('You are not a participant in this dispute');
        }
        return this.prisma.disputeMessages.create({
            data: {
                disputeId,
                senderId,
                content,
                attachments: attachments || [],
            },
        });
    }
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = DisputesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map