import { PrismaService } from '@/common/services/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class WalletService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getOrCreateWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: Decimal;
        currency: string;
        lockedBalance: Decimal;
        totalEarnings: Decimal;
        totalWithdrawn: Decimal;
        userId: string;
    }>;
    getWalletBalance(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: Decimal;
        currency: string;
        lockedBalance: Decimal;
        totalEarnings: Decimal;
        totalWithdrawn: Decimal;
        userId: string;
    }>;
    creditBalance(userId: string, amount: Decimal, description: string, relatedId?: string): Promise<Decimal>;
    debitBalance(userId: string, amount: Decimal, description: string, relatedId?: string): Promise<Decimal>;
    getTransactionHistory(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string;
        type: string;
        amount: Decimal;
        balanceAfter: Decimal;
        relatedId: string | null;
        walletId: string;
    }[]>;
    withdraw(userId: string, amount: Decimal, method: string, destination: string): Promise<{
        balance: Decimal;
        totalWithdrawn: Decimal;
    }>;
}
