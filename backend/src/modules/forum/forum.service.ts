import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateThreadDto, CreatePostDto, UpdateThreadDto, UpdatePostDto, ForumQueryDto } from './dto/forum.dto'

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name)

  constructor(private prisma: PrismaService) {}

  async getThreads(query: ForumQueryDto) {
    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}
    if (query.category) where.category = query.category
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [threads, total] = await Promise.all([
      this.prisma.forumThreads.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          posts: { where: { isHidden: false }, select: { id: true } },
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.forumThreads.count({ where }),
    ])

    return {
      threads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  async getThreadById(id: string) {
    const thread = await this.prisma.forumThreads.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        posts: {
          where: { isHidden: false },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { posts: true } },
      },
    })
    return thread
  }

  async createThread(authorId: string, dto: CreateThreadDto) {
    const thread = await this.prisma.forumThreads.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category || 'General',
        tags: dto.tags || [],
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })
    return thread
  }

  async updateThread(id: string, authorId: string, dto: UpdateThreadDto) {
    const thread = await this.prisma.forumThreads.findUnique({ where: { id } })
    if (!thread) throw new Error('Thread not found')
    if (thread.authorId !== authorId) throw new Error('Not authorized')

    return this.prisma.forumThreads.update({
      where: { id },
      data: dto,
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    })
  }

  async deleteThread(id: string, authorId: string) {
    const thread = await this.prisma.forumThreads.findUnique({ where: { id } })
    if (!thread) throw new Error('Thread not found')
    if (thread.authorId !== authorId) throw new Error('Not authorized')

    return this.prisma.forumThreads.delete({ where: { id } })
  }

  async createPost(threadId: string, authorId: string, dto: CreatePostDto) {
    const thread = await this.prisma.forumThreads.findUnique({ where: { id: threadId } })
    if (!thread) throw new Error('Thread not found')
    if (thread.isLocked) throw new Error('Thread is locked')

    const post = await this.prisma.forumPosts.create({
      data: {
        content: dto.content,
        threadId,
        authorId,
        parentId: dto.parentId || null,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    await this.prisma.forumThreads.update({
      where: { id: threadId },
      data: { lastActivityAt: new Date() },
    })

    return post
  }

  async updatePost(id: string, authorId: string, dto: UpdatePostDto) {
    const post = await this.prisma.forumPosts.findUnique({ where: { id } })
    if (!post) throw new Error('Post not found')
    if (post.authorId !== authorId) throw new Error('Not authorized')

    return this.prisma.forumPosts.update({
      where: { id },
      data: dto,
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    })
  }

  async deletePost(id: string, authorId: string) {
    const post = await this.prisma.forumPosts.findUnique({ where: { id } })
    if (!post) throw new Error('Post not found')
    if (post.authorId !== authorId) throw new Error('Not authorized')

    return this.prisma.forumPosts.delete({ where: { id } })
  }

  async getCategories() {
    const categories = await this.prisma.forumThreads.findMany({
      select: { category: true },
      distinct: ['category'],
    })
    return categories.map((c) => c.category)
  }
}
