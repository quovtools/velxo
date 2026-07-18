import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Guard that validates email/password credentials using the 'local' Passport
 * strategy. Extends AuthGuard so it has canActivate().
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
