import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum } from 'class-validator'
import { Role } from '@prisma/client'

export class RegisterDto {
  @ApiProperty() @IsString() email: string
  @ApiProperty() @IsString() password: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() firstName?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() lastName?: string
}
