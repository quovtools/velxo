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
var GigsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const orders_service_1 = require("../orders/orders.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
let GigsService = GigsService_1 = class GigsService {
    constructor(prisma, ordersService) {
        this.prisma = prisma;
        this.ordersService = ordersService;
        this.logger = new common_1.Logger(GigsService_1.name);
    }
    async getPublicGigs(filters) {
        return this.prisma.gigs.findMany({
            where: {
                status: 'ACTIVE',
                isActive: true,
                ...(filters.gameName ? { gameName: filters.gameName } : {}),
                ...(filters.accountType ? { accountType: filters.accountType } : {}),
                ...(filters.search
                    ? { OR: [{ title: { contains: filters.search, mode: 'insensitive' } }, { description: { contains: filters.search, mode: 'insensitive' } }] }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { seller: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
        });
    }
    async getGigById(id) {
        const gig = await this.prisma.gigs.findUnique({
            where: { id },
            include: { seller: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
        });
        if (!gig)
            throw new custom_exceptions_1.NotFoundException('Gig');
        return gig;
    }
    async getMyGigs(sellerId) {
        return this.prisma.gigs.findMany({
            where: { sellerId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createGig(sellerId, dto) {
        const seller = await this.prisma.sellers.findUnique({ where: { id: sellerId } });
        if (!seller)
            throw new custom_exceptions_1.NotFoundException('Seller');
        const gig = await this.prisma.$transaction(async (tx) => {
            const newAccountType = seller.accountType === 'BOTH' ? 'BOTH' : 'BOOSTER';
            await tx.sellers.update({
                where: { id: sellerId },
                data: { accountType: newAccountType },
            });
            return tx.gigs.create({
                data: {
                    sellerId,
                    title: dto.title,
                    description: dto.description,
                    gameName: dto.gameName,
                    rankFrom: dto.rankFrom,
                    rankTo: dto.rankTo,
                    platform: dto.platform,
                    region: dto.region,
                    accountType: dto.accountType || 'RANK_BOOST',
                    price: dto.price,
                    currency: dto.currency || 'USD',
                    deliveryTime: dto.deliveryTime,
                    imageUrl: dto.imageUrl,
                    status: 'PENDING_APPROVAL',
                    isActive: true,
                },
            });
        });
        return gig;
    }
    async updateGig(id, sellerId, dto) {
        const gig = await this.getGigById(id);
        if (gig.sellerId !== sellerId)
            throw new custom_exceptions_1.ForbiddenException('You can only edit your own gigs');
        const { isActive, ...rest } = dto;
        return this.prisma.gigs.update({
            where: { id },
            data: { ...rest, ...(isActive !== undefined ? { isActive } : {}) },
        });
    }
    async deleteGig(id, sellerId) {
        const gig = await this.getGigById(id);
        if (gig.sellerId !== sellerId)
            throw new custom_exceptions_1.ForbiddenException('You can only delete your own gigs');
        return this.prisma.gigs.delete({ where: { id } });
    }
    async getAllGigsAdmin(filters) {
        return this.prisma.gigs.findMany({
            where: {
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.gameName ? { gameName: filters.gameName } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { seller: { include: { user: { select: { email: true, firstName: true, lastName: true } } } } },
        });
    }
    async reviewGig(id, status, rejectionReason) {
        await this.getGigById(id);
        return this.prisma.gigs.update({
            where: { id },
            data: { status, rejectionReason: status === 'REJECTED' ? rejectionReason : null },
        });
    }
    async adminDeleteGig(id) {
        return this.prisma.gigs.delete({ where: { id } });
    }
    async purchase(gigId, buyerId, quantity, buyerNote) {
        const gig = await this.getGigById(gigId);
        if (!gig.isActive || gig.status !== 'ACTIVE') {
            throw new custom_exceptions_1.BadRequestException('This gig is not available for purchase');
        }
        return this.ordersService.createServiceOrder(buyerId, {
            sellerId: gig.sellerId,
            title: gig.title,
            price: Number(gig.price),
            currency: gig.currency,
            quantity: quantity && quantity > 0 ? quantity : 1,
            buyerNote,
            sourceType: 'GIG',
            sourceId: gig.id,
        });
    }
};
exports.GigsService = GigsService;
exports.GigsService = GigsService = GigsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, orders_service_1.OrdersService])
], GigsService);
//# sourceMappingURL=gigs.service.js.map