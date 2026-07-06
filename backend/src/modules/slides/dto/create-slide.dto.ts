import { IsString, IsOptional, IsBoolean, IsInt, IsUrl } from 'class-validator'

export class CreateSlideDto {
  @IsString()
  title: string

  @IsString()
  @IsOptional()
  subtitle?: string

  @IsString()
  imageUrl: string

  @IsString()
  @IsOptional()
  linkHref?: string

  @IsString()
  @IsOptional()
  badge?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsInt()
  @IsOptional()
  sortOrder?: number
}
