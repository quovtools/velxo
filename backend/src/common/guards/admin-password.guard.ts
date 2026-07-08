import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class AdminPasswordGuard implements CanActivate {
  private readonly logger = new Logger(AdminPasswordGuard.name)
  // No hardcoded fallback: an unconfigured ADMIN_PASSWORD disables admin access
  // entirely rather than exposing a known default password.
  private readonly adminPassword = process.env.ADMIN_PASSWORD || ''

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const provided = request.headers['x-admin-password']

    if (!this.adminPassword || !provided || provided !== this.adminPassword) {
      throw new UnauthorizedException('Invalid admin password')
    }

    // Provide a synthetic identity so @CurrentUserId works for audit logging
    request['userId'] = 'admin-console'
    request['userRole'] = 'ADMIN'

    return true
  }
}
