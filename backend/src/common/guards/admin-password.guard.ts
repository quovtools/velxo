import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class AdminPasswordGuard implements CanActivate {
  private readonly logger = new Logger(AdminPasswordGuard.name)
  private readonly adminPassword = process.env.ADMIN_PASSWORD || 'Fsdekemi123@'

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const provided = request.headers['x-admin-password']

    if (!provided || provided !== this.adminPassword) {
      throw new UnauthorizedException('Invalid admin password')
    }

    // Provide a synthetic identity so @CurrentUserId works for audit logging
    request['userId'] = 'admin-console'
    request['userRole'] = 'ADMIN'

    return true
  }
}
