import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const seller = await this.prisma.sellers.findUnique({ where: { userId } })
    if (!seller) throw new NotFoundException('Seller profile not found')
    return { success: true, data: seller }
  }

  async create(userId: string, data: any) {
    const seller = await this.prisma.sellers.create({ data: { ...data, userId } })
    return { success: true, data: seller }
  }
}
