import { IsOptional, IsString, IsNumber, Min, IsEnum, IsArray } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'

export enum SortByEnum {
  NEWEST = 'newest',
  POPULAR = 'popular',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
  RATING = 'rating',
}

export class SearchListingDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  gameName?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  sellerId?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number

  @IsOptional()
  @IsString()
  rank?: string

  @IsOptional()
  @IsEnum(SortByEnum)
  sortBy?: SortByEnum = SortByEnum.NEWEST

  @IsOptional()
  @IsString()
  order?: string

  @IsOptional()
  @IsString()
  currency?: string = 'USD'
}
