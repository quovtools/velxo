import { IsString, IsOptional, IsNumber, MaxLength, MinLength } from 'class-validator'

export class CreateSellerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  storeName: string

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  storeDescription?: string

  @IsNumber()
  @IsOptional()
  responseTime?: number // hours
}

export class UpdateSellerDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  storeName?: string

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  storeDescription?: string

  @IsNumber()
  @IsOptional()
  responseTime?: number // hours
}

export class UploadVerificationDocumentsDto {
  @IsString()
  documentType: string // 'id', 'proof_of_address', 'business_license'

  @IsString()
  documentUrl: string // URL from Supabase storage
}
