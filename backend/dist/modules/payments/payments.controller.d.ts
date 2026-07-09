import { PaymentsService } from './payments.service';
import { PaymentProvider } from '@prisma/client';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class PaymentsController {
    private paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    getConfig(): Promise<ApiResponseDto<{
        paymentIo: {
            configured: boolean;
            hasApiUrl: boolean;
            hasApiKey: boolean;
            hasSecretKey: boolean;
            apiUrl: string;
        };
        flutterwave: {
            configured: boolean;
            hasApiUrl: boolean;
            hasSecretKey: boolean;
        };
    }>>;
    createPayment(userId: string, orderId: string, provider: PaymentProvider, amount: number, currency?: string): Promise<ApiResponseDto<{
        payment: any;
        paymentUrl: string | null;
        configured: boolean;
    }>>;
    handleFlutterwaveWebhook(event: any): Promise<ApiResponseDto<any>>;
    handlePaymentIoWebhook(req: any, event: any, signature: string): Promise<ApiResponseDto<any>>;
}
