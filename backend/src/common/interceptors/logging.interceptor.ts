import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest()
    const method = req.method
    const url = req.url
    const now = Date.now()

    // FIX #32: Use NestJS Logger instead of console.log for structured logging
    // that respects the application's logger configuration and log levels.
    this.logger.log(`${method} ${url}`)
    return next.handle().pipe(
      tap(() => this.logger.log(`${method} ${url} ${Date.now() - now}ms`)),
    )
  }
}
