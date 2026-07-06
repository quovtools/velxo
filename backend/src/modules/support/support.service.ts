import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotFoundException } from '@/common/exceptions/custom-exceptions'
import { SupportTicketStatus, SupportTicketCategory } from '@prisma/client'

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name)

  constructor(private prisma: PrismaService) {}

  async createTicket(
    userId: string,
    subject: string,
    category: SupportTicketCategory,
    priority: string = 'MEDIUM',
  ) {
    this.logger.log(`Creating support ticket for user ${userId}`)

    const ticket = await this.prisma.supportTickets.create({
      data: {
        userId,
        subject,
        category,
        priority,
        status: SupportTicketStatus.OPEN,
      },
      include: { user: true },
    })

    return ticket
  }

  async getUserTickets(userId: string, limit: number = 50) {
    return this.prisma.supportTickets.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    })
  }

  async getOpenTickets(limit: number = 50) {
    return this.prisma.supportTickets.findMany({
      where: { status: SupportTicketStatus.OPEN },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: { user: true },
    })
  }

  async getTicketById(ticketId: string) {
    const ticket = await this.prisma.supportTickets.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    })

    if (!ticket) {
      throw new NotFoundException('Support ticket')
    }

    return ticket
  }

  async assignTicket(ticketId: string, assigneeId: string) {
    this.logger.log(`Assigning ticket ${ticketId} to ${assigneeId}`)

    const ticket = await this.prisma.supportTickets.update({
      where: { id: ticketId },
      data: {
        assigneeId,
        status: SupportTicketStatus.IN_PROGRESS,
      },
      include: { user: true },
    })

    return ticket
  }

  async updateTicketStatus(ticketId: string, status: SupportTicketStatus) {
    this.logger.log(`Updating ticket ${ticketId} status to ${status}`)

    return this.prisma.supportTickets.update({
      where: { id: ticketId },
      data: {
        status,
        closedAt: status === SupportTicketStatus.CLOSED ? new Date() : undefined,
      },
      include: { user: true },
    })
  }

  async resolveTicket(ticketId: string, resolutionNotes: string) {
    this.logger.log(`Resolving ticket ${ticketId}`)

    const existingTicket = await this.prisma.supportTickets.findUnique({
      where: { id: ticketId },
    })

    const ticket = await this.prisma.supportTickets.update({
      where: { id: ticketId },
      data: {
        status: SupportTicketStatus.RESOLVED,
        metadata: {
          ...((existingTicket as any)?.metadata || {}),
          resolutionNotes,
        },
      },
      include: { user: true },
    })

    // TODO: Send notification to user

    return ticket
  }

  async closeTicket(ticketId: string) {
    this.logger.log(`Closing ticket ${ticketId}`)

    return this.prisma.supportTickets.update({
      where: { id: ticketId },
      data: {
        status: SupportTicketStatus.CLOSED,
        closedAt: new Date(),
      },
    })
  }

  async getTicketStats() {
    const [openCount, inProgressCount, resolvedCount] = await Promise.all([
      this.prisma.supportTickets.count({ where: { status: SupportTicketStatus.OPEN } }),
      this.prisma.supportTickets.count({ where: { status: SupportTicketStatus.IN_PROGRESS } }),
      this.prisma.supportTickets.count({ where: { status: SupportTicketStatus.RESOLVED } }),
    ])

    return {
      openCount,
      inProgressCount,
      resolvedCount,
      avgResolutionTime: '24 hours', // TODO: Calculate actual average
    }
  }

  async getTicketsByCategory(category: SupportTicketCategory, limit: number = 50) {
    return this.prisma.supportTickets.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    })
  }
}
