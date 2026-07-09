export declare class CreateTopupDto {
    gameName: string;
    gameSlug?: string;
    title: string;
    description?: string;
    price: number;
    currency?: string;
    imageUrl?: string;
    region?: string;
    deliveryInfo?: string;
    stock?: number;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateTopupDto {
    gameName?: string;
    gameSlug?: string;
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    region?: string;
    deliveryInfo?: string;
    stock?: number;
    sortOrder?: number;
    isActive?: boolean;
}
