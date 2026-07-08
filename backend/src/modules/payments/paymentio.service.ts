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
  private readonly ipnUrl = process.env.PAYMENT_IO_IPN_URL || ''

  get isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiKey && this.secretKey)
  }

  /**
   * Create a crypto charge on Payment.io.
   *
   * NOTE: Field names / paths below follow a common REST crypto-gateway shape.
   * Adjust `endpoint`, headers and body to match Payment.io's real API once
   * you have their docs. The base URL, key and IPN URL all come from env.
   */
  async createCharge(params: PaymentIoChargeParams): Promise<PaymentIoChargeResult> {
    if (!this.isConfigured) {
      this.logger.warn('Payment.io is not configured — returning stub charge (no live redirect).')
      return { chargeId: null, paymentUrl: null, configured: false }
    }

    const body = {
      reference: params.reference,
      amount: params.amount,
      currency: params.currency,
      callback_url: params.callbackUrl,
      ipn_url: this.ipnUrl,
    }

    try {
      const res = await fetch(`${this.apiUrl}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Payment.io charge failed: ${res.status} ${text}`)
      }

      const data = await res.json()
      return {
        chargeId: data.id || data.chargeId || data.reference || null,
        paymentUrl: data.url || data.checkout_url || data.payment_url || null,
        configured: true,
      }
    } catch (err: any) {
      this.logger.error('Payment.io createCharge error:', err?.message || err)
      throw err
    }
  }

  /**
   * Verify an incoming Payment.io IPN using HMAC-SHA256 of the raw body
   * signed with the secret key. Payment.io should send the signature in a
   * header (e.g. `x-paymentio-signature`). Adjust the header name if theirs
   * differs.
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
