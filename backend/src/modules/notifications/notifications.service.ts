import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const notifications = await this.prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: notifications }
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notifications.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })
    return { success: true, data: notification }
  }
}
