import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from './prisma.service'

interface CheckResult {
  name: string
  label: string
  ok: boolean
  detail?: string
  ms?: number
}

@Injectable()
export class StartupHealthService implements OnModuleInit {
  private readonly logger = new Logger(StartupHealthService.name)

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const start = Date.now()

    this.logger.log('╔══════════════════════════════════════════════════════════╗')
    this.logger.log('║           PIYROX  —  STARTUP CONNECTIVITY CHECK          ║')
    this.logger.log('╚══════════════════════════════════════════════════════════╝')

    const results = await Promise.all([
      this.checkDatabase(),
      this.checkNeonDB(),
      this.checkCloudinary(),
      this.checkResend(),
      this.checkBavimail(),
      this.checkFlutterwave(),
      this.checkPaymentIo(),
      this.checkGoogleOAuth(),
      this.checkJwt(),
      this.checkFrontendUrl(),
      this.checkApiUrl(),
    ])

    // ── Print individual results ─────────────────────────────────────────────
    this.logger.log('┌──────────────────────────────────────────────────────────┐')
    this.logger.log('│  Service                    Status     Detail            │')
    this.logger.log('├──────────────────────────────────────────────────────────┤')

    for (const r of results) {
      const icon   = r.ok ? '✅' : '❌'
      const status = r.ok ? 'CONNECTED' : 'FAILED   '
      const label  = r.label.padEnd(28)
      const ms     = r.ms !== undefined ? ` (${r.ms}ms)` : ''
      const detail = r.detail ? ` — ${r.detail}` : ''
      const line   = `${icon}  ${label} ${status}${ms}${detail}`
      if (r.ok) {
        this.logger.log(line)
      } else {
        this.logger.warn(line)
      }
    }

    this.logger.log('└──────────────────────────────────────────────────────────┘')

    const passed = results.filter((r) => r.ok).length
    const failed = results.filter((r) => !r.ok).length
    const elapsed = Date.now() - start

    this.logger.log(`  ✔ ${passed} connected   ✖ ${failed} failed   — checked in ${elapsed}ms`)

    if (failed > 0) {
      const failedNames = results.filter((r) => !r.ok).map((r) => r.label).join(', ')
      this.logger.warn(`  ⚠  Not connected: ${failedNames}`)
      this.logger.warn('  Review missing env vars or unreachable services before going live.')
    } else {
      this.logger.log('  🚀 All systems connected — piyrox is ready!')
    }

