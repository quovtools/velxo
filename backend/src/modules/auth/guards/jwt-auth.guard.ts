import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Guard that validates a Bearer JWT using the 'jwt' Passport strategy
 * (registered in JwtStrategy). Extends AuthGuard so it has canActivate().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
