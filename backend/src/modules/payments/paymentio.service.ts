import { Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'

export interface PaymentIoChargeParams {
  reference: string
  amount: number
  currency: string
  callbackUrl: string
}

export interface PaymentIoChargeResult {
  chargeId: string | null
  paymentUrl: string | null
  configured: boolean
}

@Injectable()
export class PaymentIoService {
  private readonly logger = new Logger(PaymentIoService.name)

  private readonly apiUrl = process.env.PAYMENT_IO_API_URL || ''
  private readonly apiKey = process.env.PAYMENT_IO_API_KEY || ''
  private readonly secretKey = process.env.PAYMENT_IO_SECRET_KEY || ''
  private readonly gatewayUrl = process.env.PAYMENT_IO_GATEWAY_URL || 'https://app.paymento.io/gateway'

  get isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiKey && this.secretKey)
  }

  /**
   * Create a crypto payment request on Paymento.
   * Docs: POST {apiUrl}/payment/request with the `Api-key` header.
   * Returns a token used to redirect the buyer to the hosted gateway.
   * See https://docs.paymento.io/api-documention/payment-request
   */
  async createCharge(params: PaymentIoChargeParams): Promise<PaymentIoChargeResult> {
    if (!this.isConfigured) {
      this.logger.warn('Paymento is not configured — returning stub charge (no live redirect).')
      return { chargeId: null, paymentUrl: null, configured: false }
    }

    const body = {
      fiatAmount: String(params.amount),
      fiatCurrency: params.currency,
      ReturnUrl: params.callbackUrl,
      orderId: params.reference,
      Speed: 0,
    }

    try {
      const res = await fetch(`${this.apiUrl}/payment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
          'Api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      })

      const text = await res.text()

      if (!res.ok) {
        throw new Error(`Paymento charge failed: ${res.status} ${text}`)
      }

      // Paymento returns the payment token. It may be plain text or JSON.
      let token = text.trim()
      try {
        const json = JSON.parse(text)
        if (json?.token) token = String(json.token)
      } catch {
        // plain-text token — keep as-is
      }

      if (!token) {
        throw new Error(`Paymento charge returned no token: ${text}`)
      }

      return {
        chargeId: token,
        paymentUrl: `${this.gatewayUrl}?token=${token}`,
        configured: true,
      }
    } catch (err: any) {
      this.logger.error('Paymento createCharge error:', err?.message || err)
      throw err
    }
  }

  /**
   * Verify an incoming Paymento IPN using HMAC-SHA256 of the raw body signed
   * with the secret key. Paymento sends the signature in the
   * `X-HMAC-SHA256-SIGNATURE` header.
   */
  verifyIpn(rawBody: string, signature: string | undefined): boolean {
    if (!this.secretKey || !signature) return false
    const expected = crypto.createHmac('sha256', this.secretKey).update(rawBody).digest('hex')
    const expectedBuf = Buffer.from(expected)
    const providedBuf = Buffer.from(signature)
    if (expectedBuf.length !== providedBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, providedBuf)
  }
}
