import { PrismaService } from '@/common/services/prisma.service';
export declare class SlidesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getActiveSlides(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        imageUrl: string;
        sortOrder: number;
        subtitle: string | null;
        linkHref: string | null;
        badge: string | null;
    }[]>;
    getAllSlides(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        imageUrl: string;
        sortOrder: number;
        subtitle: string | null;
        linkHref: string | null;
        badge: string | null;
    }[]>;
    createSlide(data: {
        title: string;
        subtitle?: string;
        imageUrl: string;
        linkHref?: string;
        badge?: string;
        isActive?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        imageUrl: string;
        sortOrder: number;
        subtitle: string | null;
        linkHref: string | null;
        badge: string | null;
    }>;
    updateSlide(id: string, data: Partial<{
        title: string;
        subtitle: string;
        imageUrl: string;
        linkHref: string;
        badge: string;
        isActive: boolean;
        sortOrder: number;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        imageUrl: string;
        sortOrder: number;
        subtitle: string | null;
        linkHref: string | null;
        badge: string | null;
    }>;
    deleteSlide(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        imageUrl: string;
        sortOrder: number;
        subtitle: string | null;
        linkHref: string | null;
        badge: string | null;
    }>;
}
