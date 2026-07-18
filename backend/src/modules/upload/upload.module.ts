import { Module } from '@nestjs/common'
import { UploadController } from './upload.controller'
import { StorageService } from './storage.service'
import { PrismaModule } from '@/common/services/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [StorageService],
  exports: [StorageService],
})
export class UploadModule {}