    this.logger.log('══════════════════════════════════════════════════════════')
  }

  // ── 1. Database — Prisma query ping ─────────────────────────────────────
  private async checkDatabase(): Promise<CheckResult> {
    const t = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { name: 'database', label: 'Database (Prisma)', ok: true, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'database', label: 'Database (Prisma)', ok: false, detail: err?.message, ms: Date.now() - t }
    }
  }

  // ── 2. NeonDB — verify connection string is set ──────────────────────────
  private async checkNeonDB(): Promise<CheckResult> {
    const url = process.env.DATABASE_URL || ''
    const isNeon = url.includes('neon.tech')
    if (!url) {
      return { name: 'neondb', label: 'NeonDB', ok: false, detail: 'DATABASE_URL not set' }
    }
    if (!isNeon) {
      return { name: 'neondb', label: 'NeonDB', ok: false, detail: 'DATABASE_URL does not point to neon.tech' }
    }
    // Extract host for display only — never log credentials
    let host = 'configured'
    try { host = new URL(url).hostname } catch {}
    return { name: 'neondb', label: 'NeonDB', ok: true, detail: host }
  }

  // ── 3. Cloudinary — live API ping ────────────────────────────────────────
  private async checkCloudinary(): Promise<CheckResult> {
    const cloudName  = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey     = process.env.CLOUDINARY_API_KEY
    const apiSecret  = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [
        cloudName  ? null : 'CLOUDINARY_CLOUD_NAME',
        apiKey     ? null : 'CLOUDINARY_API_KEY',
        apiSecret  ? null : 'CLOUDINARY_API_SECRET',
      ].filter(Boolean).join(', ')
      return { name: 'cloudinary', label: 'Cloudinary (Storage)', ok: false, detail: `missing: ${missing}` }
    }

    const t = Date.now()
    try {
      const { v2: cloudinary } = await import('cloudinary')
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
      await cloudinary.api.ping()
      return { name: 'cloudinary', label: 'Cloudinary (Storage)', ok: true, detail: `cloud=${cloudName}`, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'cloudinary', label: 'Cloudinary (Storage)', ok: false, detail: err?.message, ms: Date.now() - t }
    }
  }

  // ── 4. Resend — verify API key + live domains list ───────────────────────
  private async checkResend(): Promise<CheckResult> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { name: 'resend', label: 'Resend (Email Primary)', ok: false, detail: 'RESEND_API_KEY not set' }
    }

    const t = Date.now()
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      // Lightweight authenticated call — list domains
      const { data, error } = await resend.domains.list()
      if (error) throw new Error(error.message)
      const count = (data as any)?.data?.length ?? 0
      return { name: 'resend', label: 'Resend (Email Primary)', ok: true, detail: `${count} domain(s) verified`, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'resend', label: 'Resend (Email Primary)', ok: false, detail: err?.message, ms: Date.now() - t }
    }
  }

  // ── 5. Bavimail — verify key + alias are set ─────────────────────────────
  private async checkBavimail(): Promise<CheckResult> {
    const apiKey  = process.env.BAVIMAIL_API_KEY
    const aliasId = process.env.BAVIMAIL_ALIAS_ID

    if (!apiKey || !aliasId) {
      const missing = [apiKey ? null : 'BAVIMAIL_API_KEY', aliasId ? null : 'BAVIMAIL_ALIAS_ID'].filter(Boolean).join(', ')
      return { name: 'bavimail', label: 'Bavimail (Email Fallback)', ok: false, detail: `missing: ${missing}` }
    }

    const t = Date.now()
    try {
      const { Bavimail } = await import('bavimail')
      new Bavimail({ apiKey })
      return { name: 'bavimail', label: 'Bavimail (Email Fallback)', ok: true, detail: `alias=${aliasId}`, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'bavimail', label: 'Bavimail (Email Fallback)', ok: false, detail: err?.message, ms: Date.now() - t }
    }
  }

  // ── 6. Flutterwave — verify key + live API ping ──────────────────────────
  private async checkFlutterwave(): Promise<CheckResult> {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
    if (!secretKey) {
      return { name: 'flutterwave', label: 'Flutterwave (Payments)', ok: false, detail: 'FLUTTERWAVE_SECRET_KEY not set' }
    }

    const t = Date.now()
    try {
      const res = await fetch('https://api.flutterwave.com/v3/banks/NG', {
        headers: { Authorization: `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok || res.status === 200) {
        return { name: 'flutterwave', label: 'Flutterwave (Payments)', ok: true, detail: 'API reachable', ms: Date.now() - t }
      }
      return { name: 'flutterwave', label: 'Flutterwave (Payments)', ok: false, detail: `HTTP ${res.status}`, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'flutterwave', label: 'Flutterwave (Payments)', ok: false, detail: err?.message, ms: Date.now() - t }
    }
  }

  // ── 7. Payment.io — verify key + live API ping ───────────────────────────
  private async checkPaymentIo(): Promise<CheckResult> {
    const apiUrl = process.env.PAYMENT_IO_API_URL
    const apiKey = process.env.PAYMENT_IO_API_KEY

    if (!apiUrl || !apiKey) {
      const missing = [apiUrl ? null : 'PAYMENT_IO_API_URL', apiKey ? null : 'PAYMENT_IO_API_KEY'].filter(Boolean).join(', ')
      return { name: 'payment-io', label: 'Payment.io (Crypto)', ok: false, detail: `missing: ${missing}` }
    }

    const t = Date.now()
    try {
      const res = await fetch(apiUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok || res.status < 500) {
        return { name: 'payment-io', label: 'Payment.io (Crypto)', ok: true, detail: 'API reachable', ms: Date.now() - t }
      }
      return { name: 'payment-io', label: 'Payment.io (Crypto)', ok: false, detail: `HTTP ${res.status}`, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'payment-io', label: 'Payment.io (Crypto)', ok: false, detail: err?.message, ms: Date.now() - t }
    }
  }

  // ── 8. Google OAuth — verify credentials are set ─────────────────────────
  private async checkGoogleOAuth(): Promise<CheckResult> {
    const clientId     = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret) {
      const missing = [clientId ? null : 'GOOGLE_CLIENT_ID', clientSecret ? null : 'GOOGLE_CLIENT_SECRET'].filter(Boolean).join(', ')
      return { name: 'google-oauth', label: 'Google OAuth', ok: false, detail: `missing: ${missing}` }
    }

    const hasRedirect = !!redirectUri
    return {
      name: 'google-oauth',
      label: 'Google OAuth',
      ok: true,
      detail: hasRedirect ? `redirect=${redirectUri}` : 'redirect URI not set (optional)',
    }
  }

  // ── 9. JWT — verify secret is set and not the insecure fallback ──────────
  private async checkJwt(): Promise<CheckResult> {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return { name: 'jwt', label: 'JWT Auth', ok: false, detail: 'JWT_SECRET not set — using insecure fallback!' }
    }
    if (secret === 'piyrox-fallback-secret-change-in-prod') {
      return { name: 'jwt', label: 'JWT Auth', ok: false, detail: 'Using default fallback secret — change JWT_SECRET in production!' }
    }
    return { name: 'jwt', label: 'JWT Auth', ok: true, detail: `${secret.length} char secret, expires=${process.env.JWT_EXPIRES_IN || '7d'}` }
  }

  // ── 10. Frontend URL — set + live ping ───────────────────────────────────
  private async checkFrontendUrl(): Promise<CheckResult> {
    const url = process.env.FRONTEND_URL
    if (!url) {
      return { name: 'frontend-url', label: 'Frontend URL', ok: false, detail: 'FRONTEND_URL not set' }
    }

    const t = Date.now()
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) })
      return { name: 'frontend-url', label: 'Frontend URL', ok: res.ok || res.status < 500, detail: `${url} → HTTP ${res.status}`, ms: Date.now() - t }
    } catch (err: any) {
      // Not a blocker — frontend might just not be up yet at startup
      return { name: 'frontend-url', label: 'Frontend URL', ok: false, detail: `${url} unreachable: ${err?.message}`, ms: Date.now() - t }
    }
  }

  // ── 11. API URL — set + self-ping ────────────────────────────────────────
  private async checkApiUrl(): Promise<CheckResult> {
    const url = process.env.API_URL
    if (!url) {
      return { name: 'api-url', label: 'API URL', ok: false, detail: 'API_URL not set' }
    }

    const t = Date.now()
    try {
      const pingUrl = `${url.replace(/\/$/, '')}/api/v1`
      const res = await fetch(pingUrl, { method: 'GET', signal: AbortSignal.timeout(4000) })
      return { name: 'api-url', label: 'API URL', ok: res.ok, detail: `${pingUrl} → HTTP ${res.status}`, ms: Date.now() - t }
    } catch (err: any) {
      return { name: 'api-url', label: 'API URL', ok: false, detail: `${url} unreachable: ${err?.message}`, ms: Date.now() - t }
    }
  }
}
