import { DisputeResolutionType } from '@prisma/client';
export declare class ResolveDisputeDto {
    resolutionType: DisputeResolutionType;
    refundAmount?: number;
    resolutionNotes?: string;
}
