import { Injectable, Logger } from '@nestjs/common'

export interface FlutterwaveChargeParams {
  reference: string
  amount: number
  currency: string
  email: string
  callbackUrl: string
  redirectUrl?: string
}

export interface FlutterwaveChargeResult {
  chargeId: string | null
  paymentUrl: string | null
  configured: boolean
}

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name)

  // v3 API credentials — secret key is used directly as the Bearer token
  private readonly secretKey     = process.env.FLUTTERWAVE_SECRET_KEY     || ''
  private readonly publicKey     = process.env.FLUTTERWAVE_PUBLIC_KEY      || ''
  private readonly encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY  || ''

  // v3 production base URL
  private readonly apiUrl = 'https://api.flutterwave.com/v3'

  get isConfigured(): boolean {
    return Boolean(this.secretKey)
  }

  /** Expose public key for client-side use (e.g. inline charge) */
  get clientPublicKey(): string {
    return this.publicKey
  }

  /** Expose encryption key for direct charge payload encryption */
  get encKey(): string {
    return this.encryptionKey
  }

  /**
   * Create a Flutterwave hosted payment link via the v3 API.
   * POST https://api.flutterwave.com/v3/payments
   * Returns a `data.link` the buyer is redirected to.
   * Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
   */
  async createCharge(params: FlutterwaveChargeParams): Promise<FlutterwaveChargeResult> {
    if (!this.isConfigured) {
      this.logger.warn('Flutterwave is not configured — returning stub charge (no live redirect).')
      return { chargeId: null, paymentUrl: null, configured: false }
    }

    const body = {
      tx_ref: params.reference,
      amount: params.amount,
      currency: params.currency || 'USD',
      redirect_url: params.callbackUrl,
      customer: { email: params.email },
      payment_options: 'card,account,ussd,qr,banktransfer,mobilemoney',
      customizations: {
        title: 'piyrox market',
        description: `Order ${params.reference}`,
      },
    }

    try {
      const res = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Flutterwave charge failed: ${res.status} ${text}`)
      }

      const data = await res.json()
      return {
        chargeId: data?.data?.id?.toString() || params.reference,
        paymentUrl: data?.data?.link || null,
        configured: true,
      }
    } catch (err: any) {
      this.logger.error('Flutterwave createCharge error:', err?.message || err)
      throw err
    }
  }

  /**
   * Verify a Flutterwave transaction server-side before trusting a webhook.
   * GET https://api.flutterwave.com/v3/transactions/{id}/verify
   */
  async verifyTransaction(transactionId: string | number): Promise<boolean> {
    if (!this.isConfigured) return false
    try {
      const res = await fetch(`${this.apiUrl}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secretKey}`,
        },
      })
      if (!res.ok) return false
      const data = await res.json().catch(() => null)
      const status = data?.data?.status
      return status === 'successful'
    } catch (err: any) {
      this.logger.error('Flutterwave verifyTransaction error:', err?.message || err)
      return false
    }
  }

  /**
   * Issue a refund via Flutterwave for a completed transaction.
   * POST https://api.flutterwave.com/v3/transactions/{id}/refund
   */
  async refundTransaction(transactionId: string | number): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Flutterwave not configured — cannot issue refund for tx ' + transactionId)
      return false
    }
    try {
      const res = await fetch(`${this.apiUrl}/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const text = await res.text()
        this.logger.error(`Flutterwave refund failed for tx ${transactionId}: ${res.status} ${text}`)
        return false
      }
      this.logger.log(`Flutterwave refund issued for tx ${transactionId}`)
      return true
    } catch (err: any) {
      this.logger.error(`Flutterwave refundTransaction error for tx ${transactionId}:`, err?.message || err)
      return false
    }
  }
}
