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

  private readonly apiUrl = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3'
  private readonly secretKey = process.env.FLUTTERWAVE_SECRET_KEY || ''

  get isConfigured(): boolean {
    return Boolean(this.apiUrl && this.secretKey)
  }

  /**
   * Create a Flutterwave hosted payment (redirect) link.
   * Uses the standard v3 /payments endpoint which returns a `data.link`
   * the buyer is redirected to in order to pay (cards / mobile money / bank).
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
        title: 'Velxo Market',
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
        chargeId: data?.data?.id || data?.id || params.reference,
        paymentUrl: data?.data?.link || null,
        configured: true,
      }
    } catch (err: any) {
      this.logger.error('Flutterwave createCharge error:', err?.message || err)
      throw err
    }
  }
}
