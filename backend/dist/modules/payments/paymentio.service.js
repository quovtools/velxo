"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var PaymentIoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentIoService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let PaymentIoService = PaymentIoService_1 = class PaymentIoService {
    constructor() {
        this.logger = new common_1.Logger(PaymentIoService_1.name);
        this.apiUrl = process.env.PAYMENT_IO_API_URL || '';
        this.apiKey = process.env.PAYMENT_IO_API_KEY || '';
        this.secretKey = process.env.PAYMENT_IO_SECRET_KEY || '';
        this.gatewayUrl = process.env.PAYMENT_IO_GATEWAY_URL || 'https://app.paymento.io/gateway';
    }
    get isConfigured() {
        return Boolean(this.apiUrl && this.apiKey && this.secretKey);
    }
    async createCharge(params) {
        if (!this.isConfigured) {
            this.logger.warn('Paymento is not configured — returning stub charge (no live redirect).');
            return { chargeId: null, paymentUrl: null, configured: false };
        }
        const body = {
            fiatAmount: String(params.amount),
            fiatCurrency: params.currency,
            ReturnUrl: params.callbackUrl,
            orderId: params.reference,
            Speed: 0,
        };
        try {
            const res = await fetch(`${this.apiUrl}/payment/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/plain',
                    'Api-key': this.apiKey,
                },
                body: JSON.stringify(body),
            });
            const text = await res.text();
            if (!res.ok) {
                throw new Error(`Paymento charge failed: ${res.status} ${text}`);
            }
            let token = text.trim();
            try {
                const json = JSON.parse(text);
                token = String(json?.body ??
                    json?.token ??
                    json?.data?.body ??
                    json?.data?.token ??
                    token);
            }
            catch {
            }
            if (!token) {
                throw new Error(`Paymento charge returned no token: ${text}`);
            }
            return {
                chargeId: token,
                paymentUrl: `${this.gatewayUrl}?token=${token}`,
                configured: true,
            };
        }
        catch (err) {
            this.logger.error('Paymento createCharge error:', err?.message || err);
            throw err;
        }
    }
    async verifyPayment(token) {
        if (!this.isConfigured)
            return false;
        try {
            const res = await fetch(`${this.apiUrl}/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-key': this.apiKey,
                },
                body: JSON.stringify({ token }),
            });
            if (!res.ok)
                return false;
            const data = await res.json().catch(() => null);
            if (!data)
                return false;
            return (data.success === true ||
                data.status === 'completed' ||
                data.status === 'confirmed' ||
                data.status === 'paid' ||
                data.paid === true);
        }
        catch (err) {
            this.logger.error('Paymento verifyPayment error:', err?.message || err);
            return false;
        }
    }
    verifyIpn(rawBody, signature) {
        if (!this.secretKey || !signature)
            return false;
        const expected = crypto.createHmac('sha256', this.secretKey).update(rawBody).digest('hex');
        const expectedBuf = Buffer.from(expected);
        const providedBuf = Buffer.from(signature);
        if (expectedBuf.length !== providedBuf.length)
            return false;
        return crypto.timingSafeEqual(expectedBuf, providedBuf);
    }
};
exports.PaymentIoService = PaymentIoService;
exports.PaymentIoService = PaymentIoService = PaymentIoService_1 = __decorate([
    (0, common_1.Injectable)()
], PaymentIoService);
//# sourceMappingURL=paymentio.service.js.map