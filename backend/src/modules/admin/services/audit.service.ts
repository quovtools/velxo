import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actorId: string, action: string, entityType: string, entityId: string, oldValue?: any, newValue?: any) {
    return this.prisma.adminAuditLogs.create({ data: { actorId, action: action as any, entityType, entityId, oldValue, newValue } })
  }
}
