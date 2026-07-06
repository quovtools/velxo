import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import { Request } from 'express'

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseJwtGuard.name)
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    try {
      const { data, error } = await this.supabase.auth.getUser(token)

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid token')
      }

      request['user'] = data.user
      request['userId'] = data.user.id
      return true
    } catch (err) {
      this.logger.error('JWT verification failed:', err)
      throw new UnauthorizedException('Invalid token')
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization
    if (!authHeader) return null

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null

    return parts[1]
  }
}
