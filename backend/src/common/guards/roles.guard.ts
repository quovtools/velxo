import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler())

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request['user']

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    // Q4 FIX: Removed stale TODO — role is correctly read from request['userRole']
    // which is populated by JwtAuthGuard / SupabaseJwtGuard during token validation.
    // No additional DB lookup is needed here.
    const userRole = request['userRole']

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}
