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

/**
 * DML / DDL keywords that must never appear as SQL *statements* in
 * assistant-generated queries.  We only block them when they appear as a
 * standalone SQL keyword, not as a column alias or string value.
 *
 * Removed from the original list (legitimate in read-only SELECT context):
 *  - 'set'      → valid column name / alias (e.g. "result_set", "data_set")
 *  - 'into'     → FETCH FIRST n ROWS ONLY … INTO is not standard; kept out
 *  - 'show'     → column alias; also not a DML risk inside a subquery
 *  - 'release'  → valid column name (e.g. "release_date", "release")
 *  - 'analyze'  → EXPLAIN ANALYZE is read-only; and "analyze" appears as alias
 *  - 'comment'  → valid column name / alias
 *  - 'label'    → valid column name / alias
 *  - 'security' → valid column name / alias (e.g. "security_deposit")
 *  - 'import'   → valid column name
 *
 * Kept as statement-level blocks (no legitimate use inside a SELECT):
 *  insert, update, delete, drop, alter, create, truncate,
 *  grant, revoke, copy, vacuum, reindex, cluster, refresh,
 *  listen, notify, unlisten, do, call, execute,
 *  prepare, deallocate, discard, merge, lock, begin, commit,
 *  rollback, savepoint, reset, checkpoint
 *
 * NOTE: The check is applied to a version of the SQL where string literals,
 * quoted identifiers and comments have been stripped, so the model cannot
 * sneak a blocked keyword inside a quoted string.
 */
const BLOCKED_STATEMENT_KEYWORDS = [
  'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate',
  'grant', 'revoke', 'copy', 'vacuum', 'reindex', 'cluster', 'refresh',
  'listen', 'notify', 'unlisten', 'do', 'call', 'execute',
  'prepare', 'deallocate', 'discard', 'merge', 'lock', 'begin', 'commit',
  'rollback', 'savepoint', 'reset', 'checkpoint',
]

/**
 * These are blocked even when appearing inside a SELECT because they always
 * indicate a side-effectful or dangerous operation regardless of context.
 */
const BLOCKED_FUNCTIONS = [
  'pg_sleep', 'pg_read_file', 'pg_read_binary_file', 'pg_write_file',
  'pg_ls_dir', 'pg_stat_file', 'pg_terminate_backend', 'pg_cancel_backend',
  'pg_reload_conf', 'pg_rotate_logfile', 'pg_advisory_lock',
  'pg_advisory_xact_lock', 'pg_try_advisory_lock', 'pg_try_advisory_xact_lock',
  'lo_import', 'lo_export', 'lo_get', 'lo_put', 'dblink', 'set_config',
  'pg_promote', 'pg_switch_wal', 'pg_create_restore_point',
  'pg_drop_replication_slot',
]

const BLOCKED_SCHEMAS = ['pg_catalog', 'information_schema', 'pg_temp', 'pg_toast']

