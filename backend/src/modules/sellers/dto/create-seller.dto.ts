import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum } from 'class-validator'
import { ListingStatus } from '@prisma/client'

export class CreateSellerDto {
  @ApiProperty() @IsString() storeName: string
  @ApiProperty({ required: false }) @IsOptional() storeDescription?: string
}

export class UpdateSellerDto {
  @ApiProperty() update: any
}
