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

  // v4 OAuth 2.0 credentials
  private readonly clientId     = process.env.FLUTTERWAVE_PUBLIC_KEY   || ''
  private readonly clientSecret = process.env.FLUTTERWAVE_SECRET_KEY   || ''
  private readonly encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY || ''

  // v4 production base URL
  private readonly apiUrl = process.env.FLUTTERWAVE_API_URL || 'https://f4bexperience.flutterwave.com'

  // OAuth token cache
  private cachedToken: string | null = null
  private tokenExpiresAt = 0 // epoch ms

  get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret)
  }

  /** Expose public key (client ID) for client-side use */
  get clientPublicKey(): string {
    return this.clientId
  }

  /** Expose encryption key for direct charge payload encryption */
  get encKey(): string {
    return this.encryptionKey
  }

  /**
   * Fetches a short-lived OAuth 2.0 access token from Flutterwave's IDP.
   * Tokens are cached and reused until ~1 minute before expiry (10 min TTL).
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now()
    // Return cached token if still valid (with 60s buffer)
    if (this.cachedToken && now < this.tokenExpiresAt - 60_000) {
      return this.cachedToken
    }

    const res = await fetch(
      'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
        signal: AbortSignal.timeout(8000),
      },
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Flutterwave OAuth token request failed: ${res.status} ${text}`)
    }

    const data = await res.json()
    if (!data?.access_token) {
      throw new Error('Flutterwave OAuth response missing access_token')
    }

    this.cachedToken = data.access_token as string
    // expires_in is in seconds
    this.tokenExpiresAt = now + (data.expires_in as number) * 1000
    return this.cachedToken
  }

  /**
   * Create a Flutterwave hosted payment (redirect) link.
   * Uses the v4 /payments endpoint which returns a `data.link`
   * the buyer is redirected to.
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
      const token = await this.getAccessToken()
      const res = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Flutterwave charge failed: ${res.status} ${text}`)
      }

      const data = await res.json()
      return {
        chargeId: data?.data?.id || data?.id || params.reference,
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
   * GET {apiUrl}/transactions/{id}/verify
   */
  async verifyTransaction(transactionId: string | number): Promise<boolean> {
    if (!this.isConfigured) return false
    try {
      const token = await this.getAccessToken()
      const res = await fetch(`${this.apiUrl}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
   * POST {apiUrl}/transactions/{id}/refund
   */
  async refundTransaction(transactionId: string | number): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Flutterwave not configured — cannot issue refund for tx ' + transactionId)
      return false
    }
    try {
      const token = await this.getAccessToken()
      const res = await fetch(`${this.apiUrl}/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
