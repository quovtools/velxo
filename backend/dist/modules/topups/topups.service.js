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
var TopupsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const orders_service_1 = require("../orders/orders.service");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const VELXO_OFFICIAL_EMAIL = 'topup@velxo.shop';
let TopupsService = TopupsService_1 = class TopupsService {
    constructor(prisma, ordersService) {
        this.prisma = prisma;
        this.ordersService = ordersService;
        this.logger = new common_1.Logger(TopupsService_1.name);
        this.velxoSellerId = null;
    }
    async getActiveProducts(gameName) {
        return this.prisma.topupProducts.findMany({
            where: {
                isActive: true,
                ...(gameName ? { gameName } : {}),
            },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getAllProducts() {
        return this.prisma.topupProducts.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getProductById(id) {
        const product = await this.prisma.topupProducts.findUnique({ where: { id } });
        if (!product)
            throw new custom_exceptions_1.NotFoundException('Topup product');
        return product;
    }
    async createProduct(data) {
        return this.prisma.topupProducts.create({ data });
    }
    async updateProduct(id, data) {
        await this.getProductById(id);
        return this.prisma.topupProducts.update({ where: { id }, data });
    }
    async deleteProduct(id) {
        await this.getProductById(id);
        return this.prisma.topupProducts.delete({ where: { id } });
    }
    async ensureVelxoSeller() {
        if (this.velxoSellerId)
            return this.velxoSellerId;
        const existingSeller = await this.prisma.sellers.findFirst({
            where: { user: { email: VELXO_OFFICIAL_EMAIL } },
            include: { user: true },
        });
        if (existingSeller) {
            this.velxoSellerId = existingSeller.id;
            return existingSeller.id;
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
            });
            const created = await tx.sellers.create({
                data: {
                    userId: user.id,
                    storeName: 'Velxo Official Store',
                    storeDescription: 'Official Velxo gaming top-ups and coins.',
                    accountType: 'STANDARD',
                    isVerified: true,
                },
            });
            await tx.wallet.upsert({
                where: { userId: user.id },
                create: { userId: user.id },
                update: {},
            });
            return created;
        });
        this.velxoSellerId = seller.id;
        return seller.id;
    }
    async purchase(buyerId, productId, quantity, buyerNote) {
        const product = await this.getProductById(productId);
        if (!product.isActive) {
            throw new custom_exceptions_1.BadRequestException('This top-up is currently unavailable');
        }
        if (product.stock !== null && product.stock !== undefined && product.stock >= 0) {
            if (product.stock < quantity) {
                throw new custom_exceptions_1.BadRequestException('Not enough stock for this top-up');
            }
        }
        const sellerId = await this.ensureVelxoSeller();
        const order = await this.ordersService.createServiceOrder(buyerId, {
            sellerId,
            title: `${product.title} (${product.gameName})`,
            price: Number(product.price),
            currency: product.currency,
            quantity,
            buyerNote,
            sourceType: 'TOPUP',
            sourceId: product.id,
        });
        if (product.stock !== null && product.stock !== undefined && product.stock >= 0) {
            await this.prisma.topupProducts.update({
                where: { id: product.id },
                data: { stock: { decrement: quantity } },
            });
        }
        return order;
    }
};
exports.TopupsService = TopupsService;
exports.TopupsService = TopupsService = TopupsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, orders_service_1.OrdersService])
], TopupsService);
//# sourceMappingURL=topups.service.js.map