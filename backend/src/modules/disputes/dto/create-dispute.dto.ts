import { IsString, IsOptional, MaxLength, IsArray } from 'class-validator'

export class CreateDisputeDto {
  @IsString()
  orderId: string

  @IsString()
  @MaxLength(500)
  reason: string

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string

  @IsArray()
  @IsOptional()
  evidence?: string[] // URLs to files/images
}
