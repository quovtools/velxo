import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class LoginDto {
  @IsString() @IsNotEmpty() email: string
  @IsString() @IsNotEmpty() password: string
}

export class RegisterDto {
  @IsString() @IsNotEmpty() email: string
  @IsString() @IsNotEmpty() password: string
  @IsOptional() @IsString() firstName?: string
  @IsOptional() @IsString() lastName?: string
}
