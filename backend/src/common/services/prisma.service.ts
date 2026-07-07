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
    try {
      await this.$connect()
      this.logger.log('✅ Database connected')
    } catch (err) {
      this.logger.error('❌ Database connection failed:', err)
      throw err
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
