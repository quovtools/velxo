import { NotificationsService } from './notifications.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class NotificationsController {
    private notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string): Promise<ApiResponseDto<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>>;
    getUnreadNotifications(userId: string): Promise<ApiResponseDto<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>>;
    markAsRead(notificationId: string, userId: string): Promise<ApiResponseDto<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>>;
    markAllAsRead(userId: string): Promise<ApiResponseDto<any>>;
    deleteNotification(notificationId: string, userId: string): Promise<ApiResponseDto<any>>;
}
