import { SlidesService } from './slides.service';
import { CreateSlideDto, UpdateSlideDto } from './dto/create-slide.dto';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class SlidesController {
    private slidesService;
    private readonly logger;
    constructor(slidesService: SlidesService);
    getActiveSlides(): Promise<ApiResponseDto<{
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
    }[]>>;
    getAllSlides(): Promise<ApiResponseDto<{
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
    }[]>>;
    createSlide(dto: CreateSlideDto): Promise<ApiResponseDto<{
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
    }>>;
    updateSlide(id: string, dto: UpdateSlideDto): Promise<ApiResponseDto<{
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
    }>>;
    deleteSlide(id: string): Promise<ApiResponseDto<any>>;
}
