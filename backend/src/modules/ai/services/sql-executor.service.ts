import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { SqlGuardService } from './sql-guard.service'
import { toJsonSafe } from './serialize.util'

export interface SqlQueryResult {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  rowCap: number
  capped: boolean
  sql: string
}

const STATEMENT_TIMEOUT_MS = 6_000

/**
 * Runs assistant-authored SELECT statements inside a read-only transaction with a
 * statement timeout, so a bad query can never mutate data or hold a connection.
 */
@Injectable()
export class SqlExecutorService {
  private readonly logger = new Logger(SqlExecutorService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly guard: SqlGuardService,
  ) {}

  async runReadOnly(rawSql: string): Promise<SqlQueryResult> {
    const guarded = this.guard.guard(rawSql)
    const started = Date.now()

    const rows = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`)
        await tx.$executeRawUnsafe('SET LOCAL search_path = public')
        return tx.$queryRawUnsafe<Record<string, any>[]>(guarded.sql)
      },
      { timeout: STATEMENT_TIMEOUT_MS + 6_000, maxWait: 5_000 },
    )

    const safeRows = (Array.isArray(rows) ? rows : []).map((row) => toJsonSafe(row))
    this.logger.log(
      `AI SQL ok (${Date.now() - started}ms, ${safeRows.length} rows): ${guarded.original.slice(0, 140)}`,
    )

    return {
      columns: safeRows.length ? Object.keys(safeRows[0]) : [],
      rows: safeRows,
      rowCount: safeRows.length,
      rowCap: guarded.rowCap,
      capped: guarded.capped,
      sql: guarded.original,
    }
  }
}
