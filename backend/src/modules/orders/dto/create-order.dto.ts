import { IsString, IsNumber, IsOptional, Min } from 'class-validator'

export class CreateOrderDto {
  @IsString()
  listingId: string

  @IsNumber()
  @Min(1)
  quantity: number = 1

  @IsString()
  @IsOptional()
  buyerNote?: string

  @IsString()
  @IsOptional()
  paymentMethodId?: string
}
