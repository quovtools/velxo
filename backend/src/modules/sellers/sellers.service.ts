import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateSellerDto, UpdateSellerDto, UploadVerificationDocumentsDto } from './dto/create-seller.dto'
import { NotFoundException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name)

  constructor(private prisma: PrismaService) {}

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
          reputationScore: 5.0, // Start with neutral score
        },
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

    return seller
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
      where: { sellerId: seller.userId, status: 'COMPLETED' },
    })

    const totalSales = completedOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum.plus(order.totalAmount), new Decimal(0))

    // Calculate average rating
    const allReviews = await this.prisma.reviews.findMany({
      where: { sellerId: seller.userId },
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
