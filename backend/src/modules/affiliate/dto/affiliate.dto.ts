import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator'

export class RegisterCreatorDto {
  @IsOptional()
  @IsString()
  handle?: string

  @IsString()
  platform: string // youtube, tiktok, instagram, twitter, discord, etc.

  @IsInt()
  @Min(0)
  followerCount: number

  @IsOptional()
  @IsString()
  bio?: string
}

export class UpdateCreatorDto {
  @IsOptional()
  @IsString()
  handle?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  followerCount?: number

  @IsOptional()
  @IsString()
  bio?: string
}

export class AdminReviewCreatorDto {
  @IsEnum(['APPROVED', 'REJECTED', 'SUSPENDED'])
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED'

  @IsOptional()
  @IsString()
  rejectionReason?: string
}
