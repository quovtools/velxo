import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsObject } from 'class-validator'
import { Role } from '@prisma/client'

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsOptional() @IsEnum(Role) role?: Role
  @IsOptional() @IsObject() preferences?: Record<string, any>
}

export class ResetPasswordDto {
  @IsEmail()
  email: string

  @IsString()
  oldPassword: string

  @IsString()
  @MinLength(8)
  newPassword: string
}
