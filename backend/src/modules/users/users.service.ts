import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    const { passwordHash, ...result } = user
    return { success: true, data: result }
  }

  async updateProfile(id: string, data: any) {
    const user = await this.prisma.users.update({ where: { id }, data })
    const { passwordHash, ...result } = user
    return { success: true, data: result }
  }
}
