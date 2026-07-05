import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'

@Injectable()
export class LocalAuthGuard extends PassportStrategy(Strategy) {
  constructor() {
    super({ usernameField: 'email' })
  }

  async validate(email: string, password: string) {
    // Validate handled in auth controller
    return { email, passwordHash: password }
  }
}
