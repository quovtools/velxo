export interface FlutterwaveChargeParams {
    reference: string;
    amount: number;
    currency: string;
    email: string;
    callbackUrl: string;
    redirectUrl?: string;
}
export interface FlutterwaveChargeResult {
    chargeId: string | null;
    paymentUrl: string | null;
    configured: boolean;
}
export declare class FlutterwaveService {
    private readonly logger;
    private readonly apiUrl;
    private readonly secretKey;
    get isConfigured(): boolean;
    createCharge(params: FlutterwaveChargeParams): Promise<FlutterwaveChargeResult>;
}
