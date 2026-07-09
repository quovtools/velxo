import { PrismaService } from '@/common/services/prisma.service';
import { MessagesGateway } from '@/modules/gateways/messages.gateway';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
export declare class MessagesService {
    private prisma;
    private gateway;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: MessagesGateway, notifications: NotificationsService);
    getOrCreateConversation(buyerId: string, sellerId: string, orderId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        buyerId: string;
        sellerId: string;
        isBlocked: boolean;
        lastMessageAt: Date;
    }>;
    resolveParticipants(userId: string, dto: CreateConversationDto): Promise<{
        buyerId: string;
        sellerId: string;
        orderId?: string;
    }>;
    getConversations(userId: string, limit?: number): Promise<{
        buyer: {
            firstName: string;
            lastName: string;
            id: string;
            avatarUrl: string;
        };
        sellerStoreName: string;
        unreadCount: number;
        lastMessage: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            isRead: boolean;
            readAt: Date | null;
            conversationId: string;
            senderId: string;
            senderType: import(".prisma/client").$Enums.MessageSenderType;
            content: string;
            attachments: string[];
            isDeleted: boolean;
        };
        messages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            isRead: boolean;
            readAt: Date | null;
            conversationId: string;
            senderId: string;
            senderType: import(".prisma/client").$Enums.MessageSenderType;
            content: string;
            attachments: string[];
            isDeleted: boolean;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        buyerId: string;
        sellerId: string;
        isBlocked: boolean;
        lastMessageAt: Date;
    }[]>;
    getConversationMessages(conversationId: string, userId?: string, limit?: number): Promise<({
        sender: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            preferences: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            emailVerified: boolean;
            phone: string | null;
            phoneVerified: boolean;
            passwordHash: string | null;
            avatarUrl: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            isBanned: boolean;
            banReason: string | null;
            lastLoginAt: Date | null;
            deletedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        readAt: Date | null;
        conversationId: string;
        senderId: string;
        senderType: import(".prisma/client").$Enums.MessageSenderType;
        content: string;
        attachments: string[];
        isDeleted: boolean;
    })[]>;
    sendMessage(conversationId: string, senderId: string, content: string, attachments?: string[]): Promise<{
        sender: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            preferences: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            emailVerified: boolean;
            phone: string | null;
            phoneVerified: boolean;
            passwordHash: string | null;
            avatarUrl: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            isBanned: boolean;
            banReason: string | null;
            lastLoginAt: Date | null;
            deletedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        readAt: Date | null;
        conversationId: string;
        senderId: string;
        senderType: import(".prisma/client").$Enums.MessageSenderType;
        content: string;
        attachments: string[];
        isDeleted: boolean;
    }>;
    markMessagesAsRead(conversationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    deleteMessage(messageId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        readAt: Date | null;
        conversationId: string;
        senderId: string;
        senderType: import(".prisma/client").$Enums.MessageSenderType;
        content: string;
        attachments: string[];
        isDeleted: boolean;
    }>;
    blockConversation(conversationId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        buyerId: string;
        sellerId: string;
        isBlocked: boolean;
        lastMessageAt: Date;
    }>;
}
