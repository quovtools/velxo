import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Injectable()
export class StartupHealthService implements OnModuleInit {
  private readonly logger = new Logger(StartupHealthService.name)

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('═══════════════════════════════════════════════════════════')
    this.logger.log('  Piyrox Startup Health Check')
    this.logger.log('═══════════════════════════════════════════════════════════')

    const results = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkPaymentProviders(),
      this.checkEmailService(),
      this.checkAuthProviders(),
      this.checkAppUrls(),
    ])

    const summary = results.filter((r) => r.ok).length
    const total = results.length

    this.logger.log('═══════════════════════════════════════════════════════════')
    this.logger.log(`  Startup checks complete: ${summary}/${total} features connected`)
    this.logger.log('═══════════════════════════════════════════════════════════')

    if (summary < total) {
      this.logger.warn(
        'Some features are NOT connected. Review the checks above before going live.',
      )
    }
  }

  private async checkDatabase(): Promise<{ name: string; ok: boolean; detail?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      this.logger.log('✅ Database: connected')
      return { name: 'database', ok: true }
    } catch (err: any) {
      const detail = err?.message || String(err)
      this.logger.error(`❌ Database: unreachable — ${detail}`)
      return { name: 'database', ok: false, detail }
    }
  }

  private async checkStorage(): Promise<{ name: string; ok: boolean; detail?: string }> {
    const endpoint = process.env.B2_ENDPOINT
    const bucket = process.env.B2_BUCKET
    const keyId = process.env.B2_KEY_ID
    const appKey = process.env.B2_APP_KEY

    if (!endpoint || !bucket || !keyId || !appKey) {
      const missing = [endpoint ? null : 'B2_ENDPOINT', bucket ? null : 'B2_BUCKET', keyId ? null : 'B2_KEY_ID', appKey ? null : 'B2_APP_KEY'].filter(Boolean).join(', ')
      this.logger.warn(`⚠️  Storage (B2): missing — ${missing}`)
      return { name: 'storage', ok: false, detail: `missing: ${missing}` }
    }

    try {
      const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
      const client = new S3Client({
        endpoint,
        region: process.env.B2_REGION || 'us-east-005',
        credentials: { accessKeyId: keyId, secretAccessKey: appKey },
        forcePathStyle: true,
      })
      await client.send(new HeadBucketCommand({ Bucket: bucket }))
      this.logger.log(`✅ Storage (B2): connected — bucket="${bucket}"`)
      return { name: 'storage', ok: true }
    } catch (err: any) {
      const detail = err?.message || String(err)
      this.logger.error(`❌ Storage (B2): unreachable — ${detail}`)
      return { name: 'storage', ok: false, detail }
    }
  }

  private async checkPaymentProviders(): Promise<{ name: string; ok: boolean; detail?: string }> {
    const paymentIoUrl = process.env.PAYMENT_IO_API_URL
    const paymentIoKey = process.env.PAYMENT_IO_API_KEY
    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY

    const parts: string[] = []
    const results: { name: string; ok: boolean; detail?: string }[] = []

    if (paymentIoUrl && paymentIoKey) {
      try {
        const res = await fetch(paymentIoUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
        if (res.ok || res.status < 500) {
          this.logger.log('✅ Payment.io: configured')
          results.push({ name: 'payment-io', ok: true })
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
      } catch (err: any) {
        const detail = err?.message || String(err)
        this.logger.error(`❌ Payment.io: unreachable — ${detail}`)
        results.push({ name: 'payment-io', ok: false, detail })
      }
    } else {
      this.logger.warn('⚠️  Payment.io: missing API_URL or API_KEY')
      results.push({ name: 'payment-io', ok: false, detail: 'missing credentials' })
    }

    if (flutterwaveKey) {
      this.logger.log('✅ Flutterwave: secret key configured')
      results.push({ name: 'flutterwave', ok: true })
    } else {
      this.logger.warn('⚠️  Flutterwave: FLUTTERWAVE_SECRET_KEY missing')
      results.push({ name: 'flutterwave', ok: false, detail: 'missing FLUTTERWAVE_SECRET_KEY' })
    }

    const allOk = results.every((r) => r.ok)
    return { name: 'payments', ok: allOk, detail: results.map((r) => `${r.name}:${r.ok ? 'ok' : 'fail'}`).join(', ') }
  }

  private async checkEmailService(): Promise<{ name: string; ok: boolean; detail?: string }> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      this.logger.warn('⚠️  Email (Resend): RESEND_API_KEY missing')
      return { name: 'email', ok: false, detail: 'missing RESEND_API_KEY' }
    }

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const res = await resend.emails.list({ limit: 1 })
      if (!res.error) {
        this.logger.log('✅ Email (Resend): connected')
        return { name: 'email', ok: true }
      }
      throw new Error(res.error.message || 'Unknown Resend error')
    } catch (err: any) {
      const detail = err?.message || String(err)
      this.logger.error(`❌ Email (Resend): unreachable — ${detail}`)
      return { name: 'email', ok: false, detail }
    }
  }

  private async checkAuthProviders(): Promise<{ name: string; ok: boolean; detail?: string }> {
    const parts: string[] = []
    const results: { name: string; ok: boolean; detail?: string }[] = []

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      this.logger.log(`✅ Auth (Supabase): configured — ${supabaseUrl}`)
      results.push({ name: 'supabase', ok: true })
    } else {
      const missing = [supabaseUrl ? null : 'SUPABASE_URL', supabaseKey ? null : 'SUPABASE_ANON_KEY'].filter(Boolean).join(', ')
      this.logger.warn(`⚠️  Auth (Supabase): missing — ${missing}`)
      results.push({ name: 'supabase', ok: false, detail: missing })
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID
    if (googleClientId) {
      this.logger.log('✅ Auth (Google OAuth): client ID configured')
      results.push({ name: 'google-oauth', ok: true })
    } else {
      this.logger.warn('⚠️  Auth (Google OAuth): GOOGLE_CLIENT_ID missing')
      results.push({ name: 'google-oauth', ok: false, detail: 'missing GOOGLE_CLIENT_ID' })
    }

    const allOk = results.every((r) => r.ok)
    return { name: 'auth', ok: allOk, detail: results.map((r) => `${r.name}:${r.ok ? 'ok' : 'fail'}`).join(', ') }
  }

  private async checkAppUrls(): Promise<{ name: string; ok: boolean; detail?: string }> {
    const frontendUrl = process.env.FRONTEND_URL
    const apiUrl = process.env.API_URL

    const results: { name: string; ok: boolean; detail?: string }[] = []

    if (frontendUrl) {
      this.logger.log(`✅ Frontend URL: ${frontendUrl}`)
      results.push({ name: 'frontend-url', ok: true })
    } else {
      this.logger.warn('⚠️  Frontend URL: FRONTEND_URL missing')
      results.push({ name: 'frontend-url', ok: false, detail: 'missing FRONTEND_URL' })
    }

    if (apiUrl) {
      this.logger.log(`✅ API URL: ${apiUrl}`)
      results.push({ name: 'api-url', ok: true })
    } else {
      this.logger.warn('⚠️  API URL: API_URL missing')
      results.push({ name: 'api-url', ok: false, detail: 'missing API_URL' })
    }

    const allOk = results.every((r) => r.ok)
    return { name: 'urls', ok: allOk, detail: results.map((r) => `${r.name}:${r.ok ? 'ok' : 'fail'}`).join(', ') }
  }
}
