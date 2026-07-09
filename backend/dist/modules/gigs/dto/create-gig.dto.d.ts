export declare class CreateGigDto {
    title: string;
    description: string;
    gameName: string;
    rankFrom?: string;
    rankTo?: string;
    platform?: string;
    region?: string;
    accountType?: string;
    price: number;
    currency?: string;
    deliveryTime?: number;
    imageUrl?: string;
}
export declare class UpdateGigDto {
    title?: string;
    description?: string;
    gameName?: string;
    rankFrom?: string;
    rankTo?: string;
    platform?: string;
    region?: string;
    accountType?: string;
    price?: number;
    currency?: string;
    deliveryTime?: number;
    imageUrl?: string;
    isActive?: boolean;
}
export declare class AdminReviewGigDto {
    status?: 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
    rejectionReason?: string;
}
