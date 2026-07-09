import { PrismaService } from '@/common/services/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(actorId: string, action: string, entityType: string, entityId: string, oldValue?: any, newValue?: any): Promise<{
        id: string;
        createdAt: Date;
        action: import(".prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string;
    }>;
}
