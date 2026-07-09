export declare class EmailService {
    private readonly resend;
    private readonly fromEmail;
    private readonly logger;
    constructor();
    isConfigured(): boolean;
    sendEmail(to: string, subject: string, html: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    sendVerificationEmail(email: string, verificationToken: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendPasswordResetEmail(email: string, resetToken: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendOrderConfirmationEmail(email: string, orderNumber: string, sellerName: string, totalAmount: number, items: Array<{
        title: string;
        quantity: number;
        price: number;
    }>): Promise<{
        success: boolean;
    }>;
    sendWalletTransactionEmail(email: string, transactionType: string, amount: number, balanceAfter: number, description: string): Promise<{
        success: boolean;
    }>;
    sendNotificationEmail(email: string, title: string, body: string): Promise<{
        success: boolean;
    }>;
}
