import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsUrl,
  Min,
} from 'class-validator'

export class CreateTopupDto {
  @IsString()
  gameName: string

  @IsOptional()
  @IsString()
  gameSlug?: string

  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  @Min(0)
  price: number

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsUrl()
  imageUrl?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  deliveryInfo?: string

  @IsOptional()
  @IsInt()
  stock?: number

  @IsOptional()
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateTopupDto {
  @IsOptional()
  @IsString()
  gameName?: string

  @IsOptional()
  @IsString()
  gameSlug?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsUrl()
  imageUrl?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  deliveryInfo?: string

  @IsOptional()
  @IsInt()
  stock?: number

  @IsOptional()
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
