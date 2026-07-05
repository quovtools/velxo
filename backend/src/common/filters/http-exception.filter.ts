import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'

export interface ApiError {
  success: boolean
  message: string
  data: null
  errors?: any[]
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter<Error> {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response<any>>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let errors: any[] | undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : typeof exceptionResponse === 'object'
            ? (exceptionResponse as any)?.message || message
            : message
      errors = Array.isArray((exceptionResponse as any)?.errors)
        ? (exceptionResponse as any).errors
        : undefined
    } else if (exception instanceof Error) {
      message = exception.message
    }

    const errorResponse: ApiError = {
      success: false,
      message,
      data: null,
      ...(errors && { errors }),
    }

    response.status(status).json(errorResponse)
  }
}
