import { PrismaService } from '@/common/services/prisma.service';
export declare class AffiliateService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getMyReferral(userId: string): Promise<{
        referralCode: string;
        id: string;
        referrerId: string;
        referredUserId: string | null;
        status: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        totalPaid: import("@prisma/client/runtime/library").Decimal;
        clickCount: number;
        signupCount: number;
        tradeCount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    trackClick(code: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    registerReferral(code: string, newUserId: string): Promise<{
        referralCode: string;
        id: string;
        referrerId: string;
        referredUserId: string | null;
        status: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        totalPaid: import("@prisma/client/runtime/library").Decimal;
        clickCount: number;
        signupCount: number;
        tradeCount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    creditCommission(referredUserId: string, tradeAmount: number): Promise<{
        referralCode: string;
        id: string;
        referrerId: string;
        referredUserId: string | null;
        status: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        totalPaid: import("@prisma/client/runtime/library").Decimal;
        clickCount: number;
        signupCount: number;
        tradeCount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAllReferrals(limit?: number): Promise<({
        referrer: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        referredUser: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        referralCode: string;
        id: string;
        referrerId: string;
        referredUserId: string | null;
        status: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        totalPaid: import("@prisma/client/runtime/library").Decimal;
        clickCount: number;
        signupCount: number;
        tradeCount: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getStats(userId: string): Promise<{
        totalClicks: number;
        totalSignups: number;
        totalTrades: number;
        totalEarned: number;
        referrals: {
            referralCode: string;
            id: string;
            referrerId: string;
            referredUserId: string | null;
            status: string;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
            totalEarned: import("@prisma/client/runtime/library").Decimal;
            totalPaid: import("@prisma/client/runtime/library").Decimal;
            clickCount: number;
            signupCount: number;
            tradeCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
}
