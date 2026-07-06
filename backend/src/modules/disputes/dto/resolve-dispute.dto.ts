import { IsEnum, IsOptional, MaxLength, IsNumber, Min } from 'class-validator'
import { DisputeResolutionType } from '@prisma/client'

export class ResolveDisputeDto {
  @IsEnum(DisputeResolutionType)
  resolutionType: DisputeResolutionType

  @IsNumber()
  @IsOptional()
  @Min(0)
  refundAmount?: number

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  resolutionNotes?: string
}
