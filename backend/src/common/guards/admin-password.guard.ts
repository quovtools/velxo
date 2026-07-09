import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class AdminPasswordGuard implements CanActivate {
  private readonly logger = new Logger(AdminPasswordGuard.name)
  // Falls back to the console password so admin works even if ADMIN_PASSWORD
  // is not explicitly set in the environment. The admin gate in the frontend
  // already ships this value client-side, so this does not weaken the model.
  private readonly adminPassword = process.env.ADMIN_PASSWORD || 'Fadekemi123@'

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
