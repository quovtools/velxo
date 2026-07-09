import { PrismaService } from '@/common/services/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
export declare class EscrowService {
    private prisma;
    private notifications;
    private payments;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService, payments: PaymentsService);
    getEscrowStatus(orderId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>;
    getEscrowForOrder(orderId: string, userId?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        amount: Decimal;
        currency: string;
        paymentLink: string;
        paymentMethod: "PAYMENT_IO" | "FLUTTERWAVE";
        order: {
            id: string;
            orderNumber: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            totalAmount: Decimal;
            currency: string;
            buyerId: string;
            sellerId: string;
            buyer: {
                email: string;
                firstName: string;
                lastName: string;
                id: string;
            };
            seller: {
                user: {
                    email: string;
                    id: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                storeSlug: string | null;
                storeName: string;
                storeDescription: string | null;
                accountType: import(".prisma/client").$Enums.SellerAccountType;
                isVerified: boolean;
                verificationDocuments: import("@prisma/client/runtime/library").JsonValue | null;
                kycStatus: string;
                kycIdType: string | null;
                kycFullName: string | null;
                kycDocumentNumber: string | null;
                kycIdImageUrl: string | null;
                kycSelfieImageUrl: string | null;
                kycSubmittedAt: Date | null;
                kycReviewedAt: Date | null;
                kycRejectionReason: string | null;
                reputationScore: number;
                totalSales: number;
                totalRevenue: Decimal;
                averageRating: number;
                responseRate: number;
                responseTime: number | null;
                subscriptionTier: string;
                subscriptionEndsAt: Date | null;
                featuredUntil: Date | null;
                isSuspended: boolean;
                suspensionReason: string | null;
                verifiedAt: Date | null;
            };
            items: ({
                listing: {
                    id: string;
                    title: string;
                    price: Decimal;
                };
            } & {
                id: string;
                createdAt: Date;
                orderId: string;
                listingId: string | null;
                quantity: number;
                unitPrice: Decimal;
                totalPrice: Decimal;
            })[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    generatePaymentLink(orderId: string, userId?: string): Promise<{
        url: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        configured: boolean;
    }>;
    holdFunds(orderId: string, amount: Decimal, currency: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>;
    releaseFunds(orderId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>;
    refundFunds(orderId: string, reason: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>;
    getEscrowHistory(limit?: number): Promise<({
        order: {
            buyer: {
                email: string;
                id: string;
            };
            seller: {
                id: string;
            };
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
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    })[]>;
    getSellerEscrowBalance(sellerId: string): Promise<{
        totalHeld: Decimal;
        escrowCount: number;
    }>;
}
