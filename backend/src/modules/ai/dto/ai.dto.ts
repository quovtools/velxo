import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class AdminChatDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  conversationId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4_000)
  message?: string

  /** Continue the thread after a confirmed tool execution (no new user message). */
  @IsOptional()
  @IsBoolean()
  resume?: boolean
}

export class ConfirmActionDto {
  @IsString()
  @MaxLength(64)
  actionId!: string

  @IsIn(['confirm', 'cancel'])
  decision!: 'confirm' | 'cancel'

  @IsOptional()
  @IsString()
  @MaxLength(64)
  conversationId?: string
}

export class ValuationRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  gameName!: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  rank?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000)
  level?: number

  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string

  @IsOptional()
  @IsString()
  @MaxLength(60)
  region?: string

  @IsOptional()
  @IsString()
  @MaxLength(60)
  loginMethod?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  skinsCount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number
}

export class ValuationFeedbackDto {
  @IsString()
  @MaxLength(64)
  requestId!: string

  @IsIn(['helpful', 'too_low', 'too_high'])
  verdict!: 'helpful' | 'too_low' | 'too_high'
}
