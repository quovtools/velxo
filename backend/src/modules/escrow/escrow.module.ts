import { Module } from '@nestjs/common'
import { EscrowController } from './escrow.controller'
import { EscrowService } from './escrow.service'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationsModule } from '@/modules/notifications/notifications.module'

@Module({
  controllers: [EscrowController],
  providers: [EscrowService, PrismaService],
  exports: [EscrowService],
  imports: [NotificationsModule],
})
export class EscrowModule {}
