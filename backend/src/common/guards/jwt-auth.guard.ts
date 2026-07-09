import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'velxo-fallback-secret-change-in-prod'
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      })

      // Reject tokens whose subject no longer exists (e.g. the user row was
      // wiped by a data-reset deploy). This prevents downstream foreign-key
      // crashes and forces a fresh sign-in.
      const user = await this.prisma.users.findUnique({ where: { id: payload.sub } })
      if (!user) {
        throw new UnauthorizedException('Session expired, please sign in again')
      }

      request['user'] = payload
      request['userId'] = payload.sub
      request['userRole'] = payload.role
      return true
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err
      this.logger.warn('JWT verification failed:', err?.message)
      throw new UnauthorizedException('Invalid or expired token')
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
