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
var BlogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
let BlogService = BlogService_1 = class BlogService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BlogService_1.name);
    }
    async getPublishedPosts(category) {
        return this.prisma.blogPosts.findMany({
            where: { isPublished: true, ...(category ? { category } : {}) },
            orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
            select: { id: true, title: true, slug: true, excerpt: true, category: true, author: true, coverImage: true, isFeatured: true, readTime: true, publishedAt: true },
        });
    }
    async getPostBySlug(slug) {
        return this.prisma.blogPosts.findFirst({ where: { slug, isPublished: true } });
    }
    async getAllPosts() {
        return this.prisma.blogPosts.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async createPost(dto) {
        return this.prisma.blogPosts.create({
            data: { ...dto, publishedAt: dto.isPublished ? new Date() : null },
        });
    }
    async updatePost(id, dto) {
        const data = { ...dto };
        if (dto.isPublished !== undefined) {
            const existing = await this.prisma.blogPosts.findUnique({ where: { id } });
            if (dto.isPublished && !existing?.publishedAt)
                data.publishedAt = new Date();
        }
        return this.prisma.blogPosts.update({ where: { id }, data });
    }
    async deletePost(id) {
        return this.prisma.blogPosts.delete({ where: { id } });
    }
};
exports.BlogService = BlogService;
exports.BlogService = BlogService = BlogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BlogService);
//# sourceMappingURL=blog.service.js.map