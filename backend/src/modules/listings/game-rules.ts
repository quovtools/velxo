export const GAME_RULES: Record<string, { requiresPlayerId: boolean; requiresRank: boolean }> = {
  'free-fire':     { requiresPlayerId: true,  requiresRank: true },
  'pubg-mobile':   { requiresPlayerId: true,  requiresRank: true },
  'cod-mobile':    { requiresPlayerId: false, requiresRank: true },
  'blood-strike':  { requiresPlayerId: false, requiresRank: false },
  'efootball':     { requiresPlayerId: false, requiresRank: false },
  'mobile-legends':{ requiresPlayerId: true,  requiresRank: true },
  'valorant':      { requiresPlayerId: false, requiresRank: true },
  'roblox':        { requiresPlayerId: true,  requiresRank: false },
}

export function getGameRules(gameSlug: string) {
  return GAME_RULES[gameSlug] || { requiresPlayerId: false, requiresRank: false }
}
