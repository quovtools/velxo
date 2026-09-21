import { Injectable, Logger } from '@nestjs/common'
import { AdminService } from '@/modules/admin/admin.service'
import { PrismaService } from '@/common/services/prisma.service'
import { OpenRouterToolDefinition } from './openrouter.service'
import { SqlExecutorService } from './sql-executor.service'
import { toJsonSafe, toNumber } from './serialize.util'

export interface AiToolContext {
  actorId: string
  conversationId: string
}

export interface AiToolResult {
  ok: boolean
  summary: string
  data?: any
}

export interface AiTool {
  name: string
  description: string
  parameters: Record<string, any>
  /** Money-moving or destructive — must be confirmed by the admin before running. */
  requiresConfirmation?: boolean
  execute: (args: any, ctx: AiToolContext) => Promise<AiToolResult>
  /** Human-readable description of exactly what will happen, shown in the confirm dialog. */
  describe?: (args: any) => Promise<string>
}

const obj = (properties: Record<string, any>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})
const str = (description: string) => ({ type: 'string', description })
const num = (description: string) => ({ type: 'number', description })
const bool = (description: string) => ({ type: 'boolean', description })

const MAX_TOOL_ROWS = 50

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name)
  private readonly tools: Map<string, AiTool>

  constructor(
    private readonly admin: AdminService,
    private readonly prisma: PrismaService,
    private readonly sqlExecutor: SqlExecutorService,
  ) {
    this.tools = new Map(this.buildTools().map((tool) => [tool.name, tool]))
  }

  getDefinitions(): OpenRouterToolDefinition[] {
    return [...this.tools.values()].map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))
  }

  get(name: string): AiTool | undefined {
    return this.tools.get(name)
  }

  requiresConfirmation(name: string): boolean {
    return Boolean(this.tools.get(name)?.requiresConfirmation)
  }

  async describe(name: string, args: any): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool) return `${name}(${JSON.stringify(args)})`
    if (tool.describe) {
      try {
        return await tool.describe(args)
      } catch (err: any) {
        this.logger.warn(`describe(${name}) failed: ${err?.message || err}`)
      }
    }
    return `${tool.name} with arguments ${JSON.stringify(args)}`
  }

  /** Executes a tool. Business failures come back as { ok: false } so the model can adapt. */
  async execute(name: string, args: any, ctx: AiToolContext): Promise<AiToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { ok: false, summary: `Unknown tool "${name}".` }
    }
    const started = Date.now()
    try {
      const result = await tool.execute(args ?? {}, ctx)
      this.logger.log(`tool=${name} ok=${result.ok} ${Date.now() - started}ms`)
      return { ok: result.ok, summary: result.summary, data: result.data ?? result.summary }
    } catch (err: any) {
      const message = err?.response?.message || err?.message || String(err)
      this.logger.warn(`tool=${name} failed: ${message}`)
      return { ok: false, summary: `${name} failed: ${message}` }
    }
  }

  // ─── Tool catalogue ────────────────────────────────────────────────────────

  private buildTools(): AiTool[] {
    return [
      ...this.readTools(),
      ...this.actionTools(),
    ]
  }

  // ─────────────────────────────── READ TOOLS ───────────────────────────────

  private readTools(): AiTool[] {
    return [
      {
        name: 'run_sql_query',
        description:
          'Run a read-only SQL SELECT against the live PostgreSQL database. Use this for any question the other ' +
          'tools do not cover. Rules: a single SELECT (or WITH … SELECT) statement only; all identifiers must be ' +
          'double-quoted exactly as listed in the schema; always add your own LIMIT (the platform also caps results ' +
          `at ${MAX_TOOL_ROWS * 4} rows); users table rows are soft-deleted — add "deletedAt" IS NULL when counting users.`,
        parameters: obj(
          {
            sql: str('The SELECT statement to execute.'),
            purpose: str('One short sentence explaining what this query answers (for the audit trail).'),
          },
          ['sql', 'purpose'],
        ),
        async execute(args) {
          const result = await this.sqlExecutor.runReadOnly(String(args.sql))
          return {
            ok: true,
            summary:
              `${result.rowCount} row(s) returned` +
              (result.capped ? ` (result set was capped at ${result.rowCap} rows)` : '') +
              (result.rowCount === 0 ? ' — the query returned no data.' : '.'),
            data: {
              columns: result.columns,
              rows: result.rows,
              rowCount: result.rowCount,
              capped: result.capped,
              executedSql: result.sql,
            },
          }
        },
      },

      {
        name: 'get_platform_overview',
        description:
          'Headline platform KPIs: user/seller/listing/order counts and money totals. Start here for any strategy question.',
        parameters: obj({}),
        async execute(_args, ctx) {
          const stats: any = await this.admin.getDashboardStats()
          return {
            ok: true,
            summary: 'Platform KPIs loaded.',
            data: toJsonSafe(stats),
          }
        },
      },

      {
        name: 'get_revenue_report',
        description:
          'Revenue, commissions, order counts and average order value for a date range. Defaults to the last 30 days.',
        parameters: obj({
          startDate: str('Inclusive start date, YYYY-MM-DD.'),
          endDate: str('Inclusive end date, YYYY-MM-DD.'),
          days: num('Alternative to startDate: number of days back from today (e.g. 7, 30, 90).'),
        }),
        async execute(args) {
          const end = args.endDate ? new Date(`${args.endDate}T23:59:59.999Z`) : new Date()
          const days = Number(args.days) || 30
          const start = args.startDate
            ? new Date(`${args.startDate}T00:00:00.000Z`)
            : new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
          const report: any = await this.admin.getRevenueAnalytics(start, end)
          return {
            ok: true,
            summary: `Revenue report for ${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}.`,
            data: toJsonSafe(report),
          }
        },
      },

      {
        name: 'list_pending_moderation',
        description: 'Listings waiting for approval, oldest first — the moderation backlog.',
        parameters: obj({ limit: num('Max rows (default 20, max 50).') }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 20, MAX_TOOL_ROWS)
          const where = { status: 'PENDING_APPROVAL' as any }
          const [count, listings] = await Promise.all([
            this.prisma.listings.count({ where }),
            this.prisma.listings.findMany({
              where,
              orderBy: { createdAt: 'asc' },
              take,
              select: {
                id: true,
                title: true,
                gameName: true,
                price: true,
                currency: true,
                createdAt: true,
                seller: { select: { id: true, storeName: true, isVerified: true, kycStatus: true } },
              },
            }),
          ])
          return {
            ok: true,
            summary: `${count} listing(s) awaiting approval.`,
            data: { pendingCount: count, listings: toJsonSafe(listings) },
          }
        },
      },

      {
        name: 'search_listings',
        description:
          'Search listings by title text, game, status or seller. Useful for pricing comparisons and stock checks.',
        parameters: obj({
          query: str('Free-text match against the listing title.'),
          gameName: str('Exact game name, e.g. "Valorant".'),
          status: str('Listing status: DRAFT, PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED, SOLD, EXPIRED.'),
          sellerId: str('Filter by seller id.'),
          limit: num('Max rows (default 20, max 50).'),
        }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 20, MAX_TOOL_ROWS)
          const where: any = {}
          if (args.query) where.title = { contains: String(args.query), mode: 'insensitive' }
          if (args.gameName) where.gameName = { equals: String(args.gameName), mode: 'insensitive' }
          if (args.status) where.status = args.status
          if (args.sellerId) where.sellerId = args.sellerId

          const [count, listings] = await Promise.all([
            this.prisma.listings.count({ where }),
            this.prisma.listings.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              take,
              select: {
                id: true,
                title: true,
                gameName: true,
                status: true,
                price: true,
                currency: true,
                region: true,
                platform: true,
                rank: true,
                level: true,
                viewCount: true,
                salesCount: true,
                isFeatured: true,
                createdAt: true,
                seller: { select: { id: true, storeName: true, isVerified: true } },
              },
            }),
          ])
          return {
            ok: true,
            summary: `${count} matching listing(s); showing ${listings.length}.`,
            data: { matchCount: count, listings: toJsonSafe(listings) },
          }
        },
      },

      {
        name: 'list_recent_orders',
        description: 'Recent orders with buyer/seller, status, amounts and escrow progress.',
        parameters: obj({
          status: str(
            'Order status filter: PENDING, PAID, IN_PROGRESS, DELIVERED, COMPLETED, CANCELLED, REFUNDED, DISPUTED.',
          ),
          days: num('Only orders created within the last N days (default 14).'),
          minAmount: num('Only orders with totalAmount ≥ this value.'),
          limit: num('Max rows (default 20, max 50).'),
        }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 20, MAX_TOOL_ROWS)
          const days = Number(args.days) || 14
          const where: any = { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
          if (args.status) where.status = args.status
          if (args.minAmount) where.totalAmount = { gte: Number(args.minAmount) }

          const [count, orders] = await Promise.all([
            this.prisma.orders.count({ where }),
            this.prisma.orders.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              take,
              select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                commissionAmount: true,
                sellerPayout: true,
                currency: true,
                createdAt: true,
                paidAt: true,
                buyer: { select: { id: true, email: true, firstName: true, lastName: true } },
                seller: { select: { id: true, storeName: true } },
                _count: { select: { orderItems: true, disputes: true } },
              },
            }),
          ])
          return {
            ok: true,
            summary: `${count} order(s) in the last ${days} day(s); showing ${orders.length}.`,
            data: { matchCount: count, orders: toJsonSafe(orders) },
          }
        },
      },

      {
        name: 'list_open_disputes',
        description: 'Open and under-review disputes, oldest first, with order and amount context.',
        parameters: obj({
          status: str('Dispute status: OPEN, UNDER_REVIEW (default: both).'),
          limit: num('Max rows (default 20, max 50).'),
        }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 20, MAX_TOOL_ROWS)
          const where: any = args.status
            ? { status: args.status }
            : { status: { in: ['OPEN', 'UNDER_REVIEW'] } }

          const [count, disputes] = await Promise.all([
            this.prisma.disputes.count({ where }),
            this.prisma.disputes.findMany({
              where,
              orderBy: { createdAt: 'asc' },
              take,
              select: {
                id: true,
                status: true,
                reason: true,
                refundAmount: true,
                createdAt: true,
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    totalAmount: true,
                    currency: true,
                    buyer: { select: { email: true } },
                    seller: { select: { storeName: true } },
                  },
                },
              },
            }),
          ])

          const now = Date.now()
          return {
            ok: true,
            summary: `${count} dispute(s) needing attention.`,
            data: {
              openCount: count,
              disputes: (toJsonSafe(disputes) as any[]).map((d) => ({
                ...d,
                ageHours: Math.round((now - Date.parse(d.createdAt)) / 3_600_000),
              })),
            },
          }
        },
      },

      {
        name: 'lookup_user',
        description:
          'Look up a single user by id, email or phone. Returns role, status, wallet balance, seller profile and activity counts.',
        parameters: obj({ query: str('User id, email address or phone number.') }, ['query']),
        async execute(args) {
          const query = String(args.query).trim()
          const user: any = await this.prisma.users.findFirst({
            where: {
              OR: [
                { id: query },
                { email: { equals: query, mode: 'insensitive' } },
                { phone: query },
              ],
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isActive: true,
              isBanned: true,
              banReason: true,
              emailVerified: true,
              externalContactStrikes: true,
              createdAt: true,
              lastLoginAt: true,
              lastSeenAt: true,
              wallet: {
                select: { balance: true, lockedBalance: true, totalEarnings: true, totalWithdrawn: true, currency: true },
              },
              sellers: {
                select: {
                  id: true,
                  storeName: true,
                  isVerified: true,
                  isSuspended: true,
                  kycStatus: true,
                  sellerLevel: true,
                  totalSales: true,
                  totalRevenue: true,
                  averageRating: true,
                },
              },
              _count: { select: { buyerOrders: true, buyerRequests: true } },
            },
          })

          if (!user) {
            return { ok: false, summary: `No user found for "${query}".` }
          }
          return {
            ok: true,
            summary: `User ${user.email} (${user.role})${user.isBanned ? ' — BANNED' : ''}.`,
            data: toJsonSafe(user),
          }
        },
      },

      {
        name: 'list_top_sellers',
        description: 'Top sellers ranked by order volume and revenue for a period — the supply-side leaderboard.',
        parameters: obj({
          days: num('Look-back window in days (default 30).'),
          limit: num('Max sellers (default 10, max 50).'),
        }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 10, MAX_TOOL_ROWS)
          const days = Number(args.days) || 30
          const grouped = await this.prisma.orders.groupBy({
            by: ['sellerId'],
            where: {
              createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
              status: { in: ['PAID', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'] },
              sellerId: { not: null },
            },
            _sum: { totalAmount: true, commissionAmount: true, sellerPayout: true },
            _count: { _all: true },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take,
          })

          const sellerIds = grouped.map((g) => g.sellerId!).filter(Boolean)
          type SellerRow = {
            id: string
            storeName: string
            isVerified: boolean
            isSuspended: boolean
            sellerLevel: string
            averageRating: number
            deliverySuccessRate: number
            user: { email: string } | null
          }
          const sellers: SellerRow[] = sellerIds.length
            ? (await this.prisma.sellers.findMany({
                where: { id: { in: sellerIds } },
                select: {
                  id: true,
                  storeName: true,
                  isVerified: true,
                  isSuspended: true,
                  sellerLevel: true,
                  averageRating: true,
                  deliverySuccessRate: true,
                  user: { select: { email: true } },
                },
              })) as unknown as SellerRow[]
            : []
          const byId = new Map<string, SellerRow>(sellers.map((s) => [s.id, s]))

          return {
            ok: true,
            summary: `Top ${grouped.length} seller(s) by revenue over the last ${days} day(s).`,
            data: grouped.map((g) => ({
              sellerId: g.sellerId,
              storeName: byId.get(g.sellerId!)?.storeName ?? 'unknown',
              email: byId.get(g.sellerId!)?.user?.email ?? null,
              verified: byId.get(g.sellerId!)?.isVerified ?? false,
              suspended: byId.get(g.sellerId!)?.isSuspended ?? false,
              level: byId.get(g.sellerId!)?.sellerLevel ?? null,
              rating: byId.get(g.sellerId!)?.averageRating ?? null,
              deliverySuccessRate: byId.get(g.sellerId!)?.deliverySuccessRate ?? null,
              orderCount: g._count._all,
              grossRevenue: toNumber(g._sum.totalAmount),
              commission: toNumber(g._sum.commissionAmount),
              sellerPayout: toNumber(g._sum.sellerPayout),
            })),
          }
        },
      },

      {
        name: 'get_demand_insights',
        description:
          'Supply/demand snapshot per game: active listing counts, average asking price, total views, and open buyer requests. ' +
          'Use it for pricing, sourcing and featured-placement strategy.',
        parameters: obj({
          days: num('Window for buyer requests and views (default 30).'),
          limit: num('Max games (default 15, max 50).'),
        }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 15, MAX_TOOL_ROWS)
          const days = Number(args.days) || 30
          const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

          const [activeByGame, requestsByGame] = await Promise.all([
            this.prisma.listings.groupBy({
              by: ['gameName'],
              where: { status: 'ACTIVE' },
              _count: { _all: true },
              _avg: { price: true, viewCount: true },
              _sum: { viewCount: true, salesCount: true },
              orderBy: { _count: { gameName: 'desc' } },
              take,
            }),
            this.prisma.buyerRequests.groupBy({
              by: ['gameName'],
              where: { createdAt: { gte: since }, status: 'OPEN' },
              _count: { _all: true },
              _avg: { budgetMax: true },
              orderBy: { _count: { gameName: 'desc' } },
              take,
            }),
          ])

          return {
            ok: true,
            summary: `Demand snapshot across ${activeByGame.length} game(s); window ${days} day(s).`,
            data: {
              activeListings: activeByGame.map((g) => ({
                gameName: g.gameName,
                activeListings: g._count._all,
                averagePrice: toNumber(g._avg.price),
                averageViews: toNumber(g._avg.viewCount),
                totalViews: toNumber(g._sum.viewCount),
                totalSales: toNumber(g._sum.salesCount),
              })),
              openBuyerRequests: requestsByGame.map((g) => ({
                gameName: g.gameName,
                openRequests: g._count._all,
                averageMaxBudget: toNumber(g._avg.maxBudget),
              })),
            },
          }
        },
      },

      {
        name: 'list_pending_withdrawals',
        description: 'Payout requests waiting for approval, with seller identity and requested amount.',
        parameters: obj({ limit: num('Max rows (default 20, max 50).') }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 20, MAX_TOOL_ROWS)
          const where = { status: 'PENDING' as any }
          const [count, withdrawals] = await Promise.all([
            this.prisma.withdrawalRequests.count({ where }),
            this.prisma.withdrawalRequests.findMany({
              where,
              orderBy: { createdAt: 'asc' },
              take,
              select: {
                id: true,
                amount: true,
                netAmount: true,
                fee: true,
                currency: true,
                method: true,
                destination: true,
                createdAt: true,
                seller: {
                  select: {
                    id: true,
                    storeName: true,
                    isVerified: true,
                    kycStatus: true,
                    user: { select: { email: true } },
                  },
                },
              },
            }),
          ])
          return {
            ok: true,
            summary: `${count} payout request(s) pending.`,
            data: { pendingCount: count, withdrawals: toJsonSafe(withdrawals) },
          }
        },
      },

      {
        name: 'list_pending_kyc',
        description: 'Seller KYC submissions awaiting review.',
        parameters: obj({ limit: num('Max rows (default 20).') }),
        async execute(args) {
          const rows: any = await this.admin.getPendingKyc(Number(args.limit) || 20)
          return {
            ok: true,
            summary: `${Array.isArray(rows) ? rows.length : 0} KYC submission(s) awaiting review.`,
            data: toJsonSafe(rows),
          }
        },
      },

      {
        name: 'list_suspicious_users',
        description: 'Users flagged by the fraud engine, with their flag reasons.',
        parameters: obj({ limit: num('Max users (default 20).') }),
        async execute(args) {
          const rows: any = await this.admin.getSuspiciousUsers(Number(args.limit) || 20)
          return {
            ok: true,
            summary: `${Array.isArray(rows) ? rows.length : 0} flagged user(s).`,
            data: toJsonSafe(rows),
          }
        },
      },

      {
        name: 'list_flagged_listings',
        description: 'Listings flagged by fraud/moderation rules.',
        parameters: obj({ limit: num('Max listings (default 20).') }),
        async execute(args) {
          const rows: any = await this.admin.getFlaggedListings(Number(args.limit) || 20)
          return {
            ok: true,
            summary: `${Array.isArray(rows) ? rows.length : 0} flagged listing(s).`,
            data: toJsonSafe(rows),
          }
        },
      },

      {
        name: 'list_recent_audit_logs',
        description: 'Most recent admin actions recorded in the audit trail — useful to see what changed recently.',
        parameters: obj({
          days: num('Look-back window in days (default 7).'),
          limit: num('Max rows (default 25, max 50).'),
        }),
        async execute(args) {
          const take = Math.min(Number(args.limit) || 25, MAX_TOOL_ROWS)
          const days = Number(args.days) || 7
          const logs = await this.prisma.adminAuditLogs.findMany({
            where: { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
            orderBy: { createdAt: 'desc' },
            take,
          })
          return {
            ok: true,
            summary: `${logs.length} audit entr(y/ies) in the last ${days} day(s).`,
            data: toJsonSafe(logs),
          }
        },
      },
    ]
  }

  // ────────────────────────────── ACTION TOOLS ──────────────────────────────

  private actionTools(): AiTool[] {
    return [
      {
        name: 'approve_listing',
        description: 'Approve a pending listing so it goes live on the marketplace.',
        parameters: obj({ listingId: str('The listing id to approve.') }, ['listingId']),
        async execute(args, ctx) {
          const result: any = await this.admin.approveListing(args.listingId, ctx.actorId)
          return { ok: true, summary: `Listing ${args.listingId} approved and published.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const listing = await this.prisma.listings.findUnique({
            where: { id: args.listingId },
            select: { title: true, gameName: true, price: true, currency: true, status: true },
          })
          if (!listing) return `Approve listing ${args.listingId} (not found — will fail).`
          return `Approve listing "${listing.title}" (${listing.gameName}, ${listing.price} ${listing.currency}) — currently ${listing.status}.`
        },
      },

      {
        name: 'reject_listing',
        description: 'Reject a pending listing with a reason. The seller is notified.',
        parameters: obj(
          { listingId: str('The listing id to reject.'), reason: str('Why the listing is rejected (sent to the seller).') },
          ['listingId', 'reason'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.rejectListing(args.listingId, ctx.actorId, args.reason)
          return { ok: true, summary: `Listing ${args.listingId} rejected.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const listing = await this.prisma.listings.findUnique({
            where: { id: args.listingId },
            select: { title: true, status: true },
          })
          return `Reject listing "${listing?.title ?? args.listingId}" (currently ${listing?.status ?? 'unknown'}) — reason: ${args.reason}`
        },
      },

      {
        name: 'suspend_listing',
        description: 'Take a live listing offline (moderation action).',
        parameters: obj(
          { listingId: str('The listing id to suspend.'), reason: str('Reason recorded for the audit trail.') },
          ['listingId', 'reason'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.suspendListing(args.listingId, args.reason, ctx.actorId)
          return { ok: true, summary: `Listing ${args.listingId} suspended.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const listing = await this.prisma.listings.findUnique({
            where: { id: args.listingId },
            select: { title: true, status: true },
          })
          return `Suspend listing "${listing?.title ?? args.listingId}" (currently ${listing?.status ?? 'unknown'}) — reason: ${args.reason}`
        },
      },

      {
        name: 'feature_listing',
        description: 'Add or remove a listing from the featured (homepage) carousel.',
        parameters: obj(
          { listingId: str('The listing id.'), featured: bool('true to feature, false to unfeature.') },
          ['listingId', 'featured'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.setListingFeatured(args.listingId, Boolean(args.featured), ctx.actorId)
          return {
            ok: true,
            summary: `Listing ${args.listingId} ${args.featured ? 'featured' : 'unfeatured'}.`,
            data: toJsonSafe(result),
          }
        },
      },

      {
        name: 'feature_seller',
        description: "Feature or unfeature a seller's storefront.",
        parameters: obj(
          { sellerId: str('The seller id.'), featured: bool('true to feature, false to unfeature.') },
          ['sellerId', 'featured'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.setSellerFeatured(args.sellerId, Boolean(args.featured), ctx.actorId)
          return {
            ok: true,
            summary: `Seller ${args.sellerId} ${args.featured ? 'featured' : 'unfeatured'}.`,
            data: toJsonSafe(result),
          }
        },
      },

      {
        name: 'verify_seller',
        description: 'Grant or revoke the verified badge for a seller.',
        parameters: obj(
          { sellerId: str('The seller id.'), verified: bool('true to verify, false to revoke.') },
          ['sellerId', 'verified'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.setSellerVerified(args.sellerId, Boolean(args.verified), ctx.actorId)
          return {
            ok: true,
            summary: `Seller ${args.sellerId} ${args.verified ? 'verified' : 'unverified'}.`,
            data: toJsonSafe(result),
          }
        },
      },

      {
        name: 'approve_kyc',
        description: "Approve a seller's KYC submission, unlocking verified-tier limits.",
        parameters: obj(
          { sellerId: str('The seller id.'), tier: str('Tier to grant: VERIFIED, PRO or PREMIUM (default VERIFIED).') },
          ['sellerId'],
        ),
        async execute(args, ctx) {
          const tier = args.tier || 'VERIFIED'
          const result: any = await this.admin.approveKyc(args.sellerId, ctx.actorId, tier)
          return { ok: true, summary: `KYC approved for seller ${args.sellerId} (${tier}).`, data: toJsonSafe(result) }
        },
      },

      {
        name: 'reject_kyc',
        description: 'Reject a seller KYC submission with a reason.',
        parameters: obj(
          { sellerId: str('The seller id.'), reason: str('Why the KYC was rejected (sent to the seller).') },
          ['sellerId', 'reason'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.rejectKyc(args.sellerId, ctx.actorId, args.reason)
          return { ok: true, summary: `KYC rejected for seller ${args.sellerId}.`, data: toJsonSafe(result) }
        },
      },

      {
        name: 'verify_user_email',
        description: 'Manually mark a user email as verified (support action).',
        parameters: obj({ userId: str('The user id.') }, ['userId']),
        async execute(args, ctx) {
          const result: any = await this.admin.verifyUserEmail(args.userId, ctx.actorId)
          return { ok: true, summary: `Email verified for user ${args.userId}.`, data: toJsonSafe(result) }
        },
      },

      {
        name: 'ban_user',
        description:
          'Ban a user account. This blocks login platform-wide. Requires explicit admin confirmation before it runs.',
        parameters: obj(
          { userId: str('The user id to ban.'), reason: str('Reason shown in the audit trail and to the user.') },
          ['userId', 'reason'],
        ),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.setUserBan(args.userId, true, args.reason, ctx.actorId)
          return { ok: true, summary: `User ${args.userId} banned.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const user = await this.prisma.users.findUnique({
            where: { id: args.userId },
            select: { email: true, role: true, isBanned: true, _count: { select: { buyerOrders: true } } },
          })
          if (!user) return `Ban user ${args.userId} (not found — will fail).`
          return `Ban ${user.email} (role ${user.role}, ${user._count.buyerOrders} buyer order(s), currently ${user.isBanned ? 'ALREADY BANNED' : 'active'}) — reason: ${args.reason}`
        },
      },

      {
        name: 'unban_user',
        description: 'Lift a ban from a user account.',
        parameters: obj(
          { userId: str('The user id to unban.'), note: str('Optional note for the audit trail.') },
          ['userId'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.setUserBan(args.userId, false, args.note, ctx.actorId)
          return { ok: true, summary: `User ${args.userId} unbanned.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const user = await this.prisma.users.findUnique({
            where: { id: args.userId },
            select: { email: true, isBanned: true, banReason: true },
          })
          if (!user) return `Unban user ${args.userId} (not found — will fail).`
          return `Lift the ban on ${user.email} (ban reason was: ${user.banReason || 'not recorded'}).`
        },
      },

      {
        name: 'suspend_seller',
        description:
          'Suspend a seller account and hide their storefront. Requires explicit admin confirmation before it runs.',
        parameters: obj(
          { sellerId: str('The seller id.'), reason: str('Reason for the suspension.') },
          ['sellerId', 'reason'],
        ),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.setSellerSuspended(args.sellerId, true, args.reason, ctx.actorId)
          return { ok: true, summary: `Seller ${args.sellerId} suspended.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const seller = await this.prisma.sellers.findUnique({
            where: { id: args.sellerId },
            select: {
              storeName: true,
              isSuspended: true,
              totalSales: true,
              totalRevenue: true,
              user: { select: { email: true } },
            },
          })
          if (!seller) return `Suspend seller ${args.sellerId} (not found — will fail).`
          return `Suspend seller "${seller.storeName}" (${seller.user?.email ?? 'no email'}, ${seller.totalSales} sales, ${seller.totalRevenue} revenue, currently ${seller.isSuspended ? 'ALREADY SUSPENDED' : 'active'}) — reason: ${args.reason}`
        },
      },

      {
        name: 'unsuspend_seller',
        description: 'Lift a suspension from a seller account.',
        parameters: obj(
          { sellerId: str('The seller id.'), note: str('Optional note for the audit trail.') },
          ['sellerId'],
        ),
        async execute(args, ctx) {
          const result: any = await this.admin.setSellerSuspended(args.sellerId, false, args.note || 'Lifted by admin', ctx.actorId)
          return { ok: true, summary: `Seller ${args.sellerId} reactivated.`, data: toJsonSafe(result) }
        },
      },

      {
        name: 'cancel_order',
        description:
          'Cancel an order and release any escrow hold. Requires explicit admin confirmation before it runs.',
        parameters: obj(
          { orderId: str('The order id.'), reason: str('Cancellation reason.') },
          ['orderId', 'reason'],
        ),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.cancelOrder(args.orderId, args.reason, ctx.actorId)
          return { ok: true, summary: `Order ${args.orderId} cancelled.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const order = await this.prisma.orders.findUnique({
            where: { id: args.orderId },
            select: {
              orderNumber: true,
              status: true,
              totalAmount: true,
              currency: true,
              buyer: { select: { email: true } },
            },
          })
          if (!order) return `Cancel order ${args.orderId} (not found — will fail).`
          return `Cancel order #${order.orderNumber} (status ${order.status}, ${order.totalAmount} ${order.currency}, buyer ${order.buyer?.email ?? 'unknown'}) — reason: ${args.reason}`
        },
      },

      {
        name: 'mark_order_paid',
        description:
          'Manually mark an unpaid order as paid (used when a payment landed outside the gateway). Requires explicit admin confirmation.',
        parameters: obj(
          { orderId: str('The order id.'), note: str('Why this is being marked paid manually.') },
          ['orderId', 'note'],
        ),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.markOrderPaid(args.orderId, args.note, ctx.actorId)
          return { ok: true, summary: `Order ${args.orderId} marked as paid.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const order = await this.prisma.orders.findUnique({
            where: { id: args.orderId },
            select: { orderNumber: true, status: true, totalAmount: true, currency: true },
          })
          if (!order) return `Mark order ${args.orderId} as paid (not found — will fail).`
          return `Mark order #${order.orderNumber} (status ${order.status}, ${order.totalAmount} ${order.currency}) as PAID — note: ${args.note}`
        },
      },

      {
        name: 'refund_order',
        description:
          'Refund an order: credits the buyer wallet and marks the escrow refunded. Moves real money — requires explicit admin confirmation.',
        parameters: obj(
          {
            orderId: str('The order id to refund.'),
            amount: num('Refund amount in the order currency. Use the order total for a full refund.'),
            reason: str('Refund reason recorded in the audit trail.'),
          },
          ['orderId', 'amount', 'reason'],
        ),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.refundOrder(
            args.orderId,
            Number(args.amount),
            args.reason,
            ctx.actorId,
          )
          return {
            ok: true,
            summary: `Refunded ${args.amount} on order ${args.orderId}.`,
            data: toJsonSafe(result),
          }
        },
        async describe(args) {
          const order = await this.prisma.orders.findUnique({
            where: { id: args.orderId },
            select: {
              orderNumber: true,
              status: true,
              totalAmount: true,
              currency: true,
              refundedAt: true,
              buyer: { select: { email: true } },
            },
          })
          if (!order) return `Refund order ${args.orderId} (not found — will fail).`
          return (
            `Refund ${args.amount} ${order.currency} to ${order.buyer?.email ?? 'buyer'} for order #${order.orderNumber} ` +
            `(status ${order.status}, order total ${order.totalAmount}${order.refundedAt ? ', ALREADY REFUNDED ONCE' : ''}) — reason: ${args.reason}`
          )
        },
      },

      {
        name: 'approve_withdrawal',
        description:
          'Approve a pending payout request so it can be processed. Moves money — requires explicit admin confirmation.',
        parameters: obj({ withdrawalId: str('The withdrawal request id.') }, ['withdrawalId']),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.approveWithdrawal(args.withdrawalId, ctx.actorId)
          return { ok: true, summary: `Withdrawal ${args.withdrawalId} approved.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const w = await this.prisma.withdrawalRequests.findUnique({
            where: { id: args.withdrawalId },
            select: {
              amount: true,
              netAmount: true,
              fee: true,
              currency: true,
              method: true,
              status: true,
              seller: { select: { storeName: true, user: { select: { email: true } } } },
            },
          })
          if (!w) return `Approve withdrawal ${args.withdrawalId} (not found — will fail).`
          return `Approve payout of ${w.netAmount} ${w.currency} (fee ${w.fee}) via ${w.method} to seller "${w.seller?.storeName}" (${w.seller?.user?.email ?? 'no email'}) — request status ${w.status}.`
        },
      },

      {
        name: 'reject_withdrawal',
        description:
          'Reject a pending payout request, returning funds to the seller balance. Requires explicit admin confirmation.',
        parameters: obj(
          { withdrawalId: str('The withdrawal request id.'), reason: str('Why the payout is rejected.') },
          ['withdrawalId', 'reason'],
        ),
        requiresConfirmation: true,
        async execute(args, ctx) {
          const result: any = await this.admin.rejectWithdrawal(args.withdrawalId, args.reason, ctx.actorId)
          return { ok: true, summary: `Withdrawal ${args.withdrawalId} rejected.`, data: toJsonSafe(result) }
        },
        async describe(args) {
          const w = await this.prisma.withdrawalRequests.findUnique({
            where: { id: args.withdrawalId },
            select: {
              amount: true,
              netAmount: true,
              currency: true,
              status: true,
              seller: { select: { storeName: true, user: { select: { email: true } } } },
            },
          })
          if (!w) return `Reject withdrawal ${args.withdrawalId} (not found — will fail).`
          return `Reject payout of ${w.netAmount} ${w.currency} for seller "${w.seller?.storeName}" (${w.seller?.user?.email ?? 'no email'}) — reason: ${args.reason}`
        },
      },
    ]
  }
}
