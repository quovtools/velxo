import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsIn, Min, MaxLength, ValidateIf } from 'class-validator'
import { ListingStatus } from '@prisma/client'
import { getGameRules } from '../game-rules'
import { GAME_SLUGS } from '../../games/games.config'

export enum ListingTypeEnum {
  ACCOUNT = 'account',
  COINS = 'coins',
  TOPUP = 'topup',
  BOOST = 'boost',
  GIFT_CARD = 'gift_card',
  SERVICE = 'service',
}

export class CreateListingDto {
  @IsString()
  @MaxLength(200)
  title: string

  @IsString()
  @MaxLength(5000)
  description: string

  @IsNumber()
  @Min(0.01)
  price: number

  @IsString()
  gameName: string

  @IsString()
  @IsOptional()
  @IsIn(GAME_SLUGS, { message: `gameSlug must be one of: ${GAME_SLUGS.join(', ')}` })
  gameSlug?: string

  @IsString()
  categoryId: string

  @IsString()
  @IsOptional()
  subcategoryId?: string

  @IsString()
  @IsOptional()
  platform?: string

  @IsString()
  @IsOptional()
  region?: string

  @ValidateIf(o => {
    const rules = getGameRules(o.gameSlug || o.gameName || '')
    return rules.requiresRank
  })
  @IsString()
  rank?: string

  @IsNumber()
  @IsOptional()
  level?: number

  @IsString()
  @IsOptional()
  playerUid?: string

  @IsString()
  @IsOptional()
  loginMethod?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  deliveryTime?: number

  @IsArray()
  @IsOptional()
  images?: string[]

  @IsArray()
  @IsOptional()
  videos?: string[]

  @IsOptional()
  metadata?: Record<string, any>

  @IsOptional()
  isFeatured?: boolean

  @ValidateIf(o => {
    const rules = getGameRules(o.gameSlug || o.gameName || '')
    return rules.requiresPlayerId
  })
  @IsString()
  playerId?: string
}
