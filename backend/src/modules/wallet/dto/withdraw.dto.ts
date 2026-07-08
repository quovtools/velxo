import { IsNumber, IsString, Min, IsIn } from 'class-validator'

export class WithdrawDto {
  @IsNumber()
  @Min(0.01)
  amount: number

  @IsString()
  @IsIn(['bank', 'crypto', 'paypal'])
  method: string

  @IsString()
  destination: string
}
