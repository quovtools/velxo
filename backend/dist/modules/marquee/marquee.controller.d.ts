import { MarqueeService } from './marquee.service';
import { CreateMarqueeDto, UpdateMarqueeDto } from './dto/create-marquee.dto';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class MarqueeController {
    private marqueeService;
    private readonly logger;
    constructor(marqueeService: MarqueeService);
    getActiveItems(): Promise<ApiResponseDto<{
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
    }[]>>;
    getAllItems(): Promise<ApiResponseDto<{
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
    }[]>>;
    createItem(dto: CreateMarqueeDto): Promise<ApiResponseDto<{
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
    }>>;
    updateItem(id: string, dto: UpdateMarqueeDto): Promise<ApiResponseDto<{
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
    }>>;
    deleteItem(id: string): Promise<ApiResponseDto<any>>;
}
