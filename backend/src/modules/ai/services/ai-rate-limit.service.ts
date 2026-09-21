import { Injectable, Logger } from '@nestjs/common'
import { Request } from 'express'

export interface RateLimitRule {
  perMinute: number
  perDay: number
}

export interface RateLimitVerdict {
  allowed: boolean
  retryAfterSeconds?: number
  reason?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * In-memory sliding-window limiter. Protects the paid OpenRouter calls on public
 * endpoints and keeps a global daily budget so a viral surge cannot run up costs.
 */
@Injectable()
export class AiRateLimitService {
  private readonly logger = new Logger(AiRateLimitService.name)
  private readonly hits = new Map<string, number[]>()
  private readonly daily = new Map<string, { count: number; dayStart: number }>()
  private lastSweep = Date.now()

  check(bucket: string, key: string, rule: RateLimitRule): RateLimitVerdict {
    this.sweepIfStale()

    const now = Date.now()
    const composite = `${bucket}:${key}`

    const recent = (this.hits.get(composite) ?? []).filter((ts) => now - ts < 60_000)
    if (recent.length >= rule.perMinute) {
      const oldest = recent[0]
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((60_000 - (now - oldest)) / 1000)),
        reason: 'Too many requests — please slow down.',
      }
    }

    const day = this.daily.get(bucket) ?? { count: 0, dayStart: now }
    if (now - day.dayStart >= DAY_MS) {
      day.count = 0
      day.dayStart = now
    }
    if (day.count >= rule.perDay) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((DAY_MS - (now - day.dayStart)) / 1000)),
        reason: 'Daily AI usage limit reached for the whole platform. Try again tomorrow.',
      }
    }

    recent.push(now)
    this.hits.set(composite, recent)
    day.count += 1
    this.daily.set(bucket, day)

    return { allowed: true }
  }

  clientKey(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
    const ip = raw?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown'
    return ip
  }

  /** Drops idle buckets so the maps cannot grow without bound. */
  private sweepIfStale() {
    const now = Date.now()
    if (now - this.lastSweep < 10 * 60 * 1000) return
    this.lastSweep = now

    for (const [key, timestamps] of this.hits) {
      const recent = timestamps.filter((ts) => now - ts < 60_000)
      if (recent.length === 0) this.hits.delete(key)
      else this.hits.set(key, recent)
    }
    for (const [key, entry] of this.daily) {
      if (now - entry.dayStart >= DAY_MS) this.daily.delete(key)
    }
    this.logger.debug(`Rate-limit sweep done (${this.hits.size} active buckets)`)
  }
}
