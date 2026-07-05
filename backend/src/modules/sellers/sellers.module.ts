import { Module } from '@nestjs/common'
import { SellersService } from './sellers.service'
import { SellersController } from './sellers.controller'
import { PrismaModule } from '../../common/services/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
