import { RewardsService } from './rewards.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class RewardsController {
    private rewardsService;
    constructor(rewardsService: RewardsService);
    getCoinBalance(userId: string): Promise<ApiResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: number;
        currency: string;
        userId: string;
    }>>;
    getTransactions(userId: string, limit?: string): Promise<ApiResponseDto<{
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string;
        type: string;
        amount: number;
        coinId: string;
        balanceAfter: number;
        relatedId: string | null;
    }[]>>;
    getCatalog(): Promise<ApiResponseDto<{
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
    }[]>>;
    redeem(userId: string, catalogId: string): Promise<ApiResponseDto<{
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
    }>>;
}
