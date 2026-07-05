import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const ticket = await this.prisma.supportTickets.create({ data: { ...dto, userId } })
    return { success: true, data: ticket }
  }
}
