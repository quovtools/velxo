import { PaginationDto } from '@/common/dto/pagination.dto';
export declare enum SortByEnum {
    NEWEST = "newest",
    POPULAR = "popular",
    PRICE_LOW = "price_low",
    PRICE_HIGH = "price_high",
    RATING = "rating"
}
export declare class SearchListingDto extends PaginationDto {
    search?: string;
    gameName?: string;
    categoryId?: string;
    sellerId?: string;
    status?: string;
    platform?: string;
    region?: string;
    minPrice?: number;
    maxPrice?: number;
    rank?: string;
    sortBy?: SortByEnum;
    order?: string;
    currency?: string;
}
