import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AdminModule } from '@/modules/admin/admin.module'
import { PrismaService } from '@/common/services/prisma.service'
import { OpenRouterService } from './services/openrouter.service'
import { SchemaService } from './services/schema.service'
import { SqlGuardService } from './services/sql-guard.service'
import { SqlExecutorService } from './services/sql-executor.service'
import { AiToolsService } from './services/ai-tools.service'
import { AiChatService } from './services/ai-chat.service'
import { ValuationService } from './services/valuation.service'
import { AiRateLimitService } from './services/ai-rate-limit.service'

@Module({
  imports: [AdminModule],
  controllers: [AiController],
  providers: [
    OpenRouterService,
    SchemaService,
    SqlGuardService,
    SqlExecutorService,
    AiToolsService,
    AiChatService,
    ValuationService,
    AiRateLimitService,
    PrismaService,
  ],
  exports: [AiChatService, ValuationService],
})
export class AiModule {}
