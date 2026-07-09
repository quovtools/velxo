import { PrismaService } from '@/common/services/prisma.service';
export declare class MarqueeService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getActiveItems(): Promise<{
        text: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        icon: string | null;
        sortOrder: number;
        linkHref: string | null;
        linkText: string | null;
        color: string | null;
    }[]>;
    getAllItems(): Promise<{
        text: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        icon: string | null;
        sortOrder: number;
        linkHref: string | null;
        linkText: string | null;
        color: string | null;
    }[]>;
    createItem(data: {
        text: string;
        linkHref?: string;
        linkText?: string;
        icon?: string;
        color?: string;
        isActive?: boolean;
        sortOrder?: number;
    }): Promise<{
        text: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        icon: string | null;
        sortOrder: number;
        linkHref: string | null;
        linkText: string | null;
        color: string | null;
    }>;
    updateItem(id: string, data: Partial<{
        text: string;
        linkHref: string;
        linkText: string;
        icon: string;
        color: string;
        isActive: boolean;
        sortOrder: number;
    }>): Promise<{
        text: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        icon: string | null;
        sortOrder: number;
        linkHref: string | null;
        linkText: string | null;
        color: string | null;
    }>;
    deleteItem(id: string): Promise<{
        text: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        icon: string | null;
        sortOrder: number;
        linkHref: string | null;
        linkText: string | null;
        color: string | null;
    }>;
}
