import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator'

export class CreateMarqueeDto {
  @IsString()
  text: string

  @IsOptional()
  @IsString()
  linkHref?: string

  @IsOptional()
  @IsString()
  linkText?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class UpdateMarqueeDto {
  @IsOptional()
  @IsString()
  text?: string

  @IsOptional()
  @IsString()
  linkHref?: string

  @IsOptional()
  @IsString()
  linkText?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number
}
