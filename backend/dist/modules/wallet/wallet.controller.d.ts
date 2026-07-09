import { WalletService } from './wallet.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { Decimal } from '@prisma/client/runtime/library';
export declare class WalletController {
    private walletService;
    private readonly logger;
    constructor(walletService: WalletService);
    getWalletBalance(userId: string): Promise<ApiResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: Decimal;
        currency: string;
        lockedBalance: Decimal;
        totalEarnings: Decimal;
        totalWithdrawn: Decimal;
        userId: string;
    }>>;
    withdraw(userId: string, dto: WithdrawDto): Promise<ApiResponseDto<{
        balance: Decimal;
        totalWithdrawn: Decimal;
    }>>;
}
