import { IsEmail, IsString, MinLength } from 'class-validator'

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
