import { PrismaService } from '@/common/services/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from '@/modules/gateways/notifications.gateway';
export declare class NotificationsService {
    private prisma;
    private gateway;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: NotificationsGateway);
    createNotification(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, any>): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifySubscriptionActivated(userId: string, planName: string, endsAt: Date): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifyNewMessage(recipientId: string, senderName: string, preview: string, conversationId: string, orderId?: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifyNewOrder(order: any): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifyOrderAccepted(order: any): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifyPaymentConfirmed(order: any): Promise<void>;
    notifyDelivered(order: any): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifyCompleted(order: any): Promise<void>;
    notifyRefunded(order: any, amount?: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    getNotifications(userId: string, limit?: number): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    getUnreadNotifications(userId: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    markAsRead(notificationId: string, userId?: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    deleteNotification(notificationId: string, userId?: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    notifyOrderStatus(orderId: string, status: string): Promise<void>;
    notifyDispute(disputeId: string, userId: string): Promise<void>;
    notifyListingApproved(listingId: string, sellerId: string): Promise<void>;
    notifyListingRejected(listingId: string, sellerId: string, reason: string): Promise<void>;
    notifyKycApproved(sellerId: string, storeName: string): Promise<void>;
    notifyKycRejected(sellerId: string, storeName: string, reason: string): Promise<void>;
}
