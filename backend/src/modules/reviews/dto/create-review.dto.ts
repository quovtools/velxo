import { IsString, IsNumber, IsOptional, Min, Max, MaxLength } from 'class-validator'

export class CreateReviewDto {
  @IsString()
  orderId: string

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number

  @IsString()
  @MaxLength(1000)
  comment: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  communicationRating?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  deliverySpeedRating?: string
}
