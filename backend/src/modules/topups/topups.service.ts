import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { BadRequestException, NotFoundException } from '@/common/exceptions/custom-exceptions'

const VELXO_OFFICIAL_EMAIL = 'topup@velxo.shop'

@Injectable()
export class TopupsService {
  private readonly logger = new Logger(TopupsService.name)
  private velxoSellerId: string | null = null

  constructor(private prisma: PrismaService, private ordersService: OrdersService) {}

  async getActiveProducts(gameName?: string) {
    return this.prisma.topupProducts.findMany({
      where: {
        isActive: true,
        ...(gameName ? { gameName } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getAllProducts() {
    return this.prisma.topupProducts.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getProductById(id: string) {
    const product = await this.prisma.topupProducts.findUnique({ where: { id } })
    if (!product) throw new NotFoundException('Topup product')
    return product
  }

  async createProduct(data: any) {
    return this.prisma.topupProducts.create({ data })
  }

  async updateProduct(id: string, data: any) {
    await this.getProductById(id)
    return this.prisma.topupProducts.update({ where: { id }, data })
  }

  async deleteProduct(id: string) {
    await this.getProductById(id)
    return this.prisma.topupProducts.delete({ where: { id } })
  }

  /**
   * Resolves (creating if necessary) the designated "Velxo Official" seller
   * account that owns every official top-up. Top-ups are platform-provided,
   * so all of them settle to this single seller wallet via escrow.
   */
  private async ensureVelxoSeller(): Promise<string> {
    if (this.velxoSellerId) return this.velxoSellerId

    const existingSeller = await this.prisma.sellers.findFirst({
      where: { user: { email: VELXO_OFFICIAL_EMAIL } },
      include: { user: true },
    })
    if (existingSeller) {
      this.velxoSellerId = existingSeller.id
      return existingSeller.id
    }

    const seller = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.upsert({
        where: { email: VELXO_OFFICIAL_EMAIL },
        update: {},
        create: {
          email: VELXO_OFFICIAL_EMAIL,
          firstName: 'Velxo',
          lastName: 'Official',
          role: 'SELLER',
          emailVerified: true,
        },
      })

      const created = await tx.sellers.create({
        data: {
          userId: user.id,
          storeName: 'Velxo Official Store',
          storeDescription: 'Official Velxo gaming top-ups and coins.',
          accountType: 'STANDARD',
          isVerified: true,
        },
      })

      await tx.wallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      })

      return created
    })

    this.velxoSellerId = seller.id
    return seller.id
  }

  async purchase(buyerId: string, productId: string, quantity: number, buyerNote?: string) {
    const product = await this.getProductById(productId)
    if (!product.isActive) {
      throw new BadRequestException('This top-up is currently unavailable')
    }
    if (product.stock !== null && product.stock !== undefined && product.stock >= 0) {
      if (product.stock < quantity) {
        throw new BadRequestException('Not enough stock for this top-up')
      }
    }

    const sellerId = await this.ensureVelxoSeller()

    const order = await this.ordersService.createServiceOrder(buyerId, {
      sellerId,
      title: `${product.title} (${product.gameName})`,
      price: Number(product.price),
      currency: product.currency,
      quantity,
      buyerNote,
      sourceType: 'TOPUP',
      sourceId: product.id,
    })

    if (product.stock !== null && product.stock !== undefined && product.stock >= 0) {
      await this.prisma.topupProducts.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      })
    }

    return order
  }
}
