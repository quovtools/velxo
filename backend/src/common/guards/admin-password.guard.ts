import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { Request } from 'express'
import { timingSafeEqual } from 'crypto'

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

    if (!provided) {
      throw new UnauthorizedException('Invalid admin password')
    }

    // FIX C8: Use timing-safe comparison to prevent timing side-channel attacks
    // where an attacker could guess the password character by character by measuring
    // response time differences. Both buffers must be the same length for a valid compare.
    const providedStr = Array.isArray(provided) ? provided[0] : provided
    let passwordsMatch = false
    try {
      const a = Buffer.from(providedStr)
      const b = Buffer.from(this.adminPassword)
      // If lengths differ timingSafeEqual would throw — treat as mismatch.
      passwordsMatch = a.length === b.length && timingSafeEqual(a, b)
    } catch {
      passwordsMatch = false
    }

    if (!passwordsMatch) {
      throw new UnauthorizedException('Invalid admin password')
    }

    // Provide a synthetic identity so @CurrentUserId works for audit logging
    request['userId'] = 'admin-console'
    request['userRole'] = 'ADMIN'

    return true
  }
}
