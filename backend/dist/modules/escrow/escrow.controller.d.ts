import { Request } from 'express';
import { EscrowService } from './escrow.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
import { PrismaService } from '@/common/services/prisma.service';
export declare class EscrowController {
    private escrowService;
    private prisma;
    private readonly logger;
    constructor(escrowService: EscrowService, prisma: PrismaService);
    getEscrowForOrder(orderId: string, userId?: string): Promise<ApiResponseDto<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentLink: string;
        paymentMethod: "PAYMENT_IO" | "FLUTTERWAVE";
        order: {
            id: string;
            orderNumber: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
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
                totalRevenue: import("@prisma/client/runtime/library").Decimal;
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
                    price: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                createdAt: Date;
                orderId: string;
                listingId: string | null;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
            })[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>>;
    generatePaymentLink(orderId: string, userId: string): Promise<ApiResponseDto<{
        url: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        configured: boolean;
    }>>;
    getEscrowHistory(): Promise<ApiResponseDto<({
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
            commissionRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            orderNumber: string;
            buyerId: string;
            sellerId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            commissionAmount: import("@prisma/client/runtime/library").Decimal;
            sellerPayout: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    })[]>>;
    getEscrowStatus(orderId: string): Promise<ApiResponseDto<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>>;
    releaseFunds(orderId: string, userId: string): Promise<ApiResponseDto<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>>;
    refundFunds(orderId: string, reason: string, userId: string, req: Request): Promise<ApiResponseDto<{
        id: string;
        status: import(".prisma/client").$Enums.EscrowStatus;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        orderId: string;
        refundedAt: Date | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        releasedAt: Date | null;
        disputedAt: Date | null;
    }>>;
}
