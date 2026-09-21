import { Injectable, NotFoundException } from '@nestjs/common'
import {
  GAMES_CONFIG,
  GameConfig,
  resolveGame,
} from './games.config'

/** Public-safe view of a game config (everything the client needs to render
 *  logos, filters and the sell form — no internal flags stripped). */
export type GameDto = GameConfig

@Injectable()
export class GamesService {
  /** All supported games, ordered as defined in the canonical config. */
  listGames(): GameDto[] {
    return GAMES_CONFIG
  }

  /** A single game by slug or display name. */
  getGame(slugOrName: string): GameDto {
    const game = resolveGame(slugOrName)
    if (!game) {
      throw new NotFoundException(`Game "${slugOrName}" is not supported`)
    }
    return game
  }
}
