import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    })

    // Forward Prisma errors to NestJS logger so they appear in Render logs
    ;(this as any).$on('error', (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`, e.target)
    })
    ;(this as any).$on('warn', (e: any) => {
      this.logger.warn(`Prisma warning: ${e.message}`)
    })
  }

  async onModuleInit() {
    // Retry connecting up to 5 times with exponential back-off.
    // This handles Fly Postgres cold-starts and brief network blips without
    // crashing the whole container (which would also kill Next.js).
    const MAX_RETRIES = 5
    let lastErr: unknown
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.$connect()
        this.logger.log('✅ Database connected')
        await this.ensureSystemUser()
        return
      } catch (err) {
        lastErr = err
        this.logger.error(`❌ Database connection failed (attempt ${attempt}/${MAX_RETRIES}):`, err)
        if (attempt < MAX_RETRIES) {
          const delayMs = attempt * 3000 // 3s, 6s, 9s, 12s
          this.logger.log(`Retrying in ${delayMs / 1000}s...`)
          await new Promise((r) => setTimeout(r, delayMs))
        }
      }
    }
    // After all retries, log the error but do NOT throw — this keeps NestJS
    // alive so Next.js can still serve non-API pages and the backend can
    // recover on the next request once the DB comes back.
    this.logger.error('❌ Database connection failed after all retries. API calls will fail until DB recovers.', lastErr)
  }

  /**
   * Ensures the synthetic "admin-console" user exists.
   *
   * Admin routes are gated by a shared password (see AdminPasswordGuard) rather
   * than a real account, and that guard sets userId = 'admin-console'. Audit
   * logs (admin_audit_logs.actorId) reference users via a foreign key, so this
   * system row must exist for console-initiated actions (delete listing, KYC
   * approvals, etc.) to be logged without violating the FK constraint.
   *
   * Non-fatal: a failure here must never prevent the app from starting.
   */
  private async ensureSystemUser() {
    try {
      await this.users.upsert({
        where: { id: 'admin-console' },
        update: {},
        create: {
          id: 'admin-console',
          email: 'admin-console@system.piyrox',
          firstName: 'Admin',
          lastName: 'Console',
          role: 'ADMIN',
          emailVerified: true,
          isActive: true,
        },
      })
      this.logger.log('✅ System admin-console user ready')
    } catch (err) {
      this.logger.warn(`Could not ensure admin-console system user: ${(err as any)?.message}`)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
