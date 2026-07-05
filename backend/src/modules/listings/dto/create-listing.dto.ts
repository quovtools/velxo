import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator'

export class CreateListingDto {
  @IsString() title: string
  @IsString() description: string
  @IsNumber() price: number
  @IsString() categoryId: string
  @IsOptional() @IsString() subcategoryId?: string
  @IsOptional() @IsString() gameName?: string
  @IsOptional() @IsString() region?: string
  @IsOptional() @IsString() platform?: string
  @IsOptional() @IsString() rank?: string
  @IsOptional() @IsNumber() level?: number
  @IsOptional() @IsBoolean() isFeatured?: boolean
  @IsOptional() images?: string[]
}
