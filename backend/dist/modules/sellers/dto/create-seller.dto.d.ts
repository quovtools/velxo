export declare class CreateSellerDto {
    storeName: string;
    storeDescription?: string;
    responseTime?: number;
}
export declare class UpdateSellerDto {
    storeName?: string;
    storeDescription?: string;
    responseTime?: number;
}
export declare class UploadVerificationDocumentsDto {
    documentType: string;
    documentUrl: string;
}
export declare class SubmitKycDto {
    idType: string;
    fullName: string;
    documentNumber?: string;
    idImageUrl: string;
    selfieImageUrl: string;
}
