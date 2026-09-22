import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { AiChatService } from './services/ai-chat.service'
import { ValuationService } from './services/valuation.service'
import { OpenRouterService } from './services/openrouter.service'
import { AiRateLimitService } from './services/ai-rate-limit.service'
import { AdminChatDto, ConfirmActionDto, ValuationFeedbackDto, ValuationRequestDto } from './dto/ai.dto'

const ADMIN_RATE_RULE = { perMinute: 30, perDay: 3_000 }
const VALUATION_RATE_RULE = { perMinute: 5, perDay: 200 }
const FEEDBACK_RATE_RULE = { perMinute: 10, perDay: 500 }

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name)

  constructor(
    private readonly chat: AiChatService,
    private readonly valuation: ValuationService,
    private readonly openrouter: OpenRouterService,
    private readonly rateLimit: AiRateLimitService,
  ) {}

  // ─── Admin assistant ───────────────────────────────────────────────────────

  @Post('admin/chat')
  @UseGuards(AdminPasswordGuard)
  async adminChat(
    @Body() dto: AdminChatDto,
    @CurrentUserId() actorId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.assertAiEnabled()

    if (!dto.message?.trim() && !dto.resume) {
      throw new BadRequestException('Provide a message, or set resume=true to continue after a confirmed action.')
    }

    const verdict = this.rateLimit.check('admin-chat', this.rateLimit.clientKey(req), ADMIN_RATE_RULE)
    if (!verdict.allowed) {
      res.status(429).json({
        success: false,
        message: verdict.reason ?? 'Too many requests.',
        retryAfterSeconds: verdict.retryAfterSeconds,
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const emit = (event: string, payload: Record<string, any>) => {
      if (res.writableEnded || res.destroyed) return
      res.write(`data: ${JSON.stringify({ event, ...payload })}\n\n`)
    }

    const abort = new AbortController()
    req.on('close', () => abort.abort())

    let wroteError = false
    try {
      await this.chat.streamAdminChat({
        actorId,
        conversationId: dto.conversationId,
        message: dto.message,
        resume: dto.resume,
        emit,
        signal: abort.signal,
      })
    } catch (err: any) {
      wroteError = true
      this.logger.error(`admin chat stream failed: ${err?.message || err}`)
      emit('error', { message: err?.response?.message || err?.message || 'The assistant hit an unexpected error.' })
    } finally {
      if (!res.writableEnded && !res.destroyed) {
        if (wroteError) emit('done', { finishReason: 'error' })
        res.end()
      }
    }
  }

  @Get('admin/status')
  @UseGuards(AdminPasswordGuard)
  getStatus() {
    return ApiResponseDto.ok({ ...this.chat.getStatus(), aiEnabled: this.isAiEnabled() }, 'AI status')
  }

  @Get('admin/conversations')
  @UseGuards(AdminPasswordGuard)
  listConversations(@CurrentUserId() actorId: string) {
    return ApiResponseDto.ok(this.chat.listConversations(actorId), 'Conversations retrieved')
  }

  @Get('admin/conversations/:id')
  @UseGuards(AdminPasswordGuard)
  getConversation(@CurrentUserId() actorId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(this.chat.getConversation(actorId, id), 'Conversation retrieved')
  }

  @Delete('admin/conversations/:id')
  @UseGuards(AdminPasswordGuard)
  async deleteConversation(@CurrentUserId() actorId: string, @Param('id') id: string) {
    const result = await this.chat.deleteConversation(actorId, id)
    return ApiResponseDto.ok(result, 'Conversation deleted')
  }

  @Post('admin/confirm')
  @UseGuards(AdminPasswordGuard)
  confirmAction(@Body() dto: ConfirmActionDto, @CurrentUserId() actorId: string) {
    return ApiResponseDto.ok(
      this.chat.confirmAction({ actorId, actionId: dto.actionId, decision: dto.decision }),
      'Action processed',
    )
  }

  // ─── Public account value calculator ───────────────────────────────────────

  @Post('value-estimate')
  @HttpCode(200)
  async valueEstimate(@Body() dto: ValuationRequestDto, @Req() req: Request) {
    this.assertAiEnabled()

    const verdict = this.rateLimit.check('valuation', this.rateLimit.clientKey(req), VALUATION_RATE_RULE)
    if (!verdict.allowed) {
      throw new HttpException(
        { message: verdict.reason ?? 'Too many requests.', retryAfterSeconds: verdict.retryAfterSeconds },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    const result = await this.valuation.estimate({
      gameName: dto.gameName,
      category: dto.category,
      rank: dto.rank,
      level: dto.level,
      platform: dto.platform,
      region: dto.region,
      loginMethod: dto.loginMethod,
      skinsCount: dto.skinsCount,
      price: dto.price,
    })
    return ApiResponseDto.ok(result, 'Estimate ready')
  }

  @Post('value-feedback')
  @HttpCode(200)
  async valueFeedback(@Body() dto: ValuationFeedbackDto, @Req() req: Request) {
    const verdict = this.rateLimit.check('valuation-feedback', this.rateLimit.clientKey(req), FEEDBACK_RATE_RULE)
    if (!verdict.allowed) {
      throw new HttpException(
        { message: verdict.reason ?? 'Too many requests.', retryAfterSeconds: verdict.retryAfterSeconds },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
    const result = await this.valuation.recordFeedback(dto)
    return ApiResponseDto.ok(result, 'Feedback recorded')
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private isAiEnabled(): boolean {
    return process.env.AI_ENABLED !== 'false' && this.openrouter.isEnabled()
  }

  private assertAiEnabled(): void {
    if (process.env.AI_ENABLED === 'false') {
      throw new ServiceUnavailableException('The AI assistant is disabled on this server.')
    }
    this.openrouter.assertEnabled()
  }
}
