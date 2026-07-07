import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreatePostDto {
  @IsString() title: string
  @IsString() slug: string
  @IsString() excerpt: string
  @IsString() content: string
  @IsString() @IsOptional() category?: string
  @IsString() @IsOptional() author?: string
  @IsString() @IsOptional() coverImage?: string
  @IsBoolean() @IsOptional() isPublished?: boolean
  @IsBoolean() @IsOptional() isFeatured?: boolean
  @IsString() @IsOptional() readTime?: string
}
