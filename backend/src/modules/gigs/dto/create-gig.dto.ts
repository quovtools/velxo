import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsUrl,
  IsIn,
  Min,
} from 'class-validator'

export class CreateGigDto {
  @IsString()
  title: string

  @IsString()
  description: string

  @IsString()
  gameName: string

  @IsOptional()
  @IsString()
  rankFrom?: string

  @IsOptional()
  @IsString()
  rankTo?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsIn(['RANK_BOOST', 'SOLO', 'DUO', 'COACHING', 'ACCOUNT_LEVELING'])
  accountType?: string

  @IsNumber()
  @Min(0)
  price: number

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryTime?: number

  @IsOptional()
  @IsUrl()
  imageUrl?: string
}

export class UpdateGigDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  gameName?: string

  @IsOptional()
  @IsString()
  rankFrom?: string

  @IsOptional()
  @IsString()
  rankTo?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsIn(['RANK_BOOST', 'SOLO', 'DUO', 'COACHING', 'ACCOUNT_LEVELING'])
  accountType?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsString()
  currency?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryTime?: number

  @IsOptional()
  @IsUrl()
  imageUrl?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class AdminReviewGigDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'REJECTED', 'SUSPENDED'])
  status?: 'ACTIVE' | 'REJECTED' | 'SUSPENDED'

  @IsOptional()
  @IsString()
  rejectionReason?: string
}
