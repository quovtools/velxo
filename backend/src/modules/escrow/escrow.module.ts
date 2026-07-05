import { Module } from '@nestjs/common'
import { EscrowService } from './escrow.service'
import { EscrowController } from './escrow.controller'
import { PrismaModule } from '../../common/services/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
