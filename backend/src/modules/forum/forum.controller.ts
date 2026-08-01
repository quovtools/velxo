import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { ForumService } from './forum.service'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import {
  CreateThreadDto,
  CreatePostDto,
  UpdateThreadDto,
  UpdatePostDto,
  ForumQueryDto,
} from './dto/forum.dto'

@Controller('forum')
export class ForumController {
  private readonly logger = new Logger(ForumController.name)

  constructor(private forumService: ForumService) {}

  @Get('threads')
  async getThreads(@Query() query: ForumQueryDto) {
    try {
      const result = await this.forumService.getThreads(query)
      return ApiResponseDto.ok(result, 'Threads retrieved')
    } catch (error) {
      this.logger.error('Error fetching threads:', error)
      throw error
    }
  }

  @Get('threads/:id')
  async getThread(@Param('id') id: string) {
    try {
      const thread = await this.forumService.getThreadById(id)
      return ApiResponseDto.ok(thread, 'Thread retrieved')
    } catch (error) {
      this.logger.error('Error fetching thread:', error)
      throw error
    }
  }

  @Post('threads')
  @UseGuards(SupabaseJwtGuard)
  async createThread(@CurrentUserId() userId: string, @Body() dto: CreateThreadDto) {
    try {
      const thread = await this.forumService.createThread(userId, dto)
      return ApiResponseDto.ok(thread, 'Thread created')
    } catch (error) {
      this.logger.error('Error creating thread:', error)
      throw error
    }
  }

  @Patch('threads/:id')
  @UseGuards(SupabaseJwtGuard)
  async updateThread(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateThreadDto,
  ) {
    try {
      const thread = await this.forumService.updateThread(id, userId, dto)
      return ApiResponseDto.ok(thread, 'Thread updated')
    } catch (error) {
      this.logger.error('Error updating thread:', error)
      throw error
    }
  }

  @Delete('threads/:id')
  @UseGuards(SupabaseJwtGuard)
  async deleteThread(@CurrentUserId() userId: string, @Param('id') id: string) {
    try {
      await this.forumService.deleteThread(id, userId)
      return ApiResponseDto.ok(null, 'Thread deleted')
    } catch (error) {
      this.logger.error('Error deleting thread:', error)
      throw error
    }
  }

  @Post('threads/:threadId/posts')
  @UseGuards(SupabaseJwtGuard)
  async createPost(
    @CurrentUserId() userId: string,
    @Param('threadId') threadId: string,
    @Body() dto: CreatePostDto,
  ) {
    try {
      const post = await this.forumService.createPost(threadId, userId, dto)
      return ApiResponseDto.ok(post, 'Post created')
    } catch (error) {
      this.logger.error('Error creating post:', error)
      throw error
    }
  }

  @Patch('posts/:id')
  @UseGuards(SupabaseJwtGuard)
  async updatePost(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    try {
      const post = await this.forumService.updatePost(id, userId, dto)
      return ApiResponseDto.ok(post, 'Post updated')
    } catch (error) {
      this.logger.error('Error updating post:', error)
      throw error
    }
  }

  @Delete('posts/:id')
  @UseGuards(SupabaseJwtGuard)
  async deletePost(@CurrentUserId() userId: string, @Param('id') id: string) {
    try {
      await this.forumService.deletePost(id, userId)
      return ApiResponseDto.ok(null, 'Post deleted')
    } catch (error) {
      this.logger.error('Error deleting post:', error)
      throw error
    }
  }

  @Get('categories')
  async getCategories() {
    try {
      const categories = await this.forumService.getCategories()
      return ApiResponseDto.ok(categories, 'Categories retrieved')
    } catch (error) {
      this.logger.error('Error fetching categories:', error)
      throw error
    }
  }
}
