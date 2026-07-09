import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateSellerDto, UpdateSellerDto, UploadVerificationDocumentsDto } from './dto/create-seller.dto'
import { NotFoundException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { NotificationsService } from '@/modules/notifications/notifications.service'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createSeller(userId: string, dto: CreateSellerDto) {
    this.logger.log(`Creating seller account for user ${userId}`)

    // Check if seller already exists
    const existing = await this.prisma.sellers.findUnique({
      where: { userId },
    })

    if (existing) {
      throw new ConflictException('Seller account already exists for this user')
    }

    const seller = await this.prisma.$transaction(async (tx) => {
      const newSeller = await tx.sellers.create({
        data: {
          userId,
          storeName: dto.storeName,
          storeDescription: dto.storeDescription,
          reputationScore: 5.0,
        },
      })

      // Update user role to SELLER
      await tx.users.update({
        where: { id: userId },
        data: { role: 'SELLER' },
      })

      // Create wallet for seller
      await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: new Decimal(0) },
        update: {},
      })

      return newSeller
    })

    return seller
  }

  async getSellerProfile(sellerId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const [totalListings, activeListings, recentListings] = await Promise.all([
      this.prisma.listings.count({ where: { sellerId: seller.id } }),
      this.prisma.listings.count({ where: { sellerId: seller.id, status: 'ACTIVE' } }),
      this.prisma.listings.findMany({
        where: { sellerId: seller.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          price: true,
          gameName: true,
          platform: true,
          region: true,
          images: true,
          status: true,
          salesCount: true,
          createdAt: true,
        },
      }),
    ])

    return {
      id: seller.id,
      storeName: seller.storeName,
      storeDescription: seller.storeDescription,
      isVerified: seller.isVerified,
      verifiedAt: seller.verifiedAt,
      averageRating: seller.averageRating,
      totalSales: seller.totalSales,
      totalRevenue: Number(seller.totalRevenue || 0),
      responseTime: seller.responseTime,
      responseRate: seller.responseRate,
      reputationScore: seller.reputationScore,
      subscriptionTier: seller.subscriptionTier,
      isSuspended: seller.isSuspended,
      createdAt: seller.createdAt,
      user: seller.user,
      stats: {
        totalListings,
        activeListings,
        totalSales: seller.totalSales,
        averageRating: seller.averageRating,
        responseTime: seller.responseTime,
        responseRate: seller.responseRate,
        memberSince: seller.createdAt,
      },
      listings: recentListings.map((l) => ({
        id: l.id,
        title: l.title,
        price: Number(l.price),
        gameName: l.gameName,
        platform: l.platform,
        region: l.region,
        images: l.images,
        status: l.status,
        salesCount: l.salesCount,
        createdAt: l.createdAt,
      })),
    }
  }

  async reportSeller(
    sellerId: string,
    reporterUserId: string,
    reason: string,
    details?: string,
  ) {
    this.logger.log(`Report submitted for seller ${sellerId} by user ${reporterUserId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      select: { id: true, storeName: true, userId: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const ticket = await this.prisma.supportTickets.create({
      data: {
        userId: reporterUserId,
        subject: `Seller report: ${seller.storeName}`,
        category: 'OTHER',
        priority: 'MEDIUM',
        metadata: {
          type: 'SELLER_REPORT',
          reportedSellerId: seller.id,
          reportedSellerUserId: seller.userId,
          reportedStoreName: seller.storeName,
          reason,
          details: details || null,
        },
      },
    })

    return { id: ticket.id, message: 'Report submitted successfully' }
  }

  async getSellerByUserId(userId: string) {
    const seller = await this.prisma.sellers.findUnique({
      where: { userId },
      include: { user: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    return seller
  }

  async updateSeller(sellerId: string, dto: UpdateSellerDto) {
    this.logger.log(`Updating seller ${sellerId}`)

    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        storeName: dto.storeName,
        storeDescription: dto.storeDescription,
        responseTime: dto.responseTime,
      },
      include: { user: true },
    })

    return seller
  }

  async uploadVerificationDocuments(
    sellerId: string,
    documents: UploadVerificationDocumentsDto[],
  ) {
    this.logger.log(`Uploading verification documents for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const updatedDocs = {
      ...(seller.verificationDocuments as any),
      ...documents.reduce((acc, doc) => {
        acc[doc.documentType] = doc.documentUrl
        return acc
      }, {}),
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        verificationDocuments: updatedDocs,
      },
    })

    return updated
  }

  async submitKyc(
    sellerId: string,
    dto: {
      idType: string
      fullName: string
      documentNumber?: string
      idImageUrl: string
      selfieImageUrl: string
    },
  ) {
    this.logger.log(`Submitting KYC for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    if (seller.isVerified) {
      throw new ConflictException('Seller is already verified')
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        kycStatus: 'SUBMITTED',
        kycIdType: dto.idType,
        kycFullName: dto.fullName,
        kycDocumentNumber: dto.documentNumber || null,
        kycIdImageUrl: dto.idImageUrl,
        kycSelfieImageUrl: dto.selfieImageUrl,
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
    })

    return updated
  }

  async getPendingKyc(limit: number = 50) {
    return this.prisma.sellers.findMany({
      where: { kycStatus: 'SUBMITTED' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
      orderBy: { kycSubmittedAt: 'asc' },
      take: limit,
    })
  }

  async approveKyc(sellerId: string, moderatorId: string) {
    this.logger.log(`Approving KYC for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { user: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        kycStatus: 'APPROVED',
        isVerified: true,
        verifiedAt: new Date(),
        kycReviewedAt: new Date(),
        kycRejectionReason: null,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { kycStatus: 'APPROVED', isVerified: true },
      },
    })

    if (seller.userId) {
      await this.notifications
        .notifyKycApproved(seller.userId, seller.storeName)
        .catch(() => {})
    }

    return updated
  }

  async rejectKyc(sellerId: string, moderatorId: string, reason: string) {
    this.logger.log(`Rejecting KYC for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { user: true },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    const updated = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        kycStatus: 'REJECTED',
        isVerified: false,
        kycReviewedAt: new Date(),
        kycRejectionReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { kycStatus: 'REJECTED', reason },
      },
    })

    if (seller.userId) {
      await this.notifications
        .notifyKycRejected(seller.userId, seller.storeName, reason)
        .catch(() => {})
    }

    return updated
  }

  async verifySellerIdentity(sellerId: string, moderatorId: string) {
    this.logger.log(`Verifying seller ${sellerId}`)

    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    })

    // Log to audit trail
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'VERIFICATION_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { isVerified: true },
      },
    })

    return seller
  }

  async getTopSellers(limit: number = 10) {
    return this.prisma.sellers.findMany({
      where: { isVerified: true, isSuspended: false },
      orderBy: { reputationScore: 'desc' },
      take: limit,
      include: {
        user: {
          select: { email: true, firstName: true, avatarUrl: true },
        },
      },
    })
  }

  async suspendSeller(sellerId: string, reason: string, moderatorId: string) {
    this.logger.log(`Suspending seller ${sellerId}`)

    const seller = await this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'STATUS_CHANGE',
        entityType: 'seller',
        entityId: sellerId,
        newValue: { isSuspended: true, reason },
      },
    })

    return seller
  }

  async updateSellerStats(sellerId: string) {
    this.logger.log(`Updating stats for seller ${sellerId}`)

    const seller = await this.prisma.sellers.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller')
    }

    // Get completed orders
    const completedOrders = await this.prisma.orders.findMany({
      where: { sellerId: seller.id, status: 'COMPLETED' },
    })

    const totalSales = completedOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum.plus(order.totalAmount), new Decimal(0))

    // Calculate average rating
    const allReviews = await this.prisma.reviews.findMany({
      where: { sellerId: seller.id },
    })

    const avgRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    // Update reputation score based on reviews and sales
    const reputationScore = Math.min(5, (avgRating * 0.7) + ((totalSales / 100) * 0.3))

    return this.prisma.sellers.update({
      where: { id: sellerId },
      data: {
        totalSales,
        totalRevenue,
        averageRating: avgRating,
        reputationScore,
      },
    })
  }
}
