import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { PrismaService } from '@/common/services/prisma.service'
import { EmailModule } from '@/modules/email/email.module'
import { AffiliateModule } from '@/modules/affiliate/affiliate.module'

@Module({
  imports: [
    // JwtModule is registered globally in AppModule — no need to re-register here.
    EmailModule,
    AffiliateModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
