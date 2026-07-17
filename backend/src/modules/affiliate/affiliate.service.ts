import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { nanoid } from 'nanoid'
import { Decimal } from '@prisma/client/runtime/library'
import { NotFoundException, BadRequestException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { RegisterCreatorDto, UpdateCreatorDto, AdminReviewCreatorDto } from './dto/affiliate.dto'

// Tier thresholds for signup reward calculation
// Creator tiers (based on referred signups)
const CREATOR_TIER_THRESHOLDS = {
  STARTER: { minSignups: 0, rewardPerSignup: 10 },
  RISING:  { minSignups: 100, rewardPerSignup: 25 },
  ELITE:   { minSignups: 1000, rewardPerSignup: 50 },
}

// User (non-creator) tier thresholds
const USER_TIER_THRESHOLDS = {
  BASIC:    { minSignups: 0,    rewardPerSignup: 10 },
  ACTIVE:   { minSignups: 100,  rewardPerSignup: 15 },
  POWER:    { minSignups: 1000, rewardPerSignup: 30 },
}

// Minimum follower count to qualify as a creator
const CREATOR_MIN_FOLLOWERS = 10_000

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name)

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────
  //  REFERRAL LINK
  // ─────────────────────────────────────────────────

  /** Get or create the referral record for a user */
  async getMyReferral(userId: string) {
    let referral = await this.prisma.affiliateReferrals.findFirst({
      where: { referrerId: userId, referredUserId: null },
    })
    if (!referral) {
      const code = 'VLX-' + nanoid(8).toUpperCase()
      referral = await this.prisma.affiliateReferrals.create({
        data: { referrerId: userId, referralCode: code, status: 'ACTIVE' },
      })
    }
    return referral
  }

  /** Track a click on a referral link */
  async trackClick(code: string) {
    return this.prisma.affiliateReferrals.updateMany({
      where: { referralCode: code },
      data: { clickCount: { increment: 1 } },
    })
  }

  /**
   * Register a referred user.
   * - Called on signup when a referralCode is present.
   * - Calculates and schedules the signup reward for the referrer.
   */
  async registerReferral(code: string, newUserId: string) {
    const referral = await this.prisma.affiliateReferrals.findFirst({
      where: { referralCode: code, referredUserId: null },
      include: { referrer: { include: { creatorProfile: true } } },
    })
    if (!referral) return null

    // Update the referral record
    const updated = await this.prisma.affiliateReferrals.update({
      where: { id: referral.id },
      data: {
        referredUserId: newUserId,
        signupCount: { increment: 1 },
        status: 'CONVERTED',
      },
    })

    // Determine the reward amount based on referrer type and tier
    const referrer = referral.referrer
    const creator = referrer.creatorProfile

    let rewardAmount = 10 // default NGN

    if (creator && creator.status === 'APPROVED') {
      // Creator: use their current tier's reward per signup
      const allReferrals = await this.prisma.affiliateReferrals.findMany({
        where: { referrerId: referrer.id },
        select: { signupCount: true },
      })
      const totalSignups = allReferrals.reduce((s, r) => s + r.signupCount, 0)
      rewardAmount = this.getCreatorRewardPerSignup(totalSignups)
    } else {
      // Regular user
      const allReferrals = await this.prisma.affiliateReferrals.findMany({
        where: { referrerId: referrer.id },
        select: { signupCount: true },
      })
      const totalSignups = allReferrals.reduce((s, r) => s + r.signupCount, 0)
      rewardAmount = this.getUserRewardPerSignup(totalSignups)
    }

    // Create signup reward record and credit the referrer's wallet
    await this.prisma.$transaction(async (tx) => {
      // Create reward record
      await tx.affiliateSignupRewards.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUserId,
          rewardAmount: new Decimal(rewardAmount),
          currency: 'NGN',
          paid: true,
          paidAt: new Date(),
        },
      })

      // Credit wallet
      const wallet = await tx.wallet.findUnique({ where: { userId: referrer.id } })
      if (wallet) {
        const newBalance = Number(wallet.balance) + rewardAmount
        const newEarnings = Number(wallet.totalEarnings) + rewardAmount
        await tx.wallet.update({
          where: { userId: referrer.id },
          data: { balance: new Decimal(newBalance), totalEarnings: new Decimal(newEarnings) },
        })
        await tx.walletTransactions.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: new Decimal(rewardAmount),
            currency: 'NGN',
            balanceAfter: new Decimal(newBalance),
            description: `Signup reward — referral joined`,
            relatedId: updated.id,
          },
        })
      }
    })

    return updated
  }

  /**
   * Credit affiliate commission when a referred user completes a trade.
   * - Regular users get standard commission rate from their affiliateReferrals record.
   * - Approved creators get 20% of Velxo's profit (commissionAmount = Velxo's cut).
   */
  async creditCommission(referredUserId: string, velxoProfitAmount: number, orderId: string) {
    const referral = await this.prisma.affiliateReferrals.findFirst({
      where: { referredUserId },
      include: { referrer: { include: { creatorProfile: true } } },
    })
    if (!referral) return null

    const creator = referral.referrer.creatorProfile
    let commissionAmount: number

    if (creator && creator.status === 'APPROVED') {
      // Creator gets 20% of Velxo's profit
      commissionAmount = velxoProfitAmount * Number(creator.creatorCommissionRate)
    } else {
      // Regular user gets the standard flat rate from their referral record
      commissionAmount = velxoProfitAmount * Number(referral.commissionRate)
    }

    if (commissionAmount <= 0) return null

    await this.prisma.$transaction(async (tx) => {
      // Update referral aggregate
      await tx.affiliateReferrals.update({
        where: { id: referral.id },
        data: {
          totalEarned: { increment: commissionAmount },
          tradeCount: { increment: 1 },
        },
      })

      // Credit wallet
      const wallet = await tx.wallet.findUnique({ where: { userId: referral.referrerId } })
      if (wallet) {
        const newBalance = Number(wallet.balance) + commissionAmount
        const newEarnings = Number(wallet.totalEarnings) + commissionAmount
        await tx.wallet.update({
          where: { userId: referral.referrerId },
          data: { balance: new Decimal(newBalance), totalEarnings: new Decimal(newEarnings) },
        })
        await tx.walletTransactions.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: new Decimal(commissionAmount),
            currency: 'NGN',
            balanceAfter: new Decimal(newBalance),
            description: creator
              ? `Creator commission (20%) on referred trade`
              : `Affiliate commission on referred trade`,
            relatedId: orderId,
          },
        })
      }
    })

    return commissionAmount
  }

  // ─────────────────────────────────────────────────
  //  STATS
  // ─────────────────────────────────────────────────

  async getStats(userId: string) {
    const referrals = await this.prisma.affiliateReferrals.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: { select: { id: true, email: true, firstName: true, lastName: true, createdAt: true } },
      },
    })

    const signupRewards = await this.prisma.affiliateSignupRewards.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalClicks = referrals.reduce((s, r) => s + r.clickCount, 0)
    const totalSignups = referrals.reduce((s, r) => s + r.signupCount, 0)
    const totalTrades = referrals.reduce((s, r) => s + r.tradeCount, 0)
    const totalEarned = referrals.reduce((s, r) => s + Number(r.totalEarned), 0)
    const totalSignupRewards = signupRewards.reduce((s, r) => s + Number(r.rewardAmount), 0)

    // Determine current tier
    const creator = await this.prisma.creatorProfiles.findUnique({ where: { userId } })

    let tierInfo: any
    if (creator && creator.status === 'APPROVED') {
      tierInfo = this.getCreatorTierInfo(totalSignups)
    } else {
      tierInfo = this.getUserTierInfo(totalSignups)
    }

    return {
      totalClicks,
      totalSignups,
      totalTrades,
      totalEarned,
      totalSignupRewards,
      tierInfo,
      isCreator: creator ? creator.status === 'APPROVED' : false,
      referrals,
      recentSignupRewards: signupRewards,
    }
  }

  // ─────────────────────────────────────────────────
  //  CREATOR REGISTRATION & MANAGEMENT
  // ─────────────────────────────────────────────────

  async registerCreator(userId: string, dto: RegisterCreatorDto) {
    // Check if already registered
    const existing = await this.prisma.creatorProfiles.findUnique({ where: { userId } })
    if (existing) {
      throw new ConflictException('You have already registered as a creator. Status: ' + existing.status)
    }

    if (dto.followerCount < CREATOR_MIN_FOLLOWERS) {
      throw new BadRequestException(
        `You need at least ${CREATOR_MIN_FOLLOWERS.toLocaleString()} followers to apply as a creator`,
      )
    }

    return this.prisma.creatorProfiles.create({
      data: {
        userId,
        handle: dto.handle,
        platform: dto.platform,
        followerCount: dto.followerCount,
        bio: dto.bio,
        status: 'PENDING',
        tier: 'STARTER',
        signupRewardBase: new Decimal(10),
        creatorCommissionRate: new Decimal(0.20),
      },
    })
  }

  async updateCreatorProfile(userId: string, dto: UpdateCreatorDto) {
    const existing = await this.prisma.creatorProfiles.findUnique({ where: { userId } })
    if (!existing) throw new NotFoundException('Creator profile')

    return this.prisma.creatorProfiles.update({
      where: { userId },
      data: {
        handle: dto.handle ?? existing.handle,
        platform: dto.platform ?? existing.platform,
        followerCount: dto.followerCount ?? existing.followerCount,
        bio: dto.bio ?? existing.bio,
        // If follower count was updated and was previously below threshold,
        // reset to PENDING for re-review
        status:
          dto.followerCount !== undefined &&
          dto.followerCount >= CREATOR_MIN_FOLLOWERS &&
          existing.status === 'REJECTED'
            ? 'PENDING'
            : existing.status,
      },
    })
  }

  async getCreatorProfile(userId: string) {
    return this.prisma.creatorProfiles.findUnique({ where: { userId } })
  }

  // Admin: list all creator applications
  async getAllCreators(status?: string, limit = 50) {
    return this.prisma.creatorProfiles.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    })
  }

  // Admin: approve / reject / suspend a creator
  async adminReviewCreator(creatorId: string, dto: AdminReviewCreatorDto, adminId: string) {
    const creator = await this.prisma.creatorProfiles.findUnique({ where: { id: creatorId } })
    if (!creator) throw new NotFoundException('Creator profile')

    const isApproving = dto.status === 'APPROVED'

    const updated = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.creatorProfiles.update({
        where: { id: creatorId },
        data: {
          status: dto.status,
          isVerified: isApproving,
          verifiedAt: isApproving ? new Date() : creator.verifiedAt,
          rejectionReason: dto.rejectionReason ?? null,
          hasFreePremium: isApproving ? true : creator.hasFreePremium,
          premiumGrantedAt: isApproving && !creator.premiumGrantedAt ? new Date() : creator.premiumGrantedAt,
          hasTournamentSlot: isApproving ? true : creator.hasTournamentSlot,
        },
      })

      // If approving, ensure seller record has PREMIUM subscription
      if (isApproving) {
        const seller = await tx.sellers.findUnique({ where: { userId: creator.userId } })
        if (seller) {
          await tx.sellers.update({
            where: { userId: creator.userId },
            data: {
              subscriptionTier: 'PREMIUM',
              subscriptionEndsAt: null, // indefinite while creator status is active
            },
          })
        }
      }

      // Audit log
      await tx.adminAuditLogs.create({
        data: {
          actorId: adminId,
          action: 'STATUS_CHANGE',
          entityType: 'creator_profile',
          entityId: creatorId,
          newValue: { status: dto.status, reason: dto.rejectionReason },
        },
      })

      return profile
    })

    return updated
  }

  // ─────────────────────────────────────────────────
  //  ADMIN — LIST ALL REFERRALS
  // ─────────────────────────────────────────────────

  async getAllReferrals(limit = 50) {
    return this.prisma.affiliateReferrals.findMany({
      include: {
        referrer: { select: { id: true, email: true, firstName: true, lastName: true } },
        referredUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { totalEarned: 'desc' },
      take: Number(limit),
    })
  }

  // ─────────────────────────────────────────────────
  //  TIER HELPERS
  // ─────────────────────────────────────────────────

  private getCreatorRewardPerSignup(totalSignups: number): number {
    if (totalSignups >= CREATOR_TIER_THRESHOLDS.ELITE.minSignups) return 50
    if (totalSignups >= CREATOR_TIER_THRESHOLDS.RISING.minSignups) return 25
    return 10
  }

  private getUserRewardPerSignup(totalSignups: number): number {
    if (totalSignups >= USER_TIER_THRESHOLDS.POWER.minSignups) return 30
    if (totalSignups >= USER_TIER_THRESHOLDS.ACTIVE.minSignups) return 15
    return 10
  }

  getCreatorTierInfo(totalSignups: number) {
    let current: string
    let rewardPerSignup: number
    let nextTier: string | null = null
    let signupsToNext: number | null = null
    let nextReward: number | null = null

    if (totalSignups >= CREATOR_TIER_THRESHOLDS.ELITE.minSignups) {
      current = 'ELITE'
      rewardPerSignup = 50
    } else if (totalSignups >= CREATOR_TIER_THRESHOLDS.RISING.minSignups) {
      current = 'RISING'
      rewardPerSignup = 25
      nextTier = 'ELITE'
      signupsToNext = CREATOR_TIER_THRESHOLDS.ELITE.minSignups - totalSignups
      nextReward = 50
    } else {
      current = 'STARTER'
      rewardPerSignup = 10
      nextTier = 'RISING'
      signupsToNext = CREATOR_TIER_THRESHOLDS.RISING.minSignups - totalSignups
      nextReward = 25
    }

    return { current, rewardPerSignup, nextTier, signupsToNext, nextReward }
  }

  getUserTierInfo(totalSignups: number) {
    let current: string
    let rewardPerSignup: number
    let nextTier: string | null = null
    let signupsToNext: number | null = null
    let nextReward: number | null = null

    if (totalSignups >= USER_TIER_THRESHOLDS.POWER.minSignups) {
      current = 'POWER'
      rewardPerSignup = 30
    } else if (totalSignups >= USER_TIER_THRESHOLDS.ACTIVE.minSignups) {
      current = 'ACTIVE'
      rewardPerSignup = 15
      nextTier = 'POWER'
      signupsToNext = USER_TIER_THRESHOLDS.POWER.minSignups - totalSignups
      nextReward = 30
    } else {
      current = 'BASIC'
      rewardPerSignup = 10
      nextTier = 'ACTIVE'
      signupsToNext = USER_TIER_THRESHOLDS.ACTIVE.minSignups - totalSignups
      nextReward = 15
    }

    return { current, rewardPerSignup, nextTier, signupsToNext, nextReward }
  }
}
