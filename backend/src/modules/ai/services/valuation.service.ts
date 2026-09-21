import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { OpenRouterService } from './openrouter.service'
import { VALUATION_SYSTEM_PROMPT } from '../ai.prompts'
import { toNumber } from './serialize.util'

export interface ValuationRequest {
  gameName: string
  category?: string
  rank?: string
  level?: number
  platform?: string
  region?: string
  loginMethod?: string
  skinsCount?: number
  price?: number
}

export interface ValuationFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  note: string
}

export interface ComparableStats {
  count: number
  currency: string
  min: number
  max: number
  median: number
  p25: number
  p75: number
  mean: number
  soldCount: number
  avgDaysToSell: number | null
}

export interface ValuationResult {
  /** aiMessages.id of the stored answer — pass it back with feedback. */
  requestId: string | null
  estimatedValue: number
  currency: string
  rangeLow: number
  rangeHigh: number
  confidence: 'low' | 'medium' | 'high'
  factors: ValuationFactor[]
  advice: string
  demandNote: string
  source: 'ai' | 'statistics'
  stats: ComparableStats
}

interface ComparableRow {
  price: any
  currency: string
  rank: string | null
  level: number | null
  platform: string | null
  region: string | null
  loginMethod: string | null
  status: string
  isSold: boolean
  title: string
  skins: any
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

const MAX_COMPARABLES = 60
const AI_SAMPLE_SIZE = 22
const MIN_TIGHT_MATCHES = 5

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function countItems(value: any): number | null {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === 'object') return Object.keys(value).length
  return null
}

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly openrouter: OpenRouterService,
  ) {}

  async estimate(input: ValuationRequest): Promise<ValuationResult> {
    const comparables = await this.findComparables(input)
    const stats = comparables.length ? this.computeStats(comparables) : null

    if (!stats && !this.openrouter.isEnabled()) {
      throw new ServiceUnavailableException(
        'Not enough market data for this game yet and the AI valuation engine is offline. ' +
          'Please describe the account to our support team instead.',
      )
    }

    let result: ValuationResult | null = null
    if (this.openrouter.isEnabled()) {
      try {
        result = await this.askModel(input, comparables, stats)
      } catch (err: any) {
        this.logger.warn(`Valuation model call failed: ${err?.message || err}`)
      }
    }

    if (!result) {
      if (!stats) {
        throw new ServiceUnavailableException(
          'The valuation engine is temporarily unavailable. Please try again in a moment.',
        )
      }
      result = this.statisticalFallback(input, stats)
    } else if (stats) {
      result = this.reconcile(result, stats)
    }

    result.requestId = await this.persist(input, comparables, stats, result)
    return result
  }

  async recordFeedback(dto: {
    requestId: string
    verdict: 'helpful' | 'too_low' | 'too_high'
  }): Promise<{ recorded: boolean }> {
    const message = await this.prisma.aiMessages.findUnique({
      where: { id: dto.requestId },
      include: { conversation: { select: { scope: true, title: true } } },
    })

    if (!message || message.conversation?.scope !== 'valuation') {
      return { recorded: false }
    }

    let parsed: any = null
    try {
      parsed = JSON.parse(message.content)
    } catch {
      parsed = null
    }

    await this.prisma.valuationFeedback.upsert({
      where: { requestId: dto.requestId },
      create: {
        requestId: dto.requestId,
        gameName: String(parsed?.gameName ?? message.conversation.title ?? 'unknown').slice(0, 120),
        verdict: dto.verdict,
        estimatedValue: parsed?.estimatedValue ?? null,
        currency: parsed?.currency ? String(parsed.currency).slice(0, 8) : null,
      },
      update: { verdict: dto.verdict },
    })

    return { recorded: true }
  }

  // ─── Comparables ───────────────────────────────────────────────────────────

  private async findComparables(input: ValuationRequest): Promise<ComparableRow[]> {
    const base = {
      price: { gt: 0 },
      status: { in: ['ACTIVE', 'SOLD'] as any },
      gameName: { equals: input.gameName, mode: 'insensitive' as const },
      seller: { deletedAt: null },
    }

    const tight: any = { ...base }
    if (input.rank) tight.rank = { equals: input.rank, mode: 'insensitive' }
    if (input.platform) tight.platform = { equals: input.platform, mode: 'insensitive' }

    const select = {
      price: true,
      currency: true,
      rank: true,
      level: true,
      platform: true,
      region: true,
      loginMethod: true,
      status: true,
      isSold: true,
      title: true,
      skins: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    }

    let rows = await this.prisma.listings.findMany({
      where: tight,
      select,
      orderBy: { createdAt: 'desc' },
      take: MAX_COMPARABLES,
    })

    if (rows.length < MIN_TIGHT_MATCHES) {
      rows = await this.prisma.listings.findMany({
        where: base,
        select,
        orderBy: { createdAt: 'desc' },
        take: MAX_COMPARABLES,
      })
    }

    return this.homogenizeCurrency(rows as unknown as ComparableRow[])
  }

  /**
   * Listings may be priced in different currencies. Mixing them would produce
   * nonsense statistics, so we keep only the dominant currency bucket.
   */
  private homogenizeCurrency(rows: ComparableRow[]): ComparableRow[] {
    if (rows.length <= 1) return rows
    const buckets = new Map<string, ComparableRow[]>()
    for (const row of rows) {
      const currency = (row.currency || 'NGN').toUpperCase()
      const bucket = buckets.get(currency) ?? []
      bucket.push(row)
      buckets.set(currency, bucket)
    }
    let best: ComparableRow[] = []
    for (const bucket of buckets.values()) {
      if (bucket.length > best.length) best = bucket
    }
    return best
  }

  private computeStats(rows: ComparableRow[]): ComparableStats {
    const currency = (rows[0]?.currency || 'NGN').toUpperCase()
    const prices = rows
      .map((r) => toNumber(r.price))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b)

    const sold = rows.filter((r) => r.isSold || r.status === 'SOLD')
    const sellDurations = sold
      .map((r) => (r.updatedAt.getTime() - r.createdAt.getTime()) / 86_400_000)
      .filter((d) => Number.isFinite(d) && d > 0 && d < 365)

    return {
      count: prices.length,
      currency,
      min: round2(prices[0] ?? 0),
      max: round2(prices[prices.length - 1] ?? 0),
      median: round2(percentile(prices, 0.5)),
      p25: round2(percentile(prices, 0.25)),
      p75: round2(percentile(prices, 0.75)),
      mean: round2(prices.reduce((a, b) => a + b, 0) / (prices.length || 1)),
      soldCount: sold.length,
      avgDaysToSell: sellDurations.length
        ? Math.round((sellDurations.reduce((a, b) => a + b, 0) / sellDurations.length) * 10) / 10
        : null,
    }
  }

  // ─── AI valuation ──────────────────────────────────────────────────────────

  private async askModel(
    input: ValuationRequest,
    comparables: ComparableRow[],
    stats: ComparableStats | null,
  ): Promise<ValuationResult | null> {
    const sample = comparables.slice(0, AI_SAMPLE_SIZE).map((row) => ({
      title: row.title.slice(0, 90),
      price: round2(toNumber(row.price)),
      currency: row.currency,
      rank: row.rank,
      level: row.level,
      platform: row.platform,
      region: row.region,
      loginMethod: row.loginMethod,
      skins: countItems(row.skins),
      status: row.status,
      views: row.viewCount,
      listedDaysAgo: Math.max(0, Math.round((Date.now() - row.createdAt.getTime()) / 86_400_000)),
    }))

    const payload = {
      subject: {
        gameName: input.gameName,
        category: input.category ?? null,
        rank: input.rank ?? null,
        level: input.level ?? null,
        platform: input.platform ?? null,
        region: input.region ?? null,
        loginMethod: input.loginMethod ?? null,
        skinsCount: input.skinsCount ?? null,
        askingPrice: input.price ?? null,
      },
      comparableStatistics: stats,
      comparables: sample,
    }

    const completion = await this.openrouter.chat({
      messages: [
        { role: 'system', content: VALUATION_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Value this account using the data below. Respond with the JSON object only.\n\n' +
            JSON.stringify(payload),
        },
      ],
      model: this.openrouter.calculatorModel,
      temperature: 0.2,
      maxTokens: 900,
    })

    const parsed = this.extractJson(completion.content)
    if (!parsed) {
      this.logger.warn('Valuation model returned unparseable output')
      return null
    }

    return this.normalizeAiResult(parsed, stats, comparables.length)
  }

  private extractJson(text: string): any | null {
    if (!text) return null
    let t = text.trim()
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    const start = t.indexOf('{')
    const end = t.lastIndexOf('}')
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(t.slice(start, end + 1))
    } catch {
      return null
    }
  }

  private normalizeAiResult(
    raw: any,
    stats: ComparableStats | null,
    comparableCount: number,
  ): ValuationResult | null {
    const estimated = Number(raw?.estimatedValue)
    if (!Number.isFinite(estimated) || estimated <= 0) return null

    let low = Number(raw?.rangeLow)
    let high = Number(raw?.rangeHigh)
    if (!Number.isFinite(low) || low <= 0) low = estimated * 0.85
    if (!Number.isFinite(high) || high <= 0) high = estimated * 1.15
    low = Math.min(low, estimated)
    high = Math.max(high, estimated)
    if (high <= low) high = low * 1.15

    let confidence: ValuationResult['confidence'] =
      raw?.confidence === 'high' || raw?.confidence === 'medium' || raw?.confidence === 'low'
        ? raw.confidence
        : 'medium'

    // Thin markets cannot be high-confidence, whatever the model claims.
    if (comparableCount === 0) confidence = 'low'
    else if (comparableCount < 8 && confidence === 'high') confidence = 'medium'

    const factors: ValuationFactor[] = Array.isArray(raw?.factors)
      ? raw.factors
          .filter((f: any) => f && typeof f?.name === 'string')
          .slice(0, 8)
          .map((f: any) => ({
            name: String(f.name).slice(0, 80),
            impact: f.impact === 'positive' || f.impact === 'negative' ? f.impact : 'neutral',
            note: String(f.note ?? '').slice(0, 220),
          }))
      : []

    return {
      requestId: null,
      estimatedValue: round2(estimated),
      currency: (stats?.currency || raw?.currency || 'NGN').toString().toUpperCase().slice(0, 8),
      rangeLow: round2(low),
      rangeHigh: round2(high),
      confidence,
      factors,
      advice: String(raw?.advice ?? '').slice(0, 400) || 'Price near the middle of the range and adjust after a week.',
      demandNote: String(raw?.demandNote ?? '').slice(0, 240) || 'Demand for this game is steady.',
      source: 'ai',
      stats: stats ?? {
        count: 0,
        currency: (raw?.currency || 'NGN').toString().toUpperCase().slice(0, 8),
        min: 0,
        max: 0,
        median: 0,
        p25: 0,
        p75: 0,
        mean: 0,
        soldCount: 0,
        avgDaysToSell: null,
      },
    }
  }

  /** Keeps AI output honest when comparables disagree wildly. */
  private reconcile(result: ValuationResult, stats: ComparableStats): ValuationResult {
    const median = stats.median
    let estimated = result.estimatedValue
    if (median > 0) {
      const ratio = estimated / median
      if (ratio > 4 || ratio < 0.25) {
        this.logger.warn(
          `Valuation drift: ai=${estimated} median=${median} — clamping toward market median`,
        )
        estimated = ratio > 4 ? median * 2 : median * 0.5
      }
    }
    const low = Math.min(result.rangeLow, estimated)
    const high = Math.max(result.rangeHigh, estimated)
    return {
      ...result,
      estimatedValue: round2(estimated),
      rangeLow: round2(low),
      rangeHigh: round2(high),
      currency: stats.currency || result.currency,
      stats,
    }
  }

  // ─── Statistical fallback ──────────────────────────────────────────────────

  private statisticalFallback(input: ValuationRequest, stats: ComparableStats): ValuationResult {
    const base = stats.median
    const thin = stats.count < 8
    const low = thin ? Math.min(stats.min || base * 0.6, base * 0.7) : stats.p25
    const high = thin ? Math.max(stats.max || base * 1.5, base * 1.3) : stats.p75

    const factors: ValuationFactor[] = [
      {
        name: 'Market median',
        impact: 'neutral',
        note: `Median of ${stats.count} comparable ${input.gameName} listings is ${stats.median} ${stats.currency}.`,
      },
    ]
    if (stats.count < 8) {
      factors.push({
        name: 'Thin comparable set',
        impact: 'negative',
        note: `Only ${stats.count} comparable listings found — the range is widened to stay realistic.`,
      })
    }
    if (stats.avgDaysToSell !== null) {
      factors.push({
        name: 'Time to sell',
        impact: stats.avgDaysToSell <= 7 ? 'positive' : 'neutral',
        note: `Comparable listings sold in about ${stats.avgDaysToSell} days on average.`,
      })
    }

    return {
      requestId: null,
      estimatedValue: round2(base),
      currency: stats.currency,
      rangeLow: round2(low),
      rangeHigh: round2(high),
      confidence: stats.count >= 15 ? 'medium' : 'low',
      factors,
      advice: `List near ${round2(base)} ${stats.currency} and revisit the price after a week if there are no serious enquiries.`,
      demandNote: stats.avgDaysToSell !== null
        ? `Similar accounts sold in roughly ${stats.avgDaysToSell} days.`
        : 'Not enough completed sales yet to estimate demand reliably.',
      source: 'statistics',
      stats,
    }
  }

  // ─── Persistence ───────────────────────────────────────────────────────────

  private async persist(
    input: ValuationRequest,
    comparables: ComparableRow[],
    stats: ComparableStats | null,
    result: ValuationResult,
  ): Promise<string | null> {
    try {
      const conversation = await this.prisma.aiConversations.create({
        data: {
          ownerKey: 'public',
          scope: 'valuation',
          title: `Value check — ${input.gameName}`.slice(0, 80),
        },
      })

      await this.prisma.aiMessages.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: JSON.stringify({ ...input, comparableCount: comparables.length }),
        },
      })

      const answer = await this.prisma.aiMessages.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: JSON.stringify({ ...result, gameName: input.gameName, stats }),
          model: this.openrouter.calculatorModel,
        },
      })

      return answer.id
    } catch (err: any) {
      this.logger.warn(`Could not persist valuation: ${err?.message || err}`)
      return null
    }
  }
}
