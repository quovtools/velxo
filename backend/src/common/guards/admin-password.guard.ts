import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class AdminPasswordGuard implements CanActivate {
  private readonly logger = new Logger(AdminPasswordGuard.name)
  private readonly adminPassword = process.env.ADMIN_PASSWORD

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const provided = request.headers['x-admin-password']

    if (!this.adminPassword) {
      this.logger.error('ADMIN_PASSWORD env var is not set — admin access is blocked')
      throw new UnauthorizedException('Admin access is not configured')
    }

    if (!provided || provided !== this.adminPassword) {
      throw new UnauthorizedException('Invalid admin password')
    }

    // Provide a synthetic identity so @CurrentUserId works for audit logging
    request['userId'] = 'admin-console'
    request['userRole'] = 'ADMIN'

    return true
  }
}
