/**
 * FeaturedRotationService
 *
 * Runs the algorithmic featured-listing selection on a configurable interval.
 * Uses Node's native setInterval (no extra @nestjs/schedule dependency needed).
 *
 * Rotation interval is controlled by the env variable:
 *   FEATURED_ROTATION_HOURS  (default: 24)
 *
 * The algorithm scores every ACTIVE, non-sold listing on four dimensions:
 *   - Seller average rating      (40 pts)
 *   - Delivery success rate      (20 pts)
 *   - Recent sales count         (20 pts, capped at 50 sales → 1.0)
 *   - Competitive pricing vs.    (20 pts)
 *     the game's median price
 *
 * The top N listings (default 8) are flagged as isFeatured=true, featuredByAlgo=true.
 * All previous algo-selected listings are cleared first.
 * Manually featured listings (featuredByAlgo=false) are never touched.
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

const DEFAULT_ROTATION_HOURS = 24
const DEFAULT_FEATURED_COUNT = 8

@Injectable()
export class FeaturedRotationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeaturedRotationService.name)
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const hours = parseInt(process.env.FEATURED_ROTATION_HOURS ?? '', 10)
    const intervalMs = (Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_ROTATION_HOURS) * 60 * 60 * 1000

    this.logger.log(
      `Featured rotation scheduled every ${intervalMs / 3_600_000}h` +
      ` (${intervalMs / 1_000}s). Running initial selection now.`,
    )

    // Run once immediately on startup, then on the interval
    this.runRotation().catch(err =>
      this.logger.error('Initial featured rotation failed', err),
    )

    this.timer = setInterval(() => {
      this.runRotation().catch(err =>
        this.logger.error('Scheduled featured rotation failed', err),
      )
    }, intervalMs)
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * Core selection algorithm — also called directly by the admin "Run Now" button
   * via AdminService.runAlgorithmicFeaturedSelection().
   */
  async runRotation(featuredCount = DEFAULT_FEATURED_COUNT): Promise<{
    selected: number
    cleared: number
    ids: string[]
  }> {
    this.logger.log(`Running featured rotation (top ${featuredCount})`)

    // ── 1. Fetch all ACTIVE, unsold candidates ──────────────────────────────
    const candidates = await this.prisma.listings.findMany({
      where: { status: 'ACTIVE', isSold: false },
      select: {
        id: true,
        gameName: true,
        price: true,
        salesCount: true,
        seller: {
          select: {
            averageRating: true,
            deliverySuccessRate: true,
          },
        },
      },
    })

    if (candidates.length === 0) {
      this.logger.warn('No active listings found — skipping rotation')
      return { selected: 0, cleared: 0, ids: [] }
    }

    // ── 2. Compute per-game median price ────────────────────────────────────
    const pricesByGame: Record<string, number[]> = {}
    for (const l of candidates) {
      const game = l.gameName
      if (!pricesByGame[game]) pricesByGame[game] = []
      pricesByGame[game].push(Number(l.price))
    }
    const medianByGame: Record<string, number> = {}
    for (const [game, prices] of Object.entries(pricesByGame)) {
      const sorted = [...prices].sort((a, b) => a - b)
      medianByGame[game] = sorted[Math.floor(sorted.length / 2)]
    }

    // ── 3. Score ─────────────────────────────────────────────────────────────
    const scored = candidates.map((l) => {
      const rating      = (l.seller as any)?.averageRating      ?? 0
      const delivRate   = (l.seller as any)?.deliverySuccessRate ?? 100
      const sales       = l.salesCount ?? 0
      const median      = medianByGame[l.gameName] ?? Number(l.price)
      const priceRatio  = median > 0 ? Number(l.price) / median : 1
      // A ratio close to 0.85 of median = most competitive
      const priceScore  = Math.max(0, 1 - Math.abs(priceRatio - 0.85))

      const score =
        (rating / 5)              * 40 +
        (delivRate / 100)          * 20 +
        Math.min(sales / 50, 1)   * 20 +
        priceScore                 * 20

      return { id: l.id, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const selectedIds = scored.slice(0, featuredCount).map((s) => s.id)

    // ── 4. Clear previously algo-selected listings ──────────────────────────
    const cleared = await this.prisma.listings.updateMany({
      where: { featuredByAlgo: true },
      data:  { isFeatured: false, featuredByAlgo: false },
    })

    // ── 5. Feature the new selection ────────────────────────────────────────
    await this.prisma.listings.updateMany({
      where: { id: { in: selectedIds } },
      data:  { isFeatured: true, featuredByAlgo: true, featuredAt: new Date() },
    })

    this.logger.log(
      `Rotation complete: ${selectedIds.length} featured, ${cleared.count} cleared`,
    )

    return { selected: selectedIds.length, cleared: cleared.count, ids: selectedIds }
  }
}
