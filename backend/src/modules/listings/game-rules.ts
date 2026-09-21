import { GAMES_CONFIG, resolveGame } from '../games/games.config'

export interface GameRules {
  requiresPlayerId: boolean
  requiresRank: boolean
}

/** Derived from the canonical games config so the rules can never drift from
 *  the live game info served by GET /games. */
export const GAME_RULES: Record<string, GameRules> = GAMES_CONFIG.reduce(
  (acc, g) => {
    acc[g.slug] = {
      requiresPlayerId: g.requiresPlayerId,
      requiresRank: g.requiresRank,
    }
    return acc
  },
  {} as Record<string, GameRules>,
)

const DEFAULT_RULES: GameRules = { requiresPlayerId: false, requiresRank: false }

/** Accepts a slug or display name; unknown games fall back to no requirements. */
export function getGameRules(gameSlugOrName: string): GameRules {
  const game = resolveGame(gameSlugOrName)
  if (game) {
    return { requiresPlayerId: game.requiresPlayerId, requiresRank: game.requiresRank }
  }
  return GAME_RULES[gameSlugOrName] || DEFAULT_RULES
}