/**
 * Validates assistant-generated SQL: single read-only SELECT, whitelisted
 * tables, no dangerous statement keywords / functions, hard row cap.
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

    // Strip literals before scanning so the model cannot bypass checks by
    // embedding blocked keywords inside quoted strings or comments.
    const scan      = this.stripLiterals(rawSql, { blankIdentifiers: true })
    const identView = this.stripLiterals(rawSql, { blankIdentifiers: false })

    // ── 1. Single statement (no semicolons) ──────────────────────────────────
    if (scan.includes(';')) {
      throw new BadRequestException('Only a single SQL statement is allowed (remove the ";")')
    }

    // ── 2. Must start with SELECT or WITH ────────────────────────────────────
    const normalized = scan.trim().toLowerCase()
    if (!/^(select|with)\b/.test(normalized)) {
      throw new BadRequestException('Only SELECT queries (optionally starting with WITH) are allowed')
    }

    // ── 3. Statement-level keyword blocklist ─────────────────────────────────
    for (const keyword of BLOCKED_STATEMENT_KEYWORDS) {
      // Whole-word match only — avoids false positives on column aliases.
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(scan)) {
        throw new BadRequestException(
          `The keyword "${keyword.toUpperCase()}" is not allowed in read-only queries`,
        )
      }
    }

    // ── 4. Dangerous function blocklist ──────────────────────────────────────
    for (const fn of BLOCKED_FUNCTIONS) {
      if (new RegExp(`\\b${fn}\\s*\\(`, 'i').test(scan)) {
        throw new BadRequestException(`The function "${fn}" is not allowed`)
      }
    }

    // ── 5. Schema blocklist ──────────────────────────────────────────────────
    for (const schemaName of BLOCKED_SCHEMAS) {
      if (new RegExp(`\\b${schemaName}\\b`, 'i').test(scan)) {
        throw new BadRequestException(`Access to schema "${schemaName}" is not allowed`)
      }
    }

    // ── 6. Row-locking clauses ───────────────────────────────────────────────
    if (/\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i.test(scan)) {
      throw new BadRequestException('Row locking clauses are not allowed')
    }

    // ── 7. LIMIT ALL ────────────────────────────────────────────────────────
    if (/\blimit\s+all\b/i.test(scan)) {
      throw new BadRequestException('LIMIT ALL is not allowed — specify a numeric limit')
    }

    // ── 8. Table whitelist ───────────────────────────────────────────────────
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
    // Mark as capped only when the model omitted a LIMIT clause entirely
    const capped = !/\blimit\b/i.test(scan)

    return {
      sql: `SELECT * FROM (\n${original}\n) AS _ai_result LIMIT ${ROW_CAP}`,
      original,
      rowCap: ROW_CAP,
      capped,
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Extracts table names referenced after FROM / JOIN keywords.
   * CTE names are excluded from the whitelist check (they are not real tables).
   */
  private extractTableReferences(sql: string): string[] {
    const cteNames = new Set<string>()
    const cteRegex = /(?:\bwith\b|,)\s*([a-z_][a-z0-9_]*)\s+as\s*\(/gi
    let cteMatch: RegExpExecArray | null
    while ((cteMatch = cteRegex.exec(sql)) !== null) {
      cteNames.add(cteMatch[1].toLowerCase())
    }

    const refs = new Set<string>()
    const regex =
      /\b(?:from|join)\s+((?:"[^"]+"|[a-z_][a-z0-9_$]*)(?:\s*\.\s*(?:"[^"]+"|[a-z_][a-z0-9_$]*))?)/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(sql)) !== null) {
      const raw   = match[1].replace(/\s+/g, '')
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
   * Replaces string literals, dollar-quoted strings and comments with neutral
   * placeholders so keyword scanning cannot be bypassed via quoted content.
   * When blankIdentifiers=true double-quoted identifiers are also replaced,
   * which is necessary for the keyword scan pass.
   */
  private stripLiterals(sql: string, opts: { blankIdentifiers: boolean }): string {
    let out = ''
    let i   = 0

    while (i < sql.length) {
      const ch   = sql[i]
      const next = sql[i + 1]

      // -- line comment
      if (ch === '-' && next === '-') {
        while (i < sql.length && sql[i] !== '\n') i++
        out += ' '
        continue
      }

      // /* block comment */
      if (ch === '/' && next === '*') {
        i += 2
        while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
        i += 2
        out += ' '
        continue
      }

      // ' single-quoted string
      if (ch === "'") {
        i++
        while (i < sql.length) {
          if (sql[i] === "'" && sql[i + 1] === "'") { i += 2; continue }
          if (sql[i] === "'") { i++; break }
          i++
        }
        out += "''"
        continue
      }

      // $tag$ dollar-quoted string
      if (ch === '$') {
        const tagMatch = sql.slice(i).match(/^\$[\w$]*\$/)
        if (tagMatch) {
          const tag = tagMatch[0]
          const end = sql.indexOf(tag, i + tag.length)
          i = end === -1 ? sql.length : end + tag.length
          out += "''"
          continue
        }
      }

      // " double-quoted identifier — blank out for keyword scan, preserve for table extraction
      if (ch === '"' && opts.blankIdentifiers) {
        i++
        while (i < sql.length) {
          if (sql[i] === '"' && sql[i + 1] === '"') { i += 2; continue }
          if (sql[i] === '"') { i++; break }
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
