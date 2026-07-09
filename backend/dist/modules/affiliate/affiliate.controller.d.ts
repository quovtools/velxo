import { AffiliateService } from './affiliate.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class AffiliateController {
    private affiliateService;
    constructor(affiliateService: AffiliateService);
    getMyReferral(userId: string): Promise<ApiResponseDto<{
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
    }>>;
    getMyStats(userId: string): Promise<ApiResponseDto<{
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
    }>>;
    trackClick(code: string): Promise<ApiResponseDto<any>>;
    getAllReferrals(limit?: number): Promise<ApiResponseDto<({
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
    })[]>>;
}
