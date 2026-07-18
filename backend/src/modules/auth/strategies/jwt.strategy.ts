import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // FIX #23: Provide the same fallback as AppModule/AuthModule so the strategy
    // never receives undefined as the secret (which would cause all JWT
    // verification to fail silently or throw a configuration error).
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'velxo-fallback-secret-change-in-prod',
    })
  }

  async validate(payload: any) {
    return payload
  }
}
