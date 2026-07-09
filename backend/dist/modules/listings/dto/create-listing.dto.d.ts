export declare enum ListingTypeEnum {
    ACCOUNT = "account",
    COINS = "coins",
    TOPUP = "topup",
    BOOST = "boost",
    GIFT_CARD = "gift_card",
    SERVICE = "service"
}
export declare class CreateListingDto {
    title: string;
    description: string;
    price: number;
    gameName: string;
    gameId?: string;
    categoryId: string;
    subcategoryId?: string;
    platform?: string;
    region?: string;
    rank?: string;
    level?: number;
    skins?: number;
    characters?: number;
    playerId?: string;
    playerUid?: string;
    loginMethod?: string;
    deliveryTime?: number;
    images?: string[];
    videos?: string[];
    metadata?: Record<string, any>;
    isFeatured?: boolean;
}
