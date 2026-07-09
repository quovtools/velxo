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
var ListingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const search_listing_dto_1 = require("./dto/search-listing.dto");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const client_1 = require("@prisma/client");
let ListingsService = ListingsService_1 = class ListingsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ListingsService_1.name);
    }
    async createListing(userId, dto) {
        this.logger.log(`Creating listing for user ${userId}`);
        const seller = await this.prisma.sellers.findUnique({
            where: { userId },
        });
        if (!seller) {
            throw new custom_exceptions_1.NotFoundException('Seller profile — please create a seller account first');
        }
        let categoryId = dto.categoryId;
        if (!categoryId || categoryId === 'cuid-placeholder-category' || categoryId === 'auto') {
            const firstCategory = await this.prisma.categories.findFirst({ where: { isActive: true } });
            if (!firstCategory) {
                const cat = await this.prisma.categories.create({
                    data: { name: 'Gaming', slug: 'gaming', description: 'Gaming items', sortOrder: 0 },
                });
                categoryId = cat.id;
            }
            else {
                categoryId = firstCategory.id;
            }
        }
        else {
            const category = await this.prisma.categories.findUnique({ where: { id: categoryId } });
            if (!category)
                throw new custom_exceptions_1.NotFoundException('Category');
        }
        const isPro = seller.subscriptionTier === 'PRO' || seller.subscriptionTier === 'PREMIUM';
        const wantsFeatured = dto.isFeatured === true;
        const isFeatured = wantsFeatured && isPro ? true : false;
        const listing = await this.prisma.listings.create({
            data: {
                title: dto.title,
                description: dto.description,
                price: dto.price,
                gameName: dto.gameName,
                gameId: dto.gameId,
                categoryId,
                subcategoryId: dto.subcategoryId,
                sellerId: seller.id,
                platform: dto.platform,
                region: dto.region,
                rank: dto.rank,
                level: dto.level,
                playerId: dto.playerId,
                playerUid: dto.playerUid,
                loginMethod: dto.loginMethod,
                deliveryTime: dto.deliveryTime,
                images: dto.images || [],
                videos: dto.videos || [],
                isFeatured,
                metadata: dto.metadata,
                status: client_1.ListingStatus.PENDING_APPROVAL,
            },
            include: {
                seller: true,
                category: true,
            },
        });
        return listing;
    }
    async searchListings(dto) {
        let statusFilter = { status: client_1.ListingStatus.ACTIVE };
        if (dto.status) {
            if (dto.status.toUpperCase() === 'ALL') {
                statusFilter = {};
            }
            else {
                statusFilter = { status: dto.status };
            }
        }
        else if (dto.sellerId) {
            statusFilter = {};
        }
        const where = { ...statusFilter };
        if (dto.search) {
            where.OR = [
                { title: { contains: dto.search, mode: 'insensitive' } },
                { description: { contains: dto.search, mode: 'insensitive' } },
                { gameName: { contains: dto.search, mode: 'insensitive' } },
            ];
        }
        if (dto.gameName) {
            where.gameName = { contains: dto.gameName, mode: 'insensitive' };
        }
        if (dto.categoryId) {
            where.categoryId = dto.categoryId;
        }
        if (dto.sellerId) {
            where.seller = { userId: dto.sellerId };
        }
        if (dto.platform) {
            where.platform = dto.platform;
        }
        if (dto.region) {
            where.region = dto.region;
        }
        if (dto.rank) {
            where.rank = dto.rank;
        }
        if (dto.minPrice || dto.maxPrice) {
            where.price = {};
            if (dto.minPrice)
                where.price.gte = dto.minPrice;
            if (dto.maxPrice)
                where.price.lte = dto.maxPrice;
        }
        let orderBy = { createdAt: 'desc' };
        if (dto.sortBy === search_listing_dto_1.SortByEnum.POPULAR) {
            orderBy = { salesCount: 'desc' };
        }
        else if (dto.sortBy === search_listing_dto_1.SortByEnum.PRICE_LOW) {
            orderBy = { price: 'asc' };
        }
        else if (dto.sortBy === search_listing_dto_1.SortByEnum.PRICE_HIGH) {
            orderBy = { price: 'desc' };
        }
        else if (dto.sortBy === search_listing_dto_1.SortByEnum.RATING) {
            orderBy = { seller: { averageRating: 'desc' } };
        }
        const [listings, total] = await Promise.all([
            this.prisma.listings.findMany({
                where,
                orderBy,
                skip: dto.offset,
                take: dto.limit,
                include: {
                    seller: {
                        include: { user: true },
                    },
                    category: true,
                },
            }),
            this.prisma.listings.count({ where }),
        ]);
        return {
            listings,
            total,
            page: dto.page,
            limit: dto.limit,
            hasMore: dto.offset + dto.limit < total,
        };
    }
    async getListingById(id) {
        const listing = await this.prisma.listings.findUnique({
            where: { id },
            include: {
                seller: {
                    include: { user: true },
                },
                category: true,
                orderItems: true,
                listingReviews: {
                    include: { buyer: true },
                    take: 10,
                },
            },
        });
        if (!listing) {
            throw new custom_exceptions_1.NotFoundException('Listing');
        }
        await this.prisma.listings.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
        return listing;
    }
    async updateListing(id, sellerId, dto) {
        const listing = await this.prisma.listings.findUnique({
            where: { id },
            include: { seller: true },
        });
        if (!listing) {
            throw new custom_exceptions_1.NotFoundException('Listing');
        }
        if (listing.seller.userId !== sellerId) {
            throw new custom_exceptions_1.ForbiddenException('You can only edit your own listings');
        }
        const isPro = listing.seller.subscriptionTier === 'PRO' || listing.seller.subscriptionTier === 'PREMIUM';
        let isFeatured = listing.isFeatured;
        if (dto.isFeatured !== undefined) {
            isFeatured = dto.isFeatured === true && isPro ? true : false;
        }
        return this.prisma.listings.update({
            where: { id },
            data: {
                title: dto.title || listing.title,
                description: dto.description || listing.description,
                price: dto.price || listing.price,
                platform: dto.platform || listing.platform,
                region: dto.region || listing.region,
                images: dto.images || listing.images,
                videos: dto.videos || listing.videos,
                isFeatured,
            },
            include: { seller: true, category: true },
        });
    }
    async deleteListing(id, sellerId) {
        const listing = await this.prisma.listings.findUnique({
            where: { id },
            include: { seller: true },
        });
        if (!listing) {
            throw new custom_exceptions_1.NotFoundException('Listing');
        }
        if (listing.seller.userId !== sellerId) {
            throw new custom_exceptions_1.ForbiddenException('You can only delete your own listings');
        }
        return this.prisma.listings.delete({
            where: { id },
        });
    }
    async getFeaturedListings(limit = 10) {
        return this.prisma.listings.findMany({
            where: {
                status: client_1.ListingStatus.ACTIVE,
                isFeatured: true,
            },
            take: limit,
            include: {
                seller: { include: { user: true } },
                category: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = ListingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map