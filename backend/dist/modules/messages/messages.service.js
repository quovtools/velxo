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
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const messages_gateway_1 = require("../gateways/messages.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
let MessagesService = MessagesService_1 = class MessagesService {
    constructor(prisma, gateway, notifications) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.notifications = notifications;
        this.logger = new common_1.Logger(MessagesService_1.name);
    }
    async getOrCreateConversation(buyerId, sellerId, orderId) {
        this.logger.log(`Getting or creating conversation between ${buyerId} and ${sellerId}`);
        let conversation = await this.prisma.conversations.findFirst({
            where: {
                OR: [
                    { buyerId, sellerId },
                    { buyerId: sellerId, sellerId: buyerId },
                ],
            },
        });
        if (!conversation) {
            conversation = await this.prisma.conversations.create({
                data: {
                    buyerId,
                    sellerId,
                    orderId,
                },
            });
        }
        return conversation;
    }
    async resolveParticipants(userId, dto) {
        if (dto.buyerId && dto.sellerId) {
            return { buyerId: dto.buyerId, sellerId: dto.sellerId, orderId: dto.orderId };
        }
        if (dto.orderId) {
            const order = await this.prisma.orders.findUnique({
                where: { id: dto.orderId },
                include: { seller: true },
            });
            if (!order)
                throw new custom_exceptions_1.NotFoundException('Order');
            if (order.buyerId !== userId && order.seller?.userId !== userId) {
                throw new custom_exceptions_1.ForbiddenException('You are not part of this order');
            }
            return { buyerId: order.buyerId, sellerId: order.seller?.userId ?? '', orderId: dto.orderId };
        }
        if (dto.recipientId) {
            const [meSeller, themSeller] = await Promise.all([
                this.prisma.sellers.findUnique({ where: { userId } }),
                this.prisma.sellers.findUnique({ where: { userId: dto.recipientId } }),
            ]);
            if (meSeller && !themSeller)
                return { buyerId: dto.recipientId, sellerId: userId };
            if (themSeller && !meSeller)
                return { buyerId: userId, sellerId: dto.recipientId };
            return { buyerId: userId, sellerId: dto.recipientId };
        }
        throw new custom_exceptions_1.BadRequestException('Provide buyerId & sellerId, an orderId, or a recipientId');
    }
    async getConversations(userId, limit = 50) {
        const conversations = await this.prisma.conversations.findMany({
            where: {
                OR: [{ buyerId: userId }, { sellerId: userId }],
                isBlocked: false,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: 'desc' },
            take: Math.max(1, Math.floor(Number(limit))) || 50,
        });
        return Promise.all(conversations.map(async (c) => {
            const [buyerUser, sellerProfile] = await Promise.all([
                this.prisma.users.findUnique({
                    where: { id: c.buyerId },
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                }),
                this.prisma.sellers.findUnique({
                    where: { userId: c.sellerId },
                    select: { storeName: true },
                }),
            ]);
            const unreadCount = await this.prisma.messages.count({
                where: {
                    conversationId: c.id,
                    isRead: false,
                    NOT: { senderId: userId },
                },
            });
            return {
                ...c,
                buyer: buyerUser,
                sellerStoreName: sellerProfile?.storeName ?? null,
                unreadCount,
                lastMessage: c.messages[0] ?? null,
            };
        }));
    }
    async getConversationMessages(conversationId, userId, limit = 50) {
        const conversation = await this.prisma.conversations.findUnique({
            where: { id: conversationId },
        });
        if (!conversation) {
            throw new custom_exceptions_1.NotFoundException('Conversation');
        }
        if (userId && conversation.buyerId !== userId && conversation.sellerId !== userId) {
            throw new custom_exceptions_1.ForbiddenException('You are not part of this conversation');
        }
        return this.prisma.messages.findMany({
            where: { conversationId, isDeleted: false },
            include: { sender: true },
            orderBy: { createdAt: 'asc' },
            take: Math.max(1, Math.floor(Number(limit))) || 50,
        });
    }
    async sendMessage(conversationId, senderId, content, attachments) {
        this.logger.log(`Sending message in conversation ${conversationId}`);
        const conversation = await this.prisma.conversations.findUnique({
            where: { id: conversationId },
        });
        if (!conversation) {
            throw new custom_exceptions_1.NotFoundException('Conversation');
        }
        if (senderId !== conversation.buyerId &&
            senderId !== conversation.sellerId) {
            throw new custom_exceptions_1.ForbiddenException('You are not part of this conversation');
        }
        const message = await this.prisma.$transaction(async (tx) => {
            const newMessage = await tx.messages.create({
                data: {
                    conversationId,
                    senderId,
                    senderType: senderId === conversation.buyerId ? 'BUYER' : 'SELLER',
                    content,
                    attachments: attachments || [],
                },
                include: { sender: true },
            });
            await tx.conversations.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            });
            return newMessage;
        });
        try {
            this.gateway?.emitToConversation(conversationId, 'newMessage', message);
        }
        catch (err) {
            this.logger.warn(`Failed to emit real-time message: ${err}`);
        }
        try {
            const recipientId = senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
            if (recipientId && recipientId !== senderId) {
                const senderName = [message.sender?.firstName, message.sender?.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Someone';
                const preview = content.length > 80 ? `${content.slice(0, 77)}...` : content;
                await this.notifications.notifyNewMessage(recipientId, senderName, preview, conversationId, conversation.orderId || undefined);
            }
        }
        catch (err) {
            this.logger.warn(`Failed to notify message recipient: ${err}`);
        }
        return message;
    }
    async markMessagesAsRead(conversationId, userId) {
        this.logger.log(`Marking messages as read in conversation ${conversationId}`);
        return this.prisma.messages.updateMany({
            where: {
                conversationId,
                isRead: false,
                NOT: { senderId: userId },
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    async getUnreadCount(userId) {
        const unread = await this.prisma.messages.count({
            where: {
                conversation: {
                    OR: [{ buyerId: userId }, { sellerId: userId }],
                },
                isRead: false,
                NOT: { senderId: userId },
            },
        });
        return { unreadCount: unread };
    }
    async deleteMessage(messageId, userId) {
        this.logger.log(`Deleting message ${messageId}`);
        const message = await this.prisma.messages.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new custom_exceptions_1.NotFoundException('Message');
        }
        if (message.senderId !== userId) {
            throw new custom_exceptions_1.ForbiddenException('You can only delete your own messages');
        }
        return this.prisma.messages.update({
            where: { id: messageId },
            data: { isDeleted: true },
        });
    }
    async blockConversation(conversationId, userId) {
        this.logger.log(`Blocking conversation ${conversationId}`);
        const conversation = await this.prisma.conversations.findUnique({
            where: { id: conversationId },
        });
        if (!conversation) {
            throw new custom_exceptions_1.NotFoundException('Conversation');
        }
        if (userId !== conversation.buyerId &&
            userId !== conversation.sellerId) {
            throw new custom_exceptions_1.ForbiddenException('You are not part of this conversation');
        }
        return this.prisma.conversations.update({
            where: { id: conversationId },
            data: { isBlocked: true },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messages_gateway_1.MessagesGateway,
        notifications_service_1.NotificationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map