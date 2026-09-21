import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { AiToolsService } from './ai-tools.service'
import { SchemaService } from './schema.service'
import {
  ChatUsage,
  OpenRouterMessage,
  OpenRouterService,
  OpenRouterToolCall,
} from './openrouter.service'
import { buildAdminSystemPrompt } from '../ai.prompts'
import { toJsonSafe } from './serialize.util'

export type SseEventType =
  | 'delta'
  | 'tool_call'
  | 'tool_result'
  | 'confirmation_required'
  | 'usage'
  | 'done'
  | 'error'

export type SseEmit = (event: SseEventType, payload: Record<string, any>) => void

export interface StreamAdminChatOptions {
  actorId: string
  conversationId?: string
  message?: string
  resume?: boolean
  emit: SseEmit
  signal?: AbortSignal
}

export interface PendingActionCard {
  actionId: string
  toolName: string
  summary: string
  args: any
}

const ADMIN_SCOPE = 'admin'
const MAX_TOOL_ROUNDS = 6
const HISTORY_LIMIT = 30
const ACTION_TTL_MS = 15 * 60 * 1000
const MAX_TOOL_PAYLOAD_CHARS = 8_000
const DEFAULT_TITLE = 'New conversation'

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly openrouter: OpenRouterService,
    private readonly tools: AiToolsService,
    private readonly schema: SchemaService,
  ) {}

  getStatus() {
    return {
      enabled: this.openrouter.isEnabled(),
      primaryModel: this.openrouter.primaryModel,
      fallbackModel: this.openrouter.fallbackModel,
      calculatorModel: this.openrouter.calculatorModel,
      toolCount: this.tools.getDefinitions().length,
    }
  }

  // ─── Streaming chat ────────────────────────────────────────────────────────

  async streamAdminChat(opts: StreamAdminChatOptions): Promise<void> {
    this.openrouter.assertEnabled()
    const actorId = opts.actorId || 'admin-console'
    const conversation = await this.resolveConversation(actorId, opts.conversationId, opts.message)

    if (opts.message?.trim()) {
      const content = opts.message.trim().slice(0, 8_000)
      await this.prisma.aiMessages.create({
        data: { conversationId: conversation.id, role: 'user', content },
      })
      await this.prisma.aiConversations.update({
        where: { id: conversation.id },
        data: conversation.title === DEFAULT_TITLE ? { title: content.slice(0, 70) } : {},
      })
    }

    const catalog = await this.schema.getCatalog()
    const systemPrompt = buildAdminSystemPrompt(catalog, {
      today: new Date().toISOString().slice(0, 10),
      actorId,
    })

    const history = await this.loadHistory(conversation.id)
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ]
    const toolDefinitions = this.tools.getDefinitions()

    for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
      if (opts.signal?.aborted) return

      let content = ''
      let toolCalls: OpenRouterToolCall[] = []
      let usage: ChatUsage | null = null
      let model = this.openrouter.primaryModel

      for await (const event of this.openrouter.chatStream({
        messages,
        tools: toolDefinitions,
        temperature: 0.35,
        maxTokens: 2_048,
        signal: opts.signal,
      })) {
        if (event.type === 'model') model = event.model
        else if (event.type === 'delta') {
          content += event.content
          opts.emit('delta', { content: event.content })
        } else if (event.type === 'tool_calls') toolCalls = event.toolCalls
        else if (event.type === 'usage') usage = event.usage
      }

      await this.prisma.aiMessages.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content,
          toolCalls: toolCalls.length ? (toolCalls as any) : undefined,
          model,
          tokensInput: usage?.promptTokens ?? null,
          tokensOutput: usage?.completionTokens ?? null,
        },
      })
      messages.push({
        role: 'assistant',
        content,
        tool_calls: toolCalls.length ? toolCalls : undefined,
      })

      if (!toolCalls.length) {
        opts.emit('done', { conversationId: conversation.id, finishReason: 'stop' })
        return
      }

      const pendingCards: PendingActionCard[] = []

      for (const call of toolCalls) {
        if (opts.signal?.aborted) return
        const name = call.function?.name
        const args = this.parseArgs(call.function.arguments)
        opts.emit('tool_call', { id: call.id, name, args })

        if (!name || !this.tools.get(name)) {
          const note = JSON.stringify({ ok: false, error: `Unknown tool "${name}"` })
          await this.pushToolMessage(conversation.id, call.id, name, note, messages)
          opts.emit('tool_result', { id: call.id, name, ok: false, summary: note })
          continue
        }

        if (this.tools.requiresConfirmation(name)) {
          const summary = await this.tools.describe(name, args)
          const action = await this.prisma.aiPendingActions.create({
            data: {
              conversationId: conversation.id,
              toolName: name,
              toolCallId: call.id,
              args: args as any,
              summary,
              expiresAt: new Date(Date.now() + ACTION_TTL_MS),
            },
          })
          const note = JSON.stringify({
            status: 'awaiting_confirmation',
            actionId: action.id,
            summary,
            instruction:
              'The platform is waiting for the admin to confirm or cancel this action. It has NOT run yet — ' +
              'do not claim it has. Tell the admin what is waiting and stop.',
          })
          await this.pushToolMessage(conversation.id, call.id, name, note, messages)
          pendingCards.push({ actionId: action.id, toolName: name, summary, args })
          continue
        }

        const result = await this.tools.execute(name, args, {
          actorId,
          conversationId: conversation.id,
        })
        const payload = this.toolPayload(result)
        await this.pushToolMessage(conversation.id, call.id, name, payload, messages)
        opts.emit('tool_result', {
          id: call.id,
          name,
          ok: result.ok,
          summary: result.summary,
        })
      }

      if (usage) {
        opts.emit('usage', {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        })
      }

      if (pendingCards.length) {
        opts.emit('confirmation_required', { actions: pendingCards })
        opts.emit('done', { conversationId: conversation.id, finishReason: 'confirmation_required' })
        return
      }
    }

    this.logger.warn(`conversation ${conversation.id} hit the ${MAX_TOOL_ROUNDS}-round tool limit`)
    opts.emit('done', {
      conversationId: conversation.id,
      finishReason: 'tool_limit',
      message: 'Stopped after the maximum number of tool rounds — ask a narrower follow-up question.',
    })
  }

  // ─── Confirmation gate ─────────────────────────────────────────────────────

  async confirmAction(params: {
    actorId: string
    actionId: string
    decision: 'confirm' | 'cancel'
  }): Promise<{ status: string; ok: boolean; summary: string; conversationId: string }> {
    const action = await this.prisma.aiPendingActions.findUnique({
      where: { id: params.actionId },
      include: { conversation: { select: { id: true, ownerKey: true, scope: true } } },
    })

    if (!action || action.conversation.ownerKey !== params.actorId || action.conversation.scope !== ADMIN_SCOPE) {
      throw new NotFoundException('Action not found')
    }
    if (action.status !== 'PENDING') {
      throw new ConflictException(`This action was already ${action.status.toLowerCase()}.`)
    }
    if (action.expiresAt.getTime() < Date.now()) {
      await this.prisma.aiPendingActions.update({
        where: { id: action.id },
        data: { status: 'EXPIRED' },
      })
      throw new ConflictException('This confirmation expired. Ask the assistant to propose it again.')
    }

    const conversationId = action.conversationId

    if (params.decision === 'cancel') {
      await this.prisma.$transaction([
        this.prisma.aiPendingActions.update({
          where: { id: action.id },
          data: { status: 'CANCELLED' },
        }),
        this.prisma.aiMessages.updateMany({
          where: { conversationId, toolCallId: action.toolCallId ?? undefined },
          data: {
            content: JSON.stringify({
              status: 'cancelled',
              summary: action.summary,
              instruction: 'The admin declined this action. It was NOT executed. Acknowledge briefly.',
            }),
          },
        }),
      ])
      return { status: 'CANCELLED', ok: true, summary: action.summary, conversationId }
    }

    const result = await this.tools.execute(action.toolName, action.args as any, {
      actorId: params.actorId,
      conversationId,
    })
    const payload = this.toolPayload(result)

    await this.prisma.$transaction([
      this.prisma.aiPendingActions.update({
        where: { id: action.id },
        data: {
          status: result.ok ? 'CONFIRMED' : 'CANCELLED',
          result: toJsonSafe({ ok: result.ok, summary: result.summary }) as any,
        },
      }),
      this.prisma.aiMessages.updateMany({
        where: { conversationId, toolCallId: action.toolCallId ?? undefined },
        data: { content: payload },
      }),
    ])

    this.logger.log(
      `confirmed action=${action.toolName} id=${action.id} ok=${result.ok} actor=${params.actorId}`,
    )

    return {
      status: result.ok ? 'CONFIRMED' : 'CANCELLED',
      ok: result.ok,
      summary: result.summary,
      conversationId,
    }
  }

  // ─── Conversation management ───────────────────────────────────────────────

  async listConversations(actorId: string) {
    const conversations = await this.prisma.aiConversations.findMany({
      where: { ownerKey: actorId, scope: ADMIN_SCOPE },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })
    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c._count.messages,
    }))
  }

  async getConversation(actorId: string, id: string) {
    const conversation = await this.prisma.aiConversations.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 300 },
        actions: {
          where: { status: 'PENDING', expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!conversation || conversation.ownerKey !== actorId || conversation.scope !== ADMIN_SCOPE) {
      throw new NotFoundException('Conversation not found')
    }

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        toolName: m.toolName,
        model: m.model,
        createdAt: m.createdAt,
      })),
      pendingActions: conversation.actions.map((a) => ({
        actionId: a.id,
        toolName: a.toolName,
        summary: a.summary,
        args: a.args,
        expiresAt: a.expiresAt,
      })),
    }
  }

  async deleteConversation(actorId: string, id: string) {
    const conversation = await this.prisma.aiConversations.findUnique({
      where: { id },
      select: { ownerKey: true, scope: true },
    })
    if (!conversation || conversation.ownerKey !== actorId || conversation.scope !== ADMIN_SCOPE) {
      throw new NotFoundException('Conversation not found')
    }
    await this.prisma.aiConversations.delete({ where: { id } })
    return { deleted: true }
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private async resolveConversation(actorId: string, id?: string, message?: string) {
    if (id) {
      const existing = await this.prisma.aiConversations.findUnique({ where: { id } })
      if (!existing || existing.ownerKey !== actorId || existing.scope !== ADMIN_SCOPE) {
        throw new NotFoundException('Conversation not found')
      }
      return existing
    }
    return this.prisma.aiConversations.create({
      data: {
        ownerKey: actorId,
        scope: ADMIN_SCOPE,
        title: message?.trim() ? message.trim().slice(0, 70) : DEFAULT_TITLE,
      },
    })
  }

  private async loadHistory(conversationId: string): Promise<OpenRouterMessage[]> {
    const rows = await this.prisma.aiMessages.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    })

    return rows
      .reverse()
      .map((row) => {
        if (row.role === 'tool') {
          return {
            role: 'tool' as const,
            content: row.content,
            tool_call_id: row.toolCallId ?? undefined,
            name: row.toolName ?? undefined,
          }
        }
        if (row.role === 'assistant') {
          const calls = Array.isArray(row.toolCalls) ? (row.toolCalls as any[]) : []
          return {
            role: 'assistant' as const,
            content: row.content || '',
            tool_calls: calls.length
              ? calls.map((c) => ({
                  id: c?.id,
                  type: 'function' as const,
                  function: {
                    name: c?.function?.name,
                    arguments: c?.function?.arguments ?? '{}',
                  },
                }))
              : undefined,
          }
        }
        return { role: 'user' as const, content: row.content }
      })
  }

  private async pushToolMessage(
    conversationId: string,
    toolCallId: string,
    toolName: string | undefined,
    content: string,
    messages: OpenRouterMessage[],
  ) {
    await this.prisma.aiMessages.create({
      data: {
        conversationId,
        role: 'tool',
        content,
        toolCallId,
        toolName: toolName ?? null,
      },
    })
    messages.push({
      role: 'tool',
      content,
      tool_call_id: toolCallId,
      name: toolName,
    })
  }

  private toolPayload(result: { ok: boolean; summary: string; data?: any }): string {
    const serialized = JSON.stringify(
      toJsonSafe({ ok: result.ok, summary: result.summary, data: result.data }),
    )
    if (serialized.length <= MAX_TOOL_PAYLOAD_CHARS) return serialized
    return (
      serialized.slice(0, MAX_TOOL_PAYLOAD_CHARS) +
      '… [truncated — ask a narrower question if you need the rest]'
    )
  }

  private parseArgs(raw: string): any {
    if (!raw || !raw.trim()) return {}
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      this.logger.warn(`Could not parse tool arguments: ${raw.slice(0, 200)}`)
      return {}
    }
  }
}
