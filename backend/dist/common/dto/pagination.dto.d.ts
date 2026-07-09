export declare class PaginationDto {
    page: number;
    limit: number;
    skip: number;
    get offset(): number;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
