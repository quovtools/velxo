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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const client_1 = require("@prisma/client");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const library_1 = require("@prisma/client/runtime/library");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(PaymentsController_1.name);
    }
    async getConfig() {
        return api_response_dto_1.ApiResponseDto.ok(this.paymentsService.getProviderConfig(), 'Payment provider configuration');
    }
    async createPayment(userId, orderId, provider, amount, currency) {
        try {
            const callbackUrl = `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/orders/${orderId}`;
            const result = await this.paymentsService.initiatePayment(orderId, new library_1.Decimal(amount), provider, callbackUrl, userId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Payment initiated');
        }
        catch (error) {
            this.logger.error('Error initiating payment:', error);
            throw error;
        }
    }
    async handleFlutterwaveWebhook(event) {
        try {
            await this.paymentsService.handleFlutterwaveWebhook(event);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Webhook processed');
        }
        catch (error) {
            this.logger.error('Error processing Flutterwave webhook:', error);
            throw error;
        }
    }
    async handlePaymentIoWebhook(req, event, signature) {
        try {
            const rawBody = typeof req.rawBody === 'string'
                ? req.rawBody
                : typeof req.body === 'string'
                    ? req.body
                    : JSON.stringify(event);
            if (signature && !this.paymentsService.verifyPaymentIoIpn(rawBody, signature)) {
                this.logger.warn('Payment.io IPN signature verification failed — falling back to Verify API');
            }
            await this.paymentsService.handlePaymentIoWebhook(event);
            return api_response_dto_1.ApiResponseDto.ok(null, 'Webhook processed');
        }
        catch (error) {
            this.logger.error('Error processing Payment.io webhook:', error);
            throw error;
        }
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)('orderId')),
    __param(2, (0, common_1.Body)('provider')),
    __param(3, (0, common_1.Body)('amount')),
    __param(4, (0, common_1.Body)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Post)('webhook/flutterwave'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleFlutterwaveWebhook", null);
__decorate([
    (0, common_1.Post)('webhook/paymentio'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-hmac-sha256-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handlePaymentIoWebhook", null);
exports.PaymentsController = PaymentsController = PaymentsController_1 = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map