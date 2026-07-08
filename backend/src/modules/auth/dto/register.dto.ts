import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator'
import { Role } from '@prisma/client'

export class RegisterDto {
  @ApiProperty() @IsString() email: string
  @ApiProperty() @IsString() password: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() firstName?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() lastName?: string
  @ApiProperty({ required: false, enum: Role }) @IsOptional() @IsEnum(Role) role?: Role
  @ApiProperty({ required: false, description: 'Onboarding answers / preferences' })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>
}
