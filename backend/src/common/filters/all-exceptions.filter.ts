import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = null

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const response = exception.getResponse()
      message = (response as any)?.message || exception.message
      error = (response as any)?.error
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(exception.stack)
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    )

    response.status(status).json({
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
