import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        role: true,
        createdAt: true,
        isActive: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User')
    }

    return user
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string
      lastName?: string
      phone?: string
      notificationPreferences?: any
      preferences?: any
    },
  ) {
    this.logger.log(`Updating profile for user ${userId}`)

    const { notificationPreferences, preferences, ...rest } = data

    const updateData: any = { ...rest }
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences
    if (preferences !== undefined) updateData.preferences = preferences

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        notificationPreferences: true,
        preferences: true,
      },
    })

    return user
  }

  async uploadAvatar(userId: string, avatarUrl: string) {
    this.logger.log(`Uploading avatar for user ${userId}`)

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { avatarUrl },
    })

    return user
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User')
    }

    const [buyerOrders, reviews, wallet] = await Promise.all([
      this.prisma.orders.count({ where: { buyerId: userId } }),
      this.prisma.reviews.count({ where: { buyerId: userId } }),
      this.prisma.wallet.findUnique({ where: { userId } }),
    ])

    let sellerStats = null
    const seller = await this.prisma.sellers.findUnique({
      where: { userId },
    })

    if (seller) {
      sellerStats = {
        storeName: seller.storeName,
        isVerified: seller.isVerified,
        totalSales: seller.totalSales,
        averageRating: seller.averageRating,
        reputationScore: seller.reputationScore,
      }
    }

    return {
      role: user.role,
      buyerStats: {
        totalOrders: buyerOrders,
        totalReviews: reviews,
      },
      wallet: {
        balance: wallet?.balance || 0,
        totalEarnings: wallet?.totalEarnings || 0,
      },
      sellerStats,
      memberSince: user.createdAt,
    }
  }

  async searchUsers(query: string, limit: number = 20) {
    return this.prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
      },
      take: limit,
    })
  }

  async deactivateAccount(userId: string) {
    this.logger.log(`Deactivating account for user ${userId}`)

    // Soft delete approach
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    })
  }

  async reactivateAccount(userId: string) {
    this.logger.log(`Reactivating account for user ${userId}`)

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        isActive: true,
        deletedAt: null,
      },
    })
  }

  async getAllUsers(limit: number = 100) {
    return this.prisma.users.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true,
        isBanned: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }
}
