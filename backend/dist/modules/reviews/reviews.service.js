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
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReviewsService_1.name);
    }
    async createReview(buyerId, dto) {
        this.logger.log(`Creating review for order ${dto.orderId}`);
        const order = await this.prisma.orders.findUnique({
            where: { id: dto.orderId },
            include: { orderItems: true },
        });
        if (!order) {
            throw new custom_exceptions_1.NotFoundException('Order');
        }
        if (order.buyerId !== buyerId) {
            throw new custom_exceptions_1.ForbiddenException('Only the buyer can review this order');
        }
        if (order.status !== 'COMPLETED' && order.status !== 'DELIVERED') {
            throw new custom_exceptions_1.BadRequestException('You can only review a completed order');
        }
        const existingReview = await this.prisma.reviews.findFirst({
            where: { orderId: dto.orderId },
        });
        if (existingReview) {
            throw new custom_exceptions_1.ForbiddenException('You have already reviewed this order');
        }
        const listingId = order.orderItems[0]?.listingId;
        if (!listingId) {
            throw new custom_exceptions_1.NotFoundException('Listing');
        }
        const review = await this.prisma.$transaction(async (tx) => {
            const newReview = await tx.reviews.create({
                data: {
                    orderId: dto.orderId,
                    listingId,
                    buyerId,
                    sellerId: order.sellerId,
                    rating: dto.rating,
                    comment: dto.comment,
                },
                include: {
                    buyer: true,
                    seller: true,
                },
            });
            const allReviews = await tx.reviews.findMany({
                where: { sellerId: order.sellerId },
            });
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            await tx.sellers.update({
                where: { id: order.sellerId },
                data: { averageRating: avgRating },
            });
            return newReview;
        });
        return review;
    }
    async getListingReviews(listingId, limit = 10) {
        return this.prisma.reviews.findMany({
            where: { listingId, isHidden: false },
            include: { buyer: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getSellerReviews(sellerId, limit = 50) {
        return this.prisma.reviews.findMany({
            where: { sellerId, isHidden: false },
            include: { buyer: true, listing: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async respondToReview(reviewId, sellerId, response) {
        this.logger.log(`Adding seller response to review ${reviewId}`);
        const review = await this.prisma.reviews.findUnique({
            where: { id: reviewId },
            include: { seller: true },
        });
        if (!review) {
            throw new custom_exceptions_1.NotFoundException('Review');
        }
        if (review.seller?.userId !== sellerId) {
            throw new custom_exceptions_1.ForbiddenException('Only the seller can respond to this review');
        }
        return this.prisma.reviews.update({
            where: { id: reviewId },
            data: {
                sellerResponse: response,
                sellerRespondedAt: new Date(),
            },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map