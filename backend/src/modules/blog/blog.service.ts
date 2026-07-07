import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreatePostDto } from './dto/create-post.dto'

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name)
  constructor(private prisma: PrismaService) {}

  async getPublishedPosts(category?: string) {
    return this.prisma.blogPosts.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      select: { id: true, title: true, slug: true, excerpt: true, category: true, author: true, coverImage: true, isFeatured: true, readTime: true, publishedAt: true },
    })
  }

  async getPostBySlug(slug: string) {
    return this.prisma.blogPosts.findUnique({ where: { slug, isPublished: true } })
  }

  async getAllPosts() {
    return this.prisma.blogPosts.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async createPost(dto: CreatePostDto) {
    return this.prisma.blogPosts.create({
      data: { ...dto, publishedAt: dto.isPublished ? new Date() : null },
    })
  }

  async updatePost(id: string, dto: Partial<CreatePostDto>) {
    const data: any = { ...dto }
    if (dto.isPublished !== undefined) {
      const existing = await this.prisma.blogPosts.findUnique({ where: { id } })
      if (dto.isPublished && !existing?.publishedAt) data.publishedAt = new Date()
    }
    return this.prisma.blogPosts.update({ where: { id }, data })
  }

  async deletePost(id: string) {
    return this.prisma.blogPosts.delete({ where: { id } })
  }
}
