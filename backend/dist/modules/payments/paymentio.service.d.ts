export interface PaymentIoChargeParams {
    reference: string;
    amount: number;
    currency: string;
    callbackUrl: string;
}
export interface PaymentIoChargeResult {
    chargeId: string | null;
    paymentUrl: string | null;
    configured: boolean;
}
export declare class PaymentIoService {
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    private readonly secretKey;
    private readonly gatewayUrl;
    get isConfigured(): boolean;
    createCharge(params: PaymentIoChargeParams): Promise<PaymentIoChargeResult>;
    verifyPayment(token: string): Promise<boolean>;
    verifyIpn(rawBody: string, signature: string | undefined): boolean;
}
