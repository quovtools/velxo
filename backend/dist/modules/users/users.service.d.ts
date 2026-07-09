import { PrismaService } from '@/common/services/prisma.service';
export declare class UsersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getUserProfile(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        phone: string;
        avatarUrl: string;
        isActive: boolean;
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        notificationPreferences?: any;
        preferences?: any;
    }): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        phone: string;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue;
    }>;
    uploadAvatar(userId: string, avatarUrl: string): Promise<{
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
    }>;
    getUserStats(userId: string): Promise<{
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
    }>;
    searchUsers(query: string, limit?: number): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        avatarUrl: string;
    }[]>;
    deactivateAccount(userId: string): Promise<{
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
    }>;
    reactivateAccount(userId: string): Promise<{
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
    }>;
    getAllUsers(limit?: number): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        isActive: boolean;
        isBanned: boolean;
    }[]>;
}
