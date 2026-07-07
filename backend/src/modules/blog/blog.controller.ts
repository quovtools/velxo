import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { BlogService } from './blog.service'
import { CreatePostDto } from './dto/create-post.dto'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { RequireRoles } from '@/common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get()
  async getPosts(@Query('category') category?: string) {
    const posts = await this.blogService.getPublishedPosts(category)
    return ApiResponseDto.ok(posts, 'Posts retrieved')
  }

  @Get('all')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllPosts() {
    const posts = await this.blogService.getAllPosts()
    return ApiResponseDto.ok(posts, 'All posts retrieved')
  }

  @Get(':slug')
  async getPost(@Param('slug') slug: string) {
    const post = await this.blogService.getPostBySlug(slug)
    return ApiResponseDto.ok(post, 'Post retrieved')
  }

  @Post()
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async createPost(@Body() dto: CreatePostDto) {
    const post = await this.blogService.createPost(dto)
    return ApiResponseDto.ok(post, 'Post created')
  }

  @Patch(':id')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async updatePost(@Param('id') id: string, @Body() dto: Partial<CreatePostDto>) {
    const post = await this.blogService.updatePost(id, dto)
    return ApiResponseDto.ok(post, 'Post updated')
  }

  @Delete(':id')
  @UseGuards(SupabaseJwtGuard)
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async deletePost(@Param('id') id: string) {
    await this.blogService.deletePost(id)
    return ApiResponseDto.ok(null, 'Post deleted')
  }
}
