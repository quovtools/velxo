import { MessagesService } from './messages.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
export declare class MessagesController {
    private messagesService;
    private readonly logger;
    constructor(messagesService: MessagesService);
    getConversations(userId: string, limit?: number): Promise<ApiResponseDto<{
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
    }[]>>;
    getUnreadCount(userId: string): Promise<ApiResponseDto<{
        unreadCount: number;
    }>>;
    createConversation(userId: string, dto: CreateConversationDto): Promise<ApiResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        buyerId: string;
        sellerId: string;
        isBlocked: boolean;
        lastMessageAt: Date;
    }>>;
    getConversationMessages(conversationId: string, userId: string, limit?: number): Promise<ApiResponseDto<({
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
    })[]>>;
    sendMessage(conversationId: string, senderId: string, content: string, attachments?: string[]): Promise<ApiResponseDto<{
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
    }>>;
    markAsRead(conversationId: string, userId: string): Promise<ApiResponseDto<any>>;
    deleteMessage(messageId: string, userId: string): Promise<ApiResponseDto<any>>;
    blockConversation(conversationId: string, userId: string): Promise<ApiResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        buyerId: string;
        sellerId: string;
        isBlocked: boolean;
        lastMessageAt: Date;
    }>>;
}
