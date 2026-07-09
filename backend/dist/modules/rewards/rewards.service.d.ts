import { PrismaService } from '@/common/services/prisma.service';
export declare class RewardsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCoinBalance(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: number;
        currency: string;
        userId: string;
    }>;
    getTransactions(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string;
        type: string;
        amount: number;
        coinId: string;
        balanceAfter: number;
        relatedId: string | null;
    }[]>;
    getCatalog(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        type: string;
        imageUrl: string | null;
        sortOrder: number;
        coinCost: number;
    }[]>;
    creditCoins(userId: string, amount: number, type: string, description: string, relatedId?: string): Promise<number>;
    debitCoins(userId: string, amount: number, description: string, relatedId?: string): Promise<number>;
    redeem(userId: string, catalogId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
        coinCost: number;
        processedBy: string | null;
        catalogId: string;
    }>;
}
