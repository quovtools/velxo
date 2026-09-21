import { BadRequestException, Injectable } from '@nestjs/common'
import { SchemaService } from './schema.service'

export interface GuardedSql {
  /** Ready-to-run SQL (wrapped with a hard row cap). */
  sql: string
  /** The statement as the model wrote it (post-validation). */
  original: string
  rowCap: number
  capped: boolean
}

const ROW_CAP = 200
const MAX_SQL_LENGTH = 6_000

/** Keywords that must never appear in an assistant-issued statement. */
const BLOCKED_KEYWORDS = [
  'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate',
  'grant', 'revoke', 'copy', 'vacuum', 'reindex', 'cluster', 'refresh',
  'analyze', 'listen', 'notify', 'unlisten', 'do', 'call', 'execute',
  'prepare', 'deallocate', 'discard', 'merge', 'lock', 'begin', 'commit',
  'rollback', 'savepoint', 'release', 'set', 'reset', 'show', 'into',
  'security', 'label', 'comment', 'import', 'checkpoint',
]

/** Functions that touch the filesystem, other backends, or the session. */
const BLOCKED_FUNCTIONS = [
  'pg_sleep', 'pg_read_file', 'pg_read_binary_file', 'pg_write_file',
  'pg_ls_dir', 'pg_stat_file', 'pg_terminate_backend', 'pg_cancel_backend',
  'pg_reload_conf', 'pg_rotate_logfile', 'pg_advisory_lock',
  'pg_advisory_xact_lock', 'pg_try_advisory_lock', 'pg_try_advisory_xact_lock',
  'lo_import', 'lo_export', 'lo_get', 'lo_put', 'dblink', 'set_config',
  'pg_promote', 'pg_switch_wal', 'pg_create_restore_point', 'pg_drop_replication_slot',
]

const BLOCKED_SCHEMAS = ['pg_catalog', 'information_schema', 'pg_temp', 'pg_toast']

/**
 * Validates assistant-generated SQL: single read-only statement, whitelisted
 * tables, no dangerous keywords/functions, and a hard row cap.
 */
@Injectable()
export class SqlGuardService {
  constructor(private readonly schema: SchemaService) {}

