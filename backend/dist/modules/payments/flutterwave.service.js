"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FlutterwaveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveService = void 0;
const common_1 = require("@nestjs/common");
let FlutterwaveService = FlutterwaveService_1 = class FlutterwaveService {
    constructor() {
        this.logger = new common_1.Logger(FlutterwaveService_1.name);
        this.apiUrl = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';
        this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    }
    get isConfigured() {
        return Boolean(this.apiUrl && this.secretKey);
    }
    async createCharge(params) {
        if (!this.isConfigured) {
            this.logger.warn('Flutterwave is not configured — returning stub charge (no live redirect).');
            return { chargeId: null, paymentUrl: null, configured: false };
        }
        const body = {
            tx_ref: params.reference,
            amount: params.amount,
            currency: params.currency || 'USD',
            redirect_url: params.callbackUrl,
            customer: { email: params.email },
            payment_options: 'card,account,ussd,qr,banktransfer,mobilemoney',
            customizations: {
                title: 'Velxo Market',
                description: `Order ${params.reference}`,
            },
        };
        try {
            const res = await fetch(`${this.apiUrl}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.secretKey}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Flutterwave charge failed: ${res.status} ${text}`);
            }
            const data = await res.json();
            return {
                chargeId: data?.data?.id || data?.id || params.reference,
                paymentUrl: data?.data?.link || null,
                configured: true,
            };
        }
        catch (err) {
            this.logger.error('Flutterwave createCharge error:', err?.message || err);
            throw err;
        }
    }
};
exports.FlutterwaveService = FlutterwaveService;
exports.FlutterwaveService = FlutterwaveService = FlutterwaveService_1 = __decorate([
    (0, common_1.Injectable)()
], FlutterwaveService);
//# sourceMappingURL=flutterwave.service.js.map