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
      // The token lives in `body` (e.g. {"body":"<token>","success":true,...}).
      let token = text.trim()
      try {
        const json = JSON.parse(text)
        token = String(
          json?.body ??
            json?.token ??
            json?.data?.body ??
            json?.data?.token ??
            token,
        )
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
   * Verify a payment token with Paymento's Verify API before trusting an IPN.
   * Paymento recommends always confirming server-side rather than relying on
   * the callback body alone. Docs: POST {apiUrl}/payment/verify { token }.
   */
  async verifyPayment(token: string): Promise<boolean> {
    if (!this.isConfigured) return false
    try {
      const res = await fetch(`${this.apiUrl}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-key': this.apiKey,
        },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) return false
      const data = await res.json().catch(() => null)
      if (!data) return false

      const status = String((data as any).status ?? '').toLowerCase()
      const isPaid =
        status === 'completed' ||
        status === 'confirmed' ||
        status === 'paid' ||
        status === 'successful'
      const isPending =
        status === 'pending' ||
        status === 'created' ||
        status === 'new' ||
        status === 'awaiting' ||
        status === 'unpaid' ||
        status === 'expired' ||
        status === ''

      // Never treat a created/pending charge (or a bare `success: true` from a
      // verify call that merely succeeded) as a captured payment. Paymento's
      // verify endpoint returns `success: true` for a charge that was only
      // *created* (including test/sandbox), so confirming on `success` alone
      // would mark the order PAID without any real crypto settlement.
      if (isPaid) {
        this.logger.log(`Paymento verify OK — token ${token} status=${status}`)
        return true
      }
      if (isPending) {
        this.logger.warn(`Paymento verify: token ${token} not paid (status=${status}) — ignoring`)
        return false
      }
      // Unknown status: only confirm on an explicit paid flag, never on a bare
      // success flag for an unspecified state.
      const paid = (data as any).paid === true
      if (paid) {
        this.logger.log(`Paymento verify OK — token ${token} paid flag set`)
        return true
      }
      this.logger.warn(`Paymento verify: token ${token} unconfirmed (status=${status}, success=${(data as any).success}) — ignoring`)
      return false
    } catch (err: any) {
      this.logger.error('Paymento verifyPayment error:', err?.message || err)
      return false
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

  /**
   * FIX #10: Issue a refund via Paymento for a completed payment token.
   * Returns true if the refund was accepted by the provider.
   */
  async refundPayment(token: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Paymento not configured — cannot issue refund for token ' + token)
      return false
    }
    try {
      const res = await fetch(`${this.apiUrl}/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-key': this.apiKey,
        },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const text = await res.text()
        this.logger.error(`Paymento refund failed for token ${token}: ${res.status} ${text}`)
        return false
      }
      this.logger.log(`Paymento refund issued for token ${token}`)
      return true
    } catch (err: any) {
      this.logger.error(`Paymento refundPayment error for token ${token}:`, err?.message || err)
      return false
    }
  }
}