  guard(rawSql: string): GuardedSql {
    if (typeof rawSql !== 'string' || !rawSql.trim()) {
      throw new BadRequestException('SQL query is empty')
    }
    if (rawSql.length > MAX_SQL_LENGTH) {
      throw new BadRequestException(`SQL query is too long (max ${MAX_SQL_LENGTH} characters)`)
    }

    const scan = this.stripLiterals(rawSql, { blankIdentifiers: true })
    const identView = this.stripLiterals(rawSql, { blankIdentifiers: false })

    // ── Single statement ─────────────────────────────────────────────────────
    if (scan.includes(';')) {
      throw new BadRequestException('Only a single SQL statement is allowed (remove the ";")')
    }

    const normalized = scan.trim().toLowerCase()
    if (!/^(select|with)\b/.test(normalized)) {
      throw new BadRequestException('Only SELECT queries (optionally starting with WITH) are allowed')
    }

    // ── Keyword / function / schema blocklists ───────────────────────────────
    for (const keyword of BLOCKED_KEYWORDS) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(scan)) {
        throw new BadRequestException(`The keyword "${keyword.toUpperCase()}" is not allowed in read-only queries`)
      }
    }
    for (const fn of BLOCKED_FUNCTIONS) {
      if (new RegExp(`\\b${fn}\\s*\\(`, 'i').test(scan)) {
        throw new BadRequestException(`The function "${fn}" is not allowed`)
      }
    }
    for (const schemaName of BLOCKED_SCHEMAS) {
      if (new RegExp(`\\b${schemaName}\\b`, 'i').test(scan)) {
        throw new BadRequestException(`Access to schema "${schemaName}" is not allowed`)
      }
    }
    if (/\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i.test(scan)) {
      throw new BadRequestException('Row locking clauses are not allowed')
    }
    if (/\blimit\s+all\b/i.test(scan)) {
      throw new BadRequestException('LIMIT ALL is not allowed — specify a numeric limit')
    }

    // ── Table whitelist ──────────────────────────────────────────────────────
    const referenced = this.extractTableReferences(identView)
    if (referenced.length === 0) {
      throw new BadRequestException('The query must read from at least one table')
    }
    for (const ref of referenced) {
      if (!this.schema.isKnownTable(ref)) {
        throw new BadRequestException(
          `Unknown table "${ref}". Available tables: ${this.schema.tableNames.join(', ')}`,
        )
      }
    }

    const original = rawSql.trim().replace(/;+\s*$/, '')
    const capped = !/\blimit\b/i.test(scan)

    return {
      sql: `SELECT * FROM (\n${original}\n) AS _ai_result LIMIT ${ROW_CAP}`,
      original,
      rowCap: ROW_CAP,
      capped,
    }
  }

  /**
   * Returns every table referenced after FROM / JOIN (schema-qualified names are
   * reduced to the table part). Subqueries and CTE references are skipped here and
   * validated separately: CTE names are collected so they are not misread as tables.
   */
  private extractTableReferences(sql: string): string[] {
    const cteNames = new Set<string>()
    const cteRegex = /(?:\bwith\b|,)\s*([a-z_][a-z0-9_]*)\s+as\s*\(/gi
    let cteMatch: RegExpExecArray | null
    while ((cteMatch = cteRegex.exec(sql)) !== null) {
      cteNames.add(cteMatch[1].toLowerCase())
    }

    const refs = new Set<string>()
    const regex = /\b(?:from|join)\s+((?:"[^"]+"|[a-z_][a-z0-9_$]*)(?:\s*\.\s*(?:"[^"]+"|[a-z_][a-z0-9_$]*))?)/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(sql)) !== null) {
      const raw = match[1].replace(/\s+/g, '')
      const parts = raw.split('.').map((p) => p.replace(/"/g, '').toLowerCase())
      const table = parts[parts.length - 1]
      if (parts.length > 1 && parts[0] !== 'public') {
        throw new BadRequestException(`Access to schema "${parts[0]}" is not allowed`)
      }
      if (cteNames.has(table)) continue
      if (!table) continue
      refs.add(table)
    }
    return [...refs]
  }

  /**
   * Replaces string literals and comments with whitespace so keyword scanning
   * cannot be bypassed with `-- comments` or tricked by quoted text.
   */
  private stripLiterals(sql: string, opts: { blankIdentifiers: boolean }): string {
    let out = ''
    let i = 0

    while (i < sql.length) {
      const ch = sql[i]
      const next = sql[i + 1]

      if (ch === '-' && next === '-') {
        while (i < sql.length && sql[i] !== '\n') i++
        out += ' '
        continue
      }

      if (ch === '/' && next === '*') {
        i += 2
        while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
        i += 2
        out += ' '
        continue
      }

      if (ch === "'") {
        i++
        while (i < sql.length) {
          if (sql[i] === "'" && sql[i + 1] === "'") {
            i += 2
            continue
          }
          if (sql[i] === "'") {
            i++
            break
          }
          i++
        }
        out += "''"
        continue
      }

      if (ch === '$' && /[\w$]*\$/.test(sql.slice(i).match(/^\$[\w$]*\$/)?.[0] ?? '')) {
        const tag = sql.slice(i).match(/^\$[\w$]*\$/)![0]
        const end = sql.indexOf(tag, i + tag.length)
        i = end === -1 ? sql.length : end + tag.length
        out += "''"
        continue
      }

      if (ch === '"' && opts.blankIdentifiers) {
        i++
        while (i < sql.length) {
          if (sql[i] === '"' && sql[i + 1] === '"') {
            i += 2
            continue
          }
          if (sql[i] === '"') {
            i++
            break
          }
          i++
        }
        out += '"x"'
        continue
      }

      out += ch
      i++
    }

    return out
  }
}
