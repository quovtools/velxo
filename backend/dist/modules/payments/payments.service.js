"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const client_1 = require("@prisma/client");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const library_1 = require("@prisma/client/runtime/library");
const paymentio_service_1 = require("./paymentio.service");
const flutterwave_service_1 = require("./flutterwave.service");
const notifications_service_1 = require("../notifications/notifications.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, paymentIo, flutterwave, notifications) {
        this.prisma = prisma;
        this.paymentIo = paymentIo;
        this.flutterwave = flutterwave;
        this.notifications = notifications;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    onModuleInit() {
        this.logger.log(`Payment provider config: ${JSON.stringify(this.getProviderConfig())}`);
    }
    getProviderConfig() {
        return {
            paymentIo: {
                configured: this.paymentIo.isConfigured,
                hasApiUrl: Boolean(process.env.PAYMENT_IO_API_URL),
                hasApiKey: Boolean(process.env.PAYMENT_IO_API_KEY),
                hasSecretKey: Boolean(process.env.PAYMENT_IO_SECRET_KEY),
                apiUrl: process.env.PAYMENT_IO_API_URL || null,
            },
            flutterwave: {
                configured: this.flutterwave.isConfigured,
                hasApiUrl: Boolean(process.env.FLUTTERWAVE_API_URL),
                hasSecretKey: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
            },
        };
    }
    async createPayment(orderId, amount, provider, methodId) {
        this.logger.log(`Creating payment for order ${orderId} via ${provider}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        const payment = await this.prisma.payments.create({
            data: {
                orderId,
                amount,
                provider,
                methodId,
                status: client_1.PaymentStatus.PENDING,
                currency: order.currency,
            },
        });
        return payment;
    }
    async initiatePayment(orderId, amount, provider, callbackUrl, buyerId) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { orderItems: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.buyerId !== buyerId) {
            throw new custom_exceptions_1.ForbiddenException('You can only pay for your own orders');
        }
        if (order.status !== client_1.OrderStatus.PENDING && order.status !== client_1.OrderStatus.PAID) {
            throw new custom_exceptions_1.BadRequestException('This order cannot be paid');
        }
        if (new library_1.Decimal(amount).toString() !== new library_1.Decimal(order.totalAmount.toString()).toString()) {
            throw new custom_exceptions_1.BadRequestException('Payment amount does not match the order total');
        }
        const listingId = order.orderItems?.[0]?.listingId;
        const revertReservation = async () => {
            if (listingId) {
                await this.prisma.listings.update({
                    where: { id: listingId },
                    data: { isSold: false, status: client_1.ListingStatus.ACTIVE },
                });
            }
        };
        const handleCharge = async (charge) => {
            if (!charge.configured) {
                await revertReservation();
                throw new custom_exceptions_1.BadRequestException(`The selected payment method (${provider}) is currently unavailable. Please choose a different payment method.`);
            }
            const payment = await this.createPayment(orderId, amount, provider);
            if (charge.chargeId) {
                await this.prisma.payments.update({
                    where: { id: payment.id },
                    data: { providerTransactionId: charge.chargeId },
                });
            }
            return { payment, paymentUrl: charge.paymentUrl, configured: true };
        };
        if (provider === 'PAYMENT_IO') {
            const charge = await this.paymentIo.createCharge({
                reference: orderId,
                amount: Number(amount),
                currency: order.currency,
                callbackUrl,
            });
            return handleCharge(charge);
        }
        if (provider === 'FLUTTERWAVE') {
            const fullOrder = await this.prisma.orders.findUnique({
                where: { id: orderId },
                include: { buyer: true },
            });
            const charge = await this.flutterwave.createCharge({
                reference: orderId,
                amount: Number(amount),
                currency: order.currency,
                email: fullOrder?.buyer?.email || 'buyer@velxo.shop',
                callbackUrl,
            });
            return handleCharge(charge);
        }
        await revertReservation();
        throw new custom_exceptions_1.BadRequestException('Unsupported payment provider');
    }
    resolveProvider() {
        const override = process.env.PAYMENT_PROVIDER?.toUpperCase();
        if (override === 'FLUTTERWAVE' || override === 'PAYMENT_IO' || override === 'CRYPTO') {
            return override;
        }
        if (this.flutterwave.isConfigured)
            return client_1.PaymentProvider.FLUTTERWAVE;
        if (this.paymentIo.isConfigured)
            return client_1.PaymentProvider.PAYMENT_IO;
        return client_1.PaymentProvider.FLUTTERWAVE;
    }
    async createPaymentLink(orderId, provider) {
        this.logger.log(`Generating payment link for order ${orderId}${provider ? ` (provider: ${provider})` : ''}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { buyer: true, orderItems: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.status === client_1.OrderStatus.PAID ||
            order.status === client_1.OrderStatus.COMPLETED ||
            order.status === client_1.OrderStatus.REFUNDED) {
            this.logger.log(`Order ${orderId} already paid — no payment link generated`);
            return { url: null, provider: null, configured: true };
        }
        const activeProvider = provider ?? this.resolveProvider();
        const callbackUrl = `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/orders/${orderId}`;
        let charge = {
            chargeId: null,
            paymentUrl: null,
            configured: false,
        };
        try {
            if (activeProvider === client_1.PaymentProvider.PAYMENT_IO) {
                charge = await this.paymentIo.createCharge({
                    reference: orderId,
                    amount: Number(order.totalAmount),
                    currency: order.currency,
                    callbackUrl,
                });
            }
            else if (activeProvider === client_1.PaymentProvider.FLUTTERWAVE) {
                charge = await this.flutterwave.createCharge({
                    reference: orderId,
                    amount: Number(order.totalAmount),
                    currency: order.currency,
                    email: order.buyer?.email || 'buyer@velxo.shop',
                    callbackUrl,
                });
            }
        }
        catch (err) {
            this.logger.error(`Payment link generation failed for order ${orderId}:`, err?.message || err);
            return { url: null, provider: activeProvider, configured: false };
        }
        if (!charge.configured || !charge.paymentUrl) {
            this.logger.warn(`Payment provider (${activeProvider}) not configured for order ${orderId}`);
            return { url: null, provider: activeProvider, configured: false };
        }
        const paymentUrl = charge.paymentUrl;
        const existing = await this.prisma.payments.findFirst({
            where: { orderId, provider: activeProvider, status: client_1.PaymentStatus.PENDING },
            orderBy: { createdAt: 'desc' },
        });
        if (existing) {
            await this.prisma.payments.update({
                where: { id: existing.id },
                data: {
                    providerTransactionId: charge.chargeId ?? existing.providerTransactionId,
                    metadata: { ...(existing.metadata || {}), paymentLink: paymentUrl },
                },
            });
        }
        else {
            await this.prisma.payments.create({
                data: {
                    orderId,
                    provider: activeProvider,
                    amount: order.totalAmount,
                    currency: order.currency,
                    status: client_1.PaymentStatus.PENDING,
                    providerTransactionId: charge.chargeId ?? undefined,
                    metadata: { paymentLink: paymentUrl },
                },
            });
        }
        const currentMeta = order.metadata || {};
        if (currentMeta.paymentLink !== paymentUrl) {
            await this.prisma.orders.update({
                where: { id: orderId },
                data: { metadata: { ...currentMeta, paymentLink: paymentUrl } },
            });
        }
        return { url: paymentUrl, provider: activeProvider, configured: true };
    }
    async updatePaymentStatus(paymentId, status, transactionId) {
        this.logger.log(`Updating payment ${paymentId} to ${status}`);
        const payment = await this.prisma.payments.update({
            where: { id: paymentId },
            data: {
                status,
                providerTransactionId: transactionId,
                paidAt: status === client_1.PaymentStatus.COMPLETED ? new Date() : undefined,
                refundedAt: status === client_1.PaymentStatus.REFUNDED ? new Date() : undefined,
            },
            include: { order: { include: { orderItems: true } } },
        });
        if (status === client_1.PaymentStatus.COMPLETED && payment.order.status === 'PENDING') {
            const listingId = payment.order.orderItems?.[0]?.listingId;
            await this.prisma.orders.update({
                where: { id: payment.orderId },
                data: { status: 'PAID', paidAt: new Date() },
            });
            if (listingId) {
                await this.prisma.listings.update({
                    where: { id: listingId },
                    data: { isSold: true, status: client_1.ListingStatus.SOLD },
                });
            }
            const fullOrder = await this.prisma.orders.findUnique({
                where: { id: payment.orderId },
                include: {
                    seller: true,
                    buyer: true,
                    orderItems: { include: { listing: true } },
                },
            });
            if (fullOrder) {
                await this.notifications.notifyPaymentConfirmed(fullOrder).catch(() => { });
            }
        }
        if (status === client_1.PaymentStatus.FAILED) {
            const listingId = payment.order.orderItems?.[0]?.listingId;
            if (listingId) {
                await this.prisma.listings.update({
                    where: { id: listingId },
                    data: { isSold: false, status: client_1.ListingStatus.ACTIVE },
                });
            }
        }
        return payment;
    }
    verifyPaymentIoIpn(rawBody, signature) {
        return this.paymentIo.verifyIpn(rawBody, signature);
    }
    async handleFlutterwaveWebhook(event) {
        this.logger.log(`Processing Flutterwave webhook`);
        return true;
    }
    async handlePaymentIoWebhook(event) {
        this.logger.log(`Processing Payment.io webhook`);
        const reference = event?.body ||
            event?.token ||
            event?.reference ||
            event?.chargeId ||
            event?.data?.body ||
            event?.data?.token ||
            event?.data?.reference;
        if (!reference) {
            this.logger.warn('Payment.io webhook missing reference');
            return false;
        }
        const payment = await this.prisma.payments.findFirst({ where: { providerTransactionId: reference } });
        if (!payment) {
            const handled = await this.handleSubscriptionWebhook(reference);
            return handled;
        }
        const verified = await this.paymentIo.verifyPayment(reference).catch(() => false);
        if (!verified) {
            this.logger.warn(`Payment.io webhook: token ${reference} not verified by Verify API — leaving order pending`);
            return false;
        }
        await this.updatePaymentStatus(payment.id, client_1.PaymentStatus.COMPLETED, reference);
        return true;
    }
    async handleSubscriptionWebhook(reference) {
        const sub = await this.prisma.sellerSubscriptions.findFirst({
            where: { OR: [{ id: reference }, { providerRef: reference }], status: 'PENDING' },
            include: { seller: true },
        });
        if (!sub) {
            this.logger.warn(`Payment.io webhook: no pending subscription for reference ${reference}`);
            return false;
        }
        const verified = await this.paymentIo.verifyPayment(reference).catch(() => false);
        if (!verified) {
            this.logger.warn(`Payment.io webhook: subscription ${sub.id} token not verified — leaving pending`);
            return false;
        }
        const durationMonths = sub.plan === 'PREMIUM' ? 1 : 1;
        const now = new Date();
        const endsAt = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
        await this.prisma.sellerSubscriptions.update({
            where: { id: sub.id },
            data: { status: 'ACTIVE', startsAt: now, endsAt },
        });
        await this.prisma.sellers.update({
            where: { id: sub.sellerId },
            data: {
                subscriptionTier: sub.plan,
                subscriptionEndsAt: endsAt,
                storeSlug: sub.seller.storeSlug || this.makeStoreSlug(sub.seller.storeName, sub.seller.id),
            },
        });
        await this.prisma.adminAuditLogs.create({
            data: {
                actorId: sub.seller.userId,
                action: 'UPDATE',
                entityType: 'seller_subscription',
                entityId: sub.id,
                newValue: { plan: sub.plan, status: 'ACTIVE', endsAt },
            },
        });
        await this.notifications
            .notifySubscriptionActivated(sub.seller.userId, sub.plan === 'PREMIUM' ? 'Seller Pro Premium' : 'Seller Pro', endsAt)
            .catch(() => { });
        this.logger.log(`Seller Pro subscription ${sub.id} activated for seller ${sub.sellerId}`);
        return true;
    }
    makeStoreSlug(storeName, sellerId) {
        const base = (storeName || 'store')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40);
        return `${base || 'store'}-${sellerId.slice(-4)}`;
    }
    async processRefund(paymentId, reason) {
        this.logger.log(`Processing refund for payment ${paymentId}`);
        const payment = await this.prisma.payments.findUnique({
            where: { id: paymentId },
            include: { order: true },
        });
        if (!payment) {
            throw new custom_exceptions_1.NotFoundException('Payment');
        }
        if (payment.status !== client_1.PaymentStatus.COMPLETED) {
            throw new Error('Can only refund completed payments');
        }
        return this.updatePaymentStatus(paymentId, client_1.PaymentStatus.REFUNDED);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        paymentio_service_1.PaymentIoService,
        flutterwave_service_1.FlutterwaveService,
        notifications_service_1.NotificationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map