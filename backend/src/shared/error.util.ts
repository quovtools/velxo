import { Logger } from '@nestjs/common'

/**
 * Logs an error with its message AND stack trace plus optional structured
 * metadata. Nest's `Logger.error(message, context)` treats the 2nd argument as
 * a string context, so passing an Error object there swallows the real
 * message/stack (it renders as `[object Object]`). Always use this helper (or
 * pass `error.stack` explicitly) so failures are visible in Render logs.
 */
export function logError(
  logger: Logger,
  context: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  const err = error instanceof Error ? error : new Error(String(error))
  const metaStr = meta && Object.keys(meta).length ? ` | meta: ${JSON.stringify(meta)}` : ''
  logger.error(`${context}: ${err.message}${metaStr}`, err.stack, context)
}
