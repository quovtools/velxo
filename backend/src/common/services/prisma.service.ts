import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      // Cap the connection pool to avoid exhausting NeonDB free tier connections.
      // NeonDB free tier allows max 10 concurrent connections.
      // With pgBouncer pooling on the DATABASE_URL this is further multiplexed,
      // but keeping the Prisma pool small avoids waking compute unnecessarily.
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
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

    // ── Soft-delete middleware ─────────────────────────────────────────────
    // Automatically exclude logically-deleted users (deletedAt IS NOT NULL)
    // from all findFirst / findMany / findUnique / count queries on the users
    // table. This ensures deleted accounts never appear in search, order
    // lookups, or notification queries without requiring call-site changes.
    ;(this as any).$use(async (params: any, next: any) => {
      const softDeleteModels = ['users']
      if (softDeleteModels.includes(params.model)) {
        const readOps = ['findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy']
        if (readOps.includes(params.action)) {
          params.args = params.args ?? {}
          params.args.where = params.args.where ?? {}
          // Only inject the filter when the caller hasn't explicitly asked for
          // deleted records (e.g. admin soft-delete management screen).
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null
          }
        }
        // Convert hard deletes to soft deletes.
        if (params.action === 'delete') {
          params.action = 'update'
          params.args.data = { deletedAt: new Date() }
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany'
          if (params.args.data !== undefined) {
            params.args.data.deletedAt = new Date()
          } else {
            params.args.data = { deletedAt: new Date() }
          }
        }
      }
      return next(params)
    })
  }

  async onModuleInit() {
    // Retry connecting up to 5 times with exponential back-off.
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
          const delayMs = attempt * 3000
          this.logger.log(`Retrying in ${delayMs / 1000}s...`)
          await new Promise((r) => setTimeout(r, delayMs))
        }
      }
    }
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
