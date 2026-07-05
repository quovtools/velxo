import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class CreateOrderDto {
  @ApiProperty() @IsString() listingId: string
  @ApiProperty({ required: false }) @IsOptional() buyerNote?: string
}
