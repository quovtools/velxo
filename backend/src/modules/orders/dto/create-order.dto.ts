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

  /**
   * ISO 4217 currency code detected from the buyer's location (e.g. "NGN", "GHS").
   * When provided, the order and Flutterwave charge will use this currency
   * instead of USD, with the amount converted at the stored exchange rate.
   */
  @IsString()
  @IsOptional()
  currency?: string
}
