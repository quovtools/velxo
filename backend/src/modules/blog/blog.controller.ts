import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { BlogService } from './blog.service'
import { CreatePostDto } from './dto/create-post.dto'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
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
  @UseGuards(AdminPasswordGuard)
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
  @UseGuards(AdminPasswordGuard)
  async createPost(@Body() dto: CreatePostDto) {
    const post = await this.blogService.createPost(dto)
    return ApiResponseDto.ok(post, 'Post created')
  }

  @Patch(':id')
  @UseGuards(AdminPasswordGuard)
  async updatePost(@Param('id') id: string, @Body() dto: Partial<CreatePostDto>) {
    const post = await this.blogService.updatePost(id, dto)
    return ApiResponseDto.ok(post, 'Post updated')
  }

  @Delete(':id')
  @UseGuards(AdminPasswordGuard)
  async deletePost(@Param('id') id: string) {
    await this.blogService.deletePost(id)
    return ApiResponseDto.ok(null, 'Post deleted')
  }
}
