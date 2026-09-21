const DEFAULT_MAX_STRING = 500

/** Converts Prisma/PostgreSQL values (Decimal, BigInt, Date, Buffer) into JSON-safe primitives. */
export function toJsonSafe(value: any, maxStringLength = DEFAULT_MAX_STRING): any {
  if (value === null || value === undefined) return null
  if (typeof value === 'bigint') {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString()
  }
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return `<binary ${value.length} bytes>`
  if (typeof value === 'string') {
    return value.length > maxStringLength ? `${value.slice(0, maxStringLength)}… [truncated]` : value
  }
  if (typeof value !== 'object') return value

  if (typeof value.toNumber === 'function') {
    try {
      return value.toNumber()
    } catch {
      return String(value)
    }
  }
  if (Array.isArray(value)) return value.map((v) => toJsonSafe(v, maxStringLength))

  const out: Record<string, any> = {}
  for (const [key, val] of Object.entries(value)) {
    out[key] = toJsonSafe(val, maxStringLength)
  }
  return out
}

/** Numbers a Decimal-ish value without losing precision for display. */
export function toNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    try {
      return value.toNumber()
    } catch {
      return Number(String(value)) || 0
    }
  }
  return Number(value) || 0
}
