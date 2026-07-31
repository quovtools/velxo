import { IsNumber, Min, IsString, IsIn } from 'class-validator'

export class TopupInitiateDto {
  @IsNumber()
  @Min(1)
  amount: number

  @IsString()
  currency: string

  @IsString()
  @IsIn(['FLUTTERWAVE', 'PAYMENT_IO'])
  provider: 'FLUTTERWAVE' | 'PAYMENT_IO'
}
