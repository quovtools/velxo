import { UsersService } from './users.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class UsersController {
    private usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<ApiResponseDto<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        phone: string;
        avatarUrl: string;
        isActive: boolean;
    }>>;
    updateProfile(userId: string, firstName?: string, lastName?: string, phone?: string, notificationPreferences?: any, preferences?: any): Promise<ApiResponseDto<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        phone: string;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue;
    }>>;
    uploadAvatar(userId: string, avatarUrl: string): Promise<ApiResponseDto<{
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
    }>>;
    getStats(userId: string): Promise<ApiResponseDto<{
        role: import(".prisma/client").$Enums.Role;
        buyerStats: {
            totalOrders: number;
            totalReviews: number;
        };
        wallet: {
            balance: number | import("@prisma/client/runtime/library").Decimal;
            totalEarnings: number | import("@prisma/client/runtime/library").Decimal;
        };
        sellerStats: any;
        memberSince: Date;
    }>>;
    searchUsers(query: string, limit?: number): Promise<ApiResponseDto<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        avatarUrl: string;
    }[]>>;
    getUserById(userId: string): Promise<ApiResponseDto<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        phone: string;
        avatarUrl: string;
        isActive: boolean;
    }>>;
    deactivateAccount(userId: string): Promise<ApiResponseDto<any>>;
    reactivateAccount(userId: string): Promise<ApiResponseDto<{
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
    }>>;
}
