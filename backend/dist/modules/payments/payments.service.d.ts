import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentIoService } from './paymentio.service';
import { FlutterwaveService } from './flutterwave.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentsService implements OnModuleInit {
    private prisma;
    private paymentIo;
    private flutterwave;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, paymentIo: PaymentIoService, flutterwave: FlutterwaveService, notifications: NotificationsService);
    onModuleInit(): void;
    getProviderConfig(): {
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
    };
    createPayment(orderId: string, amount: Decimal, provider: PaymentProvider, methodId?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        paidAt: Date | null;
        refundedAt: Date | null;
        amount: Decimal;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerTransactionId: string | null;
        errorMessage: string | null;
        methodId: string | null;
    }>;
    initiatePayment(orderId: string, amount: Decimal, provider: PaymentProvider, callbackUrl: string, buyerId: string): Promise<{
        payment: any;
        paymentUrl: string | null;
        configured: boolean;
    }>;
    private resolveProvider;
    createPaymentLink(orderId: string, provider?: PaymentProvider): Promise<{
        url: string | null;
        provider: PaymentProvider | null;
        configured: boolean;
    }>;
    updatePaymentStatus(paymentId: string, status: PaymentStatus, transactionId?: string): Promise<{
        order: {
            orderItems: {
                id: string;
                createdAt: Date;
                orderId: string;
                listingId: string | null;
                quantity: number;
                unitPrice: Decimal;
                totalPrice: Decimal;
            }[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            commissionRate: Decimal;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            orderNumber: string;
            buyerId: string;
            sellerId: string | null;
            subtotal: Decimal;
            taxAmount: Decimal;
            discountAmount: Decimal;
            totalAmount: Decimal;
            commissionAmount: Decimal;
            sellerPayout: Decimal;
            buyerNote: string | null;
            sellerNote: string | null;
            deliveryData: import("@prisma/client/runtime/library").JsonValue | null;
            paidAt: Date | null;
            deliveredAt: Date | null;
            acceptedAt: Date | null;
            sellerDeliverDeadline: Date | null;
            buyerConfirmDeadline: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            refundedAt: Date | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        paidAt: Date | null;
        refundedAt: Date | null;
        amount: Decimal;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerTransactionId: string | null;
        errorMessage: string | null;
        methodId: string | null;
    }>;
    verifyPaymentIoIpn(rawBody: string, signature?: string): boolean;
    handleFlutterwaveWebhook(event: any): Promise<boolean>;
    handlePaymentIoWebhook(event: any): Promise<boolean>;
    private handleSubscriptionWebhook;
    private makeStoreSlug;
    processRefund(paymentId: string, reason: string): Promise<{
        order: {
            orderItems: {
                id: string;
                createdAt: Date;
                orderId: string;
                listingId: string | null;
                quantity: number;
                unitPrice: Decimal;
                totalPrice: Decimal;
            }[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            commissionRate: Decimal;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            orderNumber: string;
            buyerId: string;
            sellerId: string | null;
            subtotal: Decimal;
            taxAmount: Decimal;
            discountAmount: Decimal;
            totalAmount: Decimal;
            commissionAmount: Decimal;
            sellerPayout: Decimal;
            buyerNote: string | null;
            sellerNote: string | null;
            deliveryData: import("@prisma/client/runtime/library").JsonValue | null;
            paidAt: Date | null;
            deliveredAt: Date | null;
            acceptedAt: Date | null;
            sellerDeliverDeadline: Date | null;
            buyerConfirmDeadline: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            refundedAt: Date | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        paidAt: Date | null;
        refundedAt: Date | null;
        amount: Decimal;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerTransactionId: string | null;
        errorMessage: string | null;
        methodId: string | null;
    }>;
}
