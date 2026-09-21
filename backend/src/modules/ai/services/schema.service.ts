import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@/common/services/prisma.service'

export interface TableColumn {
  name: string
  type: string
  isList: boolean
  isId: boolean
}

const ROW_COUNT_TTL_MS = 10 * 60 * 1000

/**
 * Builds a compact, LLM-friendly description of the database straight from the
 * Prisma DMMF, so the assistant always sees the real table/column names.
 */
@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name)

  private readonly tables = new Map<string, TableColumn[]>()
  private readonly enums = new Map<string, string[]>()
  private staticCatalog = ''
  private rowCounts: Map<string, number> | null = null
  private rowCountsFetchedAt = 0
  private rowCountsInFlight: Promise<void> | null = null

  constructor(private prisma: PrismaService) {
    this.buildCatalog()
  }

  /** Table names exactly as they exist in PostgreSQL (snake_case). */
  get tableNames(): string[] {
    return [...this.tables.keys()]
  }

  isKnownTable(table: string): boolean {
    return this.tables.has(table.toLowerCase())
  }

  columnsFor(table: string): TableColumn[] | undefined {
    return this.tables.get(table.toLowerCase())
  }

  /** Full catalog text for the system prompt (cached after first build). */
  getCatalog(): string {
    if (!this.staticCatalog) this.buildCatalog()
    const parts = [this.staticCatalog]

    if (this.enums.size) {
      parts.push(
        'ENUM VALUES (use the exact string values in WHERE clauses):\n' +
          [...this.enums.entries()].map(([name, values]) => `  ${name}: ${values.join(', ')}`).join('\n'),
      )
    }

    if (this.rowCounts) {
      parts.push(
        'APPROXIMATE ROW COUNTS (from pg_class stats — re-verify with COUNT(*) when precision matters):\n  ' +
          [...this.tables.keys()].map((t) => `${t}=${this.rowCounts!.get(t) ?? 0}`).join('  '),
      )
    }

    return parts.join('\n\n')
  }

  /** Refresh approximate row counts in the background (best effort, cached). */
  refreshRowCounts(): Promise<void> {
    const fresh = Date.now() - this.rowCountsFetchedAt < ROW_COUNT_TTL_MS
    if (fresh) return Promise.resolve()
    if (this.rowCountsInFlight) return this.rowCountsInFlight

    this.rowCountsInFlight = (async () => {
      try {
        const rows = await this.prisma.$queryRawUnsafe<Array<{ relname: string; est: bigint }>>(
          `SELECT c.relname AS relname, GREATEST(c.reltuples, 0)::bigint AS est
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'`,
        )
        const counts = new Map<string, number>()
        for (const row of rows) counts.set(row.relname, Number(row.est))
        this.rowCounts = counts
        this.rowCountsFetchedAt = Date.now()
      } catch (err: any) {
        this.logger.warn(`Could not read approximate row counts: ${err?.message || err}`)
      } finally {
        this.rowCountsInFlight = null
      }
    })()

    return this.rowCountsInFlight
  }

  private buildCatalog() {
    this.tables.clear()
    this.enums.clear()

    const datamodel = Prisma.dmmf?.datamodel
    if (!datamodel) {
      this.logger.error('Prisma DMMF unavailable — AI SQL tools will be disabled')
      this.staticCatalog = ''
      return
    }

    for (const model of datamodel.models) {
      const table = (model.dbName || model.name).toLowerCase()
      const columns: TableColumn[] = []
      for (const field of model.fields) {
        if (field.kind === 'object') continue // relations are joins, not columns
        const isList = field.isList === true || (field.isList as unknown) === 'true'
        columns.push({
          name: field.dbName || field.name,
          type: field.type,
          isList,
          isId: field.isId === true,
        })
      }
      this.tables.set(table, columns)
    }

    for (const e of datamodel.enums) {
      this.enums.set(e.name, e.values.map((v) => v.name))
    }

    this.staticCatalog = [
      'DATABASE SCHEMA (PostgreSQL). Always double-quote identifiers exactly as written.',
      'Every table also has standard audit columns where listed. Money columns are NUMERIC with a sibling currency column.',
      '',
      [...this.tables.entries()]
        .map(([table, columns]) => {
          const cols = columns
            .map((c) => `"${c.name}" ${c.type.toLowerCase()}${c.isList ? '[]' : ''}`)
            .join(', ')
          return `TABLE "${table}" (${cols})`
        })
        .join('\n'),
    ].join('\n')
  }
}
