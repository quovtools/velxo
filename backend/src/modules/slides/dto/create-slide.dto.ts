import { IsString, IsOptional, IsBoolean, IsInt, IsUrl } from 'class-validator'

export class CreateSlideDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  subtitle?: string

  @IsString()
  imageUrl: string

  @IsOptional()
  @IsString()
  linkHref?: string

  @IsOptional()
  @IsString()
  badge?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class UpdateSlideDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  subtitle?: string

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsString()
  linkHref?: string

  @IsOptional()
  @IsString()
  badge?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number
}
