import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { PrismaService } from '@/common/services/prisma.service'
import { EmailModule } from '@/modules/email/email.module'
import { AffiliateModule } from '@/modules/affiliate/affiliate.module'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'velxo-fallback-secret-change-in-prod',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    EmailModule,
    AffiliateModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
