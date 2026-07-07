import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { nanoid } from 'nanoid'

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name)
  constructor(private prisma: PrismaService) {}

  // Get or create referral record for a user
  async getMyReferral(userId: string) {
    let referral = await this.prisma.affiliateReferrals.findFirst({ where: { referrerId: userId, referredUserId: null } })
    if (!referral) {
      const code = 'VLX-' + nanoid(8).toUpperCase()
      referral = await this.prisma.affiliateReferrals.create({
        data: { referrerId: userId, referralCode: code, status: 'ACTIVE' },
      })
    }
    return referral
  }

  // Track a click on a referral link
  async trackClick(code: string) {
    return this.prisma.affiliateReferrals.updateMany({
      where: { referralCode: code },
      data: { clickCount: { increment: 1 } },
    })
  }

  // Register a referred user
  async registerReferral(code: string, newUserId: string) {
    const referral = await this.prisma.affiliateReferrals.findFirst({
      where: { referralCode: code, referredUserId: null },
    })
    if (!referral) return null

    return this.prisma.affiliateReferrals.update({
      where: { id: referral.id },
      data: {
        referredUserId: newUserId,
        signupCount: { increment: 1 },
        status: 'CONVERTED',
      },
    })
  }

  // Credit affiliate commission when a referred user completes a trade
  async creditCommission(referredUserId: string, tradeAmount: number) {
    const referral = await this.prisma.affiliateReferrals.findFirst({
      where: { referredUserId },
    })
    if (!referral) return null

    const commission = tradeAmount * Number(referral.commissionRate)
    return this.prisma.affiliateReferrals.update({
      where: { id: referral.id },
      data: {
        totalEarned: { increment: commission },
        tradeCount: { increment: 1 },
      },
    })
  }

  // Admin — list all affiliate records
  async getAllReferrals(limit = 50) {
    return this.prisma.affiliateReferrals.findMany({
      include: {
        referrer: { select: { id: true, email: true, firstName: true, lastName: true } },
        referredUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { totalEarned: 'desc' },
      take: limit,
    })
  }

  // Get stats summary for a user
  async getStats(userId: string) {
    const referrals = await this.prisma.affiliateReferrals.findMany({ where: { referrerId: userId } })
    const totalClicks = referrals.reduce((s, r) => s + r.clickCount, 0)
    const totalSignups = referrals.reduce((s, r) => s + r.signupCount, 0)
    const totalTrades = referrals.reduce((s, r) => s + r.tradeCount, 0)
    const totalEarned = referrals.reduce((s, r) => s + Number(r.totalEarned), 0)
    return { totalClicks, totalSignups, totalTrades, totalEarned, referrals }
  }
}
