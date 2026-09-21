import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenRouterToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: OpenRouterToolCall[]
  tool_call_id?: string
  name?: string
}

export interface OpenRouterToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export interface ChatUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ChatResult {
  content: string
  toolCalls: OpenRouterToolCall[]
  finishReason: string | null
  model: string
  usage: ChatUsage
}

export type StreamEvent =
  | { type: 'model'; model: string }
  | { type: 'delta'; content: string }
  | { type: 'tool_calls'; toolCalls: OpenRouterToolCall[] }
  | { type: 'usage'; usage: ChatUsage }
  | { type: 'done'; finishReason: string | null }

interface ChatOptions {
  messages: OpenRouterMessage[]
  tools?: OpenRouterToolDefinition[]
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  temperature?: number
  maxTokens?: number
  /** Override the primary model (e.g. a cheaper model for the public calculator). */
  model?: string
  /** Aborted when the HTTP client disconnects, so we stop burning tokens. */
  signal?: AbortSignal
}

// ─── Service ─────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = 'inclusionai/ling-3.0-flash-vl:free'
const DEFAULT_FALLBACK = 'qwen/qwen3.8-27b:free'
const MAX_ATTEMPTS_PER_MODEL = 3
const RETRY_BASE_DELAY_MS = 700
const MAX_INLINE_RETRY_WAIT_MS = 5_000
const DEFAULT_TIMEOUT_MS = 90_000
const STREAM_IDLE_TIMEOUT_MS = 45_000

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name)

  private readonly apiKey = process.env.OPENROUTER_API_KEY?.trim()
  private readonly baseUrl = 'https://openrouter.ai/api/v1'
  private readonly appUrl = process.env.OPENROUTER_APP_URL || 'https://app.piyrox.shop'
  private readonly timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS

  readonly primaryModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL
  readonly fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK
  readonly calculatorModel =
    process.env.OPENROUTER_MODEL_CALCULATOR?.trim() || this.primaryModel

  isEnabled(): boolean {
    return Boolean(this.apiKey)
  }

  /** Throws a friendly 503 when the key is absent so callers can degrade gracefully. */
  assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'The AI assistant is not configured on this server (missing OPENROUTER_API_KEY).',
      )
    }
  }

  // ─── Non-streaming ─────────────────────────────────────────────────────────

  async chat(options: ChatOptions): Promise<ChatResult> {
    this.assertEnabled()
    const chain = this.modelChain(options.model)
    let lastError: any = null

    for (const model of chain) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeoutMs)
        const unlink = this.linkSignal(options.signal, controller)
        try {
          const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(this.buildBody(options, model, false)),
            signal: controller.signal,
          })

          if (!res.ok) {
            const { retryable, retryAfterMs, detail } = await this.describeFailure(res)
            lastError = new Error(`OpenRouter ${res.status}: ${detail}`)
            this.logger.warn(`model=${model} attempt=${attempt} → ${lastError.message}`)

            if (!retryable) break // move to next model
            if (retryAfterMs !== null && retryAfterMs > MAX_INLINE_RETRY_WAIT_MS) {
              this.logger.warn(`model=${model} rate-limited for ${retryAfterMs}ms — trying fallback model`)
              attempt = MAX_ATTEMPTS_PER_MODEL
              continue
            }
            if (attempt < MAX_ATTEMPTS_PER_MODEL) {
              await this.sleep(this.backoffMs(attempt, retryAfterMs))
              continue
            }
            break
          }

          const json: any = await res.json()
          const choice = json?.choices?.[0]
          const message = choice?.message ?? {}
          return {
            content: typeof message.content === 'string' ? message.content : '',
            toolCalls: this.normalizeToolCalls(message.tool_calls),
            finishReason: choice?.finish_reason ?? null,
            model: json?.model || model,
            usage: this.normalizeUsage(json?.usage),
          }
        } catch (err: any) {
          lastError = err
          const aborted = err?.name === 'AbortError'
          this.logger.warn(
            `model=${model} attempt=${attempt} → ${aborted ? 'timed out' : err?.message || err}`,
          )
          if (attempt < MAX_ATTEMPTS_PER_MODEL) {
            await this.sleep(this.backoffMs(attempt, null))
            continue
          }
          break
        } finally {
          clearTimeout(timer)
          unlink()
        }
      }
    }

    throw new ServiceUnavailableException(
      `AI model unavailable right now. ${lastError?.message ? `(${lastError.message})` : ''}`.trim(),
    )
  }

  // ─── Streaming ─────────────────────────────────────────────────────────────

  /**
   * Streams a completion. Retries/falls back only while nothing has been emitted
   * yet — once the caller has received a delta we can no longer restart cleanly.
   */
  async *chatStream(options: ChatOptions): AsyncGenerator<StreamEvent> {
    this.assertEnabled()
    const chain = this.modelChain(options.model)
    let lastError: any = null

    for (const model of chain) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
        let started = false
        const controller = new AbortController()
        let idleTimer: NodeJS.Timeout | null = null
        const resetIdle = () => {
          if (idleTimer) clearTimeout(idleTimer)
          idleTimer = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS)
        }
        const unlink = this.linkSignal(options.signal, controller)

        try {
          resetIdle()
          const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(this.buildBody(options, model, true)),
            signal: controller.signal,
          })

          if (!res.ok || !res.body) {
            const { retryable, retryAfterMs, detail } = await this.describeFailure(res)
            lastError = new Error(`OpenRouter ${res.status}: ${detail}`)
            this.logger.warn(`[stream] model=${model} attempt=${attempt} → ${lastError.message}`)
            if (!retryable) break
            if (retryAfterMs !== null && retryAfterMs > MAX_INLINE_RETRY_WAIT_MS) {
              attempt = MAX_ATTEMPTS_PER_MODEL
              continue
            }
            if (attempt < MAX_ATTEMPTS_PER_MODEL) {
              await this.sleep(this.backoffMs(attempt, retryAfterMs))
              continue
            }
            break
          }

          yield { type: 'model', model }

          const toolCallAcc = new Map<number, { id: string; name: string; args: string }>()
          let finishReason: string | null = null
          let usage: ChatUsage | null = null
          let emittedToolCalls = false

          for await (const payload of this.readSse(res.body)) {
            started = true
            resetIdle()

            if (payload === '[DONE]') break

            let chunk: any
            try {
              chunk = JSON.parse(payload)
            } catch {
              continue
            }

            if (chunk?.error) {
              throw new Error(chunk.error?.message || 'Upstream model error')
            }

            const choice = chunk?.choices?.[0]
            const delta = choice?.delta

            if (typeof delta?.content === 'string' && delta.content.length > 0) {
              yield { type: 'delta', content: delta.content }
            }

            if (Array.isArray(delta?.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const idx = typeof tc.index === 'number' ? tc.index : 0
                const acc = toolCallAcc.get(idx) ?? { id: '', name: '', args: '' }
                if (tc.id) acc.id = tc.id
                if (tc.function?.name) acc.name = tc.function.name
                if (typeof tc.function?.arguments === 'string') acc.args += tc.function.arguments
                toolCallAcc.set(idx, acc)
                emittedToolCalls = true
              }
            }

            if (choice?.finish_reason) finishReason = choice.finish_reason
            if (chunk?.usage) usage = this.normalizeUsage(chunk.usage)
          }

          if (toolCallAcc.size > 0) {
            yield {
              type: 'tool_calls',
              toolCalls: [...toolCallAcc.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([idx, acc]) => ({
                  id: acc.id || `call_${idx}_${Date.now()}`,
                  type: 'function' as const,
                  function: { name: acc.name, arguments: acc.args || '{}' },
                })),
            }
          }

          if (usage) yield { type: 'usage', usage }
          yield { type: 'done', finishReason: emittedToolCalls ? 'tool_calls' : finishReason }
          return
        } catch (err: any) {
          if (started) {
            // Mid-stream failure: surface it rather than silently restarting.
            this.logger.error(`[stream] model=${model} failed mid-stream: ${err?.message || err}`)
            throw err
          }
          lastError = err
          const aborted = err?.name === 'AbortError'
          this.logger.warn(
            `[stream] model=${model} attempt=${attempt} → ${aborted ? 'timed out' : err?.message || err}`,
          )
          if (attempt < MAX_ATTEMPTS_PER_MODEL) {
            await this.sleep(this.backoffMs(attempt, null))
            continue
          }
          break
        } finally {
          if (idleTimer) clearTimeout(idleTimer)
          unlink()
        }
      }
    }

    throw new ServiceUnavailableException(
      `AI model unavailable right now. ${lastError?.message ? `(${lastError.message})` : ''}`.trim(),
    )
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.appUrl,
      'X-Title': 'Piyrox Market',
    }
  }

  private buildBody(options: ChatOptions, model: string, stream: boolean) {
    const body: Record<string, any> = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2_048,
      stream,
    }
    if (stream) body.stream_options = { include_usage: true }
    if (options.tools?.length) {
      body.tools = options.tools
      body.tool_choice = options.toolChoice ?? 'auto'
      body.parallel_tool_calls = false
    }
    return body
  }

  private modelChain(preferred?: string): string[] {
    return [...new Set([preferred, this.primaryModel, this.fallbackModel].filter(Boolean))] as string[]
  }

  private async describeFailure(
    res: Response,
  ): Promise<{ retryable: boolean; retryAfterMs: number | null; detail: string }> {
    let detail = res.statusText
    try {
      const text = await res.text()
      if (text) {
        try {
          const json = JSON.parse(text)
          detail = json?.error?.message || json?.message || text.slice(0, 300)
        } catch {
          detail = text.slice(0, 300)
        }
      }
    } catch {
      /* body already consumed or unreadable */
    }

    const retryHeader = res.headers.get('retry-after')
    let retryAfterMs: number | null = null
    if (retryHeader) {
      const seconds = Number(retryHeader)
      retryAfterMs = Number.isFinite(seconds)
        ? Math.round(seconds * 1000)
        : Math.max(0, Date.parse(retryHeader) - Date.now()) || null
    }

    const retryable = res.status === 408 || res.status === 409 || res.status === 429 || res.status >= 500
    return { retryable, retryAfterMs, detail }
  }

  private normalizeToolCalls(raw: any): OpenRouterToolCall[] {
    if (!Array.isArray(raw)) return []
    return raw
      .filter((tc) => tc?.function?.name)
      .map((tc, idx) => ({
        id: tc.id || `call_${idx}_${Date.now()}`,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: typeof tc.function.arguments === 'string' ? tc.function.arguments : '{}',
        },
      }))
  }

  private normalizeUsage(raw: any): ChatUsage {
    return {
      promptTokens: Number(raw?.prompt_tokens) || 0,
      completionTokens: Number(raw?.completion_tokens) || 0,
      totalTokens: Number(raw?.total_tokens) || 0,
    }
  }

  private backoffMs(attempt: number, retryAfterMs: number | null): number {
    if (retryAfterMs !== null && retryAfterMs > 0) {
      return Math.min(retryAfterMs, MAX_INLINE_RETRY_WAIT_MS)
    }
    const base = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
    return Math.round(base * (0.75 + Math.random() * 0.5))
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /** Forwards an external abort (client disconnect) to our internal controller. */
  private linkSignal(external: AbortSignal | undefined, controller: AbortController): () => void {
    if (!external) return () => undefined
    if (external.aborted) {
      controller.abort()
      return () => undefined
    }
    const onAbort = () => controller.abort()
    external.addEventListener('abort', onAbort, { once: true })
    return () => external.removeEventListener('abort', onAbort)
  }

  /** Yields each SSE `data:` payload in order. */
  private async *readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let sep: number
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          for (const line of block.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            yield trimmed.slice(5).trim()
          }
        }
      }
      const tail = buffer.trim()
      if (tail.startsWith('data:')) yield tail.slice(5).trim()
    } finally {
      reader.releaseLock?.()
    }
  }
}
