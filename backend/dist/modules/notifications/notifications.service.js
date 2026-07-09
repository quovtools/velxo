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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const notifications_gateway_1 = require("../gateways/notifications.gateway");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async createNotification(userId, type, title, body, data) {
        const notification = await this.prisma.notifications.create({
            data: {
                userId,
                type,
                title,
                body,
                data,
            },
        });
        try {
            this.gateway?.emitToUser(userId, 'newNotification', notification);
        }
        catch (err) {
            this.logger.warn(`Failed to push real-time notification: ${err}`);
        }
        return notification;
    }
    async notifySubscriptionActivated(userId, planName, endsAt) {
        if (!userId)
            return;
        const expiry = endsAt.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        return this.createNotification(userId, 'SYSTEM', `${planName} activated 🎉`, `Your ${planName} subscription is live until ${expiry}. Your public store link is now active and your commission rate has been reduced.`, { planName, endsAt });
    }
    async notifyNewMessage(recipientId, senderName, preview, conversationId, orderId) {
        if (!recipientId)
            return;
        return this.createNotification(recipientId, 'MESSAGE', `New message from ${senderName}`, preview, { conversationId, orderId });
    }
    async notifyNewOrder(order) {
        const sellerUserId = order?.seller?.userId;
        if (!sellerUserId)
            return;
        const product = order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your listing';
        return this.createNotification(sellerUserId, 'ORDER_STATUS', 'New Order Received', `You have a new order (${order.orderNumber}) for ${product}`, { orderId: order.id, orderNumber: order.orderNumber, status: 'PENDING' });
    }
    async notifyOrderAccepted(order) {
        const buyerUserId = order?.buyer?.id;
        if (!buyerUserId)
            return;
        const product = order?.orderItems?.[0]?.listing?.title || order?.metadata?.title || 'your order';
        return this.createNotification(buyerUserId, 'ORDER_STATUS', 'Order Accepted', `Your order (${order.orderNumber}) for ${product} has been accepted by the seller.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'ACCEPTED' });
    }
    async notifyPaymentConfirmed(order) {
        if (!order)
            return;
        await this.createNotification(order.buyerId, 'ORDER_STATUS', 'Payment Confirmed', `Your payment for order ${order.orderNumber} was received. The seller will begin fulfilment.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'PAID' });
        const sellerUserId = order?.seller?.userId;
        if (sellerUserId) {
            await this.createNotification(sellerUserId, 'ORDER_STATUS', 'Payment Received', `Payment for order ${order.orderNumber} has been received. Please begin fulfilment.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'PAID' });
        }
    }
    async notifyDelivered(order) {
        if (!order)
            return;
        return this.createNotification(order.buyerId, 'ORDER_STATUS', 'Order Delivered', `The seller marked order ${order.orderNumber} as delivered. Please confirm receipt.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'IN_PROGRESS' });
    }
    async notifyCompleted(order) {
        if (!order)
            return;
        await this.createNotification(order.buyerId, 'ORDER_STATUS', 'Order Completed', `Order ${order.orderNumber} is complete. Funds have been released to the seller.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'COMPLETED' });
        const sellerUserId = order?.seller?.userId;
        if (sellerUserId) {
            await this.createNotification(sellerUserId, 'ORDER_STATUS', 'Payment Released', `Funds for order ${order.orderNumber} have been released to your wallet.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'COMPLETED' });
        }
    }
    async notifyRefunded(order, amount) {
        if (!order)
            return;
        const amt = amount ? ` (${amount} ${order.currency})` : '';
        return this.createNotification(order.buyerId, 'ORDER_STATUS', 'Order Refunded', `Order ${order.orderNumber} has been refunded${amt}.`, { orderId: order.id, orderNumber: order.orderNumber, status: 'REFUNDED' });
    }
    async getNotifications(userId, limit = 50) {
        return this.prisma.notifications.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getUnreadNotifications(userId) {
        return this.prisma.notifications.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markAsRead(notificationId, userId) {
        if (userId) {
            const existing = await this.prisma.notifications.findUnique({
                where: { id: notificationId },
            });
            if (!existing || existing.userId !== userId) {
                throw new custom_exceptions_1.NotFoundException('Notification');
            }
        }
        return this.prisma.notifications.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notifications.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async deleteNotification(notificationId, userId) {
        if (userId) {
            const existing = await this.prisma.notifications.findUnique({
                where: { id: notificationId },
            });
            if (!existing || existing.userId !== userId) {
                throw new custom_exceptions_1.NotFoundException('Notification');
            }
        }
        return this.prisma.notifications.delete({
            where: { id: notificationId },
        });
    }
    async notifyOrderStatus(orderId, status) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
        });
        if (!order)
            return;
        await this.createNotification(order.buyerId, 'ORDER_STATUS', 'Order Status Updated', `Your order ${order.orderNumber} status changed to ${status}`, { orderId, status });
    }
    async notifyDispute(disputeId, userId) {
        await this.createNotification(userId, 'DISPUTE', 'Dispute Opened', 'A dispute has been opened for one of your orders', { disputeId });
    }
    async notifyListingApproved(listingId, sellerId) {
        await this.createNotification(sellerId, 'LISTING_APPROVED', 'Listing Approved', 'Your listing has been approved and is now live', { listingId });
    }
    async notifyListingRejected(listingId, sellerId, reason) {
        await this.createNotification(sellerId, 'LISTING_REJECTED', 'Listing Rejected', `Your listing was rejected: ${reason}`, { listingId, reason });
    }
    async notifyKycApproved(sellerId, storeName) {
        await this.createNotification(sellerId, 'KYC_APPROVED', 'Identity Verified', `Congratulations! Your seller identity for ${storeName} has been verified. You now have a verified badge.`, { storeName });
    }
    async notifyKycRejected(sellerId, storeName, reason) {
        await this.createNotification(sellerId, 'KYC_REJECTED', 'Verification Rejected', `Your identity verification for ${storeName} was rejected: ${reason}`, { storeName, reason });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map