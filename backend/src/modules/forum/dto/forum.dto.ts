import { IsString, IsOptional, IsInt, IsBoolean, IsArray, Min, Max } from 'class-validator'

export class CreateThreadDto {
  @IsString()
  title: string

  @IsString()
  content: string

  @IsString()
  @IsOptional()
  category?: string

  @IsArray()
  @IsOptional()
  tags?: string[]
}

export class CreatePostDto {
  @IsString()
  content: string

  @IsString()
  @IsOptional()
  parentId?: string
}

export class UpdateThreadDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsString()
  @IsOptional()
  category?: string

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  content?: string

  @IsBoolean()
  @IsOptional()
  isHidden?: boolean
}

export class ForumQueryDto {
  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  search?: string

  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number

  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number
}
