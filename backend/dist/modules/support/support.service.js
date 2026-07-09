"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const client_1 = require("@prisma/client");
let SupportService = SupportService_1 = class SupportService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SupportService_1.name);
    }
    async createTicket(userId, subject, category, priority = 'MEDIUM') {
        this.logger.log(`Creating support ticket for user ${userId}`);
        const ticket = await this.prisma.supportTickets.create({
            data: {
                userId,
                subject,
                category,
                priority,
                status: client_1.SupportTicketStatus.OPEN,
            },
            include: { user: true },
        });
        return ticket;
    }
    async createOrderComplaint(userId, orderId, description, category = client_1.SupportTicketCategory.DELIVERY) {
        this.logger.log(`Creating order complaint for order ${orderId} by ${userId}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: { seller: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.buyerId !== userId && order.seller?.userId !== userId) {
            throw new custom_exceptions_1.ForbiddenException('Only the buyer or seller of this order can file a complaint');
        }
        const role = order.buyerId === userId ? 'BUYER' : 'SELLER';
        const ticket = await this.prisma.supportTickets.create({
            data: {
                userId,
                subject: `Complaint on order ${order.orderNumber}`,
                category,
                priority: 'HIGH',
                status: client_1.SupportTicketStatus.OPEN,
                metadata: {
                    type: 'COMPLAINT',
                    orderId,
                    orderNumber: order.orderNumber,
                    filedByRole: role,
                    description: description || null,
                },
            },
            include: { user: true },
        });
        return ticket;
    }
    async getUserTickets(userId, limit = 50) {
        return this.prisma.supportTickets.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: true },
        });
    }
    async getOpenTickets(limit = 50) {
        return this.prisma.supportTickets.findMany({
            where: { status: client_1.SupportTicketStatus.OPEN },
            orderBy: { createdAt: 'asc' },
            take: limit,
            include: { user: true },
        });
    }
    async getTicketById(ticketId, userId) {
        const ticket = await this.prisma.supportTickets.findUnique({
            where: { id: ticketId },
            include: {
                user: true,
            },
        });
        if (!ticket) {
            throw new custom_exceptions_1.NotFoundException('Support ticket');
        }
        if (userId && ticket.userId !== userId) {
            throw new custom_exceptions_1.ForbiddenException('You do not have access to this ticket');
        }
        return ticket;
    }
    async assignTicket(ticketId, assigneeId) {
        this.logger.log(`Assigning ticket ${ticketId} to ${assigneeId}`);
        const ticket = await this.prisma.supportTickets.update({
            where: { id: ticketId },
            data: {
                assigneeId,
                status: client_1.SupportTicketStatus.IN_PROGRESS,
            },
            include: { user: true },
        });
        return ticket;
    }
    async updateTicketStatus(ticketId, status) {
        this.logger.log(`Updating ticket ${ticketId} status to ${status}`);
        return this.prisma.supportTickets.update({
            where: { id: ticketId },
            data: {
                status,
                closedAt: status === client_1.SupportTicketStatus.CLOSED ? new Date() : undefined,
            },
            include: { user: true },
        });
    }
    async resolveTicket(ticketId, resolutionNotes) {
        this.logger.log(`Resolving ticket ${ticketId}`);
        const existingTicket = await this.prisma.supportTickets.findUnique({
            where: { id: ticketId },
        });
        const ticket = await this.prisma.supportTickets.update({
            where: { id: ticketId },
            data: {
                status: client_1.SupportTicketStatus.RESOLVED,
                metadata: {
                    ...(existingTicket?.metadata || {}),
                    resolutionNotes,
                },
            },
            include: { user: true },
        });
        return ticket;
    }
    async closeTicket(ticketId) {
        this.logger.log(`Closing ticket ${ticketId}`);
        return this.prisma.supportTickets.update({
            where: { id: ticketId },
            data: {
                status: client_1.SupportTicketStatus.CLOSED,
                closedAt: new Date(),
            },
        });
    }
    async getTicketStats() {
        const [openCount, inProgressCount, resolvedCount] = await Promise.all([
            this.prisma.supportTickets.count({ where: { status: client_1.SupportTicketStatus.OPEN } }),
            this.prisma.supportTickets.count({ where: { status: client_1.SupportTicketStatus.IN_PROGRESS } }),
            this.prisma.supportTickets.count({ where: { status: client_1.SupportTicketStatus.RESOLVED } }),
        ]);
        return {
            openCount,
            inProgressCount,
            resolvedCount,
            avgResolutionTime: '24 hours',
        };
    }
    async getTicketsByCategory(category, limit = 50) {
        return this.prisma.supportTickets.findMany({
            where: { category },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: true },
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = SupportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map