import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response, Request } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let errors: any = undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any)?.message || exception.message
        errors = (exceptionResponse as any)?.errors
      }
    } else if (exception instanceof Error) {
      message = exception.message
    }

    // ── Detailed Render log ──────────────────────────────────────────────────
    const logContext = {
      method: request.method,
      url: request.url,
      status,
      message,
      // Scrub sensitive fields from body before logging
      body: this.scrubBody(request.body),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }

    if (status >= 500) {
      // Server errors: log full stack so Render shows the root cause
      this.logger.error(
        `[${logContext.method}] ${logContext.url} → ${status} | ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
      this.logger.error('Request context: ' + JSON.stringify(logContext))
    } else {
      // Client errors (4xx): log as warnings — less noise, still visible
      this.logger.warn(
        `[${logContext.method}] ${logContext.url} → ${status} | ${message} | body: ${JSON.stringify(logContext.body)}`,
      )
    }
    // ────────────────────────────────────────────────────────────────────────

    const body: Record<string, any> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    }
    if (errors !== undefined) body.errors = errors

    response.status(status).json(body)
  }

  /** Remove password / token fields before logging request bodies */
  private scrubBody(body: any): any {
    if (!body || typeof body !== 'object') return body
    const scrubbed = { ...body }
    const sensitiveKeys = ['password', 'newPassword', 'oldPassword', 'token', 'accessToken', 'refreshToken']
    for (const key of sensitiveKeys) {
      if (key in scrubbed) scrubbed[key] = '[REDACTED]'
    }
    return scrubbed
  }
}
