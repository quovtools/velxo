// Canonical, server-side source of truth for every game supported on Piyrox.
//
// This mirrors frontend/src/lib/games.ts so the API can:
//   - expose live game info (currency, ranks, platforms, login methods,
//     battle-pass label, suggested extras, top-up packages) to the client
//   - validate listing / gig / topup payloads against the real game rules
//   - tell the sell form whether a playerId or rank is required per game
//
// Keep this file and frontend/src/lib/games.ts in sync. The five primary
// titles (Free Fire, COD Mobile, PUBG Mobile, eFootball, Blood Strike) carry
// full live info; the extra legacy titles are kept minimal so existing rows
// and the register page keep resolving.

export type ServiceTypeValue =
  | 'RANK_BOOST'
  | 'SOLO'
  | 'DUO'
  | 'COACHING'
  | 'ACCOUNT_LEVELING'

export interface GameServiceType {
  value: ServiceTypeValue
  label: string
}

export interface GameAccountFields {
  rank: boolean
  level: boolean
  loginMethod: boolean
  /** True when the game needs an in-game ID to deliver (Free Fire, PUBG). */
  playerId: boolean
  battlePass?: string
  extras: string[]
}

export interface GameCurrency {
  name: string
  plural: string
  free?: string[]
  note?: string
}

export interface GameConfig {
  name: string
  slug: string
  genre: string
  color: string
  /** Canonical logo path served by the frontend (correct extension). */
  logo: string
  currency: GameCurrency
  ranks: string[]
  hasRanked: boolean
  platforms: string[]
  loginMethods: string[]
  serviceTypes: GameServiceType[]
  accountFields: GameAccountFields
  topupPackages: { amount: number; label: string }[]
  /** Delivery requires the buyer's in-game player ID. */
  requiresPlayerId: boolean
  /** A rank must be supplied when listing / boosting this game. */
  requiresRank: boolean
  /** Baseline account value (USD) used by the valuation estimator. */
  baseValue: number
}

const FULL_SERVICE_TYPES: GameServiceType[] = [
  { value: 'RANK_BOOST', label: 'Rank Boost' },
  { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
  { value: 'SOLO', label: 'Solo Carry' },
  { value: 'DUO', label: 'Duo Boost' },
  { value: 'COACHING', label: 'Coaching' },
]

export const GAMES_CONFIG: GameConfig[] = [
  {
    name: 'Free Fire',
    slug: 'free-fire',
    genre: 'Battle Royale',
    color: '#FF4500',
    logo: '/games/free-fire.png',
    currency: {
      name: 'Diamond',
      plural: 'Diamonds',
      free: ['Coins', 'Free Fire Credits'],
      note: 'Premium currency used for crates, skins, pets and the Elite Pass.',
    },
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Grandmaster'],
    hasRanked: true,
    platforms: ['Android', 'iOS'],
    loginMethods: ['Google', 'Facebook', 'VK', 'Apple', 'X (Twitter)', 'Huawei', 'Guest'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      playerId: true,
      battlePass: 'Elite Pass',
      extras: ['Skins', 'Pets', 'Characters', 'Weapon Skins', 'Emotes'],
    },
    topupPackages: [
      { amount: 100, label: '100 Diamonds' },
      { amount: 310, label: '310 Diamonds' },
      { amount: 520, label: '520 Diamonds' },
      { amount: 1060, label: '1060 Diamonds' },
      { amount: 2180, label: '2180 Diamonds' },
      { amount: 5600, label: '5600 Diamonds' },
    ],
    requiresPlayerId: true,
    requiresRank: true,
    baseValue: 25,
  },
  {
    name: 'COD Mobile',
    slug: 'cod-mobile',
    genre: 'FPS Shooter',
    color: '#00CC66',
    logo: '/games/cod-mobile.png',
    currency: {
      name: 'COD Point',
      plural: 'COD Points',
      free: ['Credits'],
      note: 'Premium currency for draws, blueprints, skins and the Battle Pass.',
    },
    ranks: ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Pro', 'Master', 'Grandmaster', 'Legendary'],
    hasRanked: true,
    platforms: ['Android', 'iOS'],
    loginMethods: ['Activision', 'Facebook', 'Google Play', 'Game Center (Apple)', 'WeChat'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      playerId: false,
      battlePass: 'Battle Pass',
      extras: ['Blueprint Skins', 'Characters', 'Weapon Camos', 'Operator Skins'],
    },
    topupPackages: [
      { amount: 80, label: '80 CP' },
      { amount: 240, label: '240 CP' },
      { amount: 500, label: '500 CP' },
      { amount: 1100, label: '1100 CP' },
      { amount: 2200, label: '2200 CP' },
      { amount: 5600, label: '5600 CP' },
    ],
    requiresPlayerId: false,
    requiresRank: true,
    baseValue: 30,
  },
  {
    name: 'PUBG Mobile',
    slug: 'pubg-mobile',
    genre: 'Battle Royale',
    color: '#F5A623',
    logo: '/games/pubg-mobile.png',
    currency: {
      name: 'UC',
      plural: 'UC',
      free: ['BP (Battle Points)'],
      note: 'Unknown Cash — the premium currency for crates, Royale Pass and skins.',
    },
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Ace Master', 'Ace Dominator', 'Conqueror'],
    hasRanked: true,
    platforms: ['Android', 'iOS'],
    loginMethods: ['Google Play', 'Facebook', 'Twitter', 'Game Center (Apple)', 'WeChat', 'QQ', 'Guest'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      playerId: true,
      battlePass: 'Royale Pass',
      extras: ['Skins', 'Outfits', 'Weapon Skins', 'Crates'],
    },
    topupPackages: [
      { amount: 60, label: '60 UC' },
      { amount: 325, label: '325 UC' },
      { amount: 660, label: '660 UC' },
      { amount: 1800, label: '1800 UC' },
      { amount: 3850, label: '3850 UC' },
      { amount: 8100, label: '8100 UC' },
    ],
    requiresPlayerId: true,
    requiresRank: true,
    baseValue: 35,
  },
  {
    name: 'eFootball',
    slug: 'efootball',
    genre: 'Sports',
    color: '#00C8FF',
    logo: '/games/efootball.png',
    currency: {
      name: 'eFootball Coin',
      plural: 'eFootball Coins',
      free: ['GP (Game Points)', 'eFootball Points'],
      note: 'Premium currency for signing players, managers and packs.',
    },
    ranks: ['Division 10', 'Division 9', 'Division 8', 'Division 7', 'Division 6', 'Division 5', 'Division 4', 'Division 3', 'Division 2', 'Division 1'],
    hasRanked: true,
    platforms: ['PC (Steam)', 'PlayStation', 'Xbox', 'Android', 'iOS'],
    loginMethods: ['Konami ID', 'Google', 'Apple', 'Facebook', 'Steam', 'PlayStation Network', 'Xbox', 'Game Center'],
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Division Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Squad Building' },
      { value: 'SOLO', label: 'Solo Play' },
      { value: 'DUO', label: 'Duo Play' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      playerId: false,
      battlePass: 'Match Pass',
      extras: ['EPIC Players', 'Legend Players', 'Managers', 'Strips'],
    },
    topupPackages: [
      { amount: 500, label: '500 eFootball Coins' },
      { amount: 1100, label: '1100 eFootball Coins' },
      { amount: 2400, label: '2400 eFootball Coins' },
      { amount: 5000, label: '5000 eFootball Coins' },
      { amount: 10200, label: '10200 eFootball Coins' },
      { amount: 21000, label: '21000 eFootball Coins' },
    ],
    requiresPlayerId: false,
    requiresRank: false,
    baseValue: 20,
  },
  {
    name: 'Blood Strike',
    slug: 'blood-strike',
    genre: 'FPS Shooter',
    color: '#CC0000',
    logo: '/games/blood-strike.jpg',
    currency: {
      name: 'Gold',
      plural: 'Golds',
      free: ['Reputation', 'Noble Coins', 'Weapon EXP'],
      note: 'Premium currency for Strikers, skins and the Strike Pass (Elite / Premium).',
    },
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Legend'],
    hasRanked: true,
    platforms: ['Android', 'iOS', 'PC'],
    loginMethods: ['NetEase Account', 'Google', 'Facebook', 'Apple', 'Game Center', 'X (Twitter)'],
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Rank Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Striker Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      playerId: false,
      battlePass: 'Strike Pass',
      extras: ['Strikers', 'Weapon Skins', 'Mythic Skins', 'Gold Stash'],
    },
    topupPackages: [
      { amount: 50, label: '50 Golds' },
      { amount: 100, label: '100 Golds' },
      { amount: 300, label: '300 Golds' },
      { amount: 500, label: '500 Golds' },
      { amount: 1000, label: '1000 Golds' },
      { amount: 2000, label: '2000 Golds' },
      { amount: 5000, label: '5000 Golds' },
    ],
    requiresPlayerId: false,
    requiresRank: false,
    baseValue: 20,
  },

  // ── Legacy / secondary titles ─────────────────────────────────────────────
  // Kept so existing listings, the register page and GAME_RULES keep resolving.
  // They carry basic info only; the five titles above are the fully-wired set.
  {
    name: 'Mobile Legends',
    slug: 'mobile-legends',
    genre: 'MOBA',
    color: '#1B6EF3',
    logo: '/games/mobile-legends.png',
    currency: { name: 'Diamond', plural: 'Diamonds', free: ['Battle Points'] },
    ranks: ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Glory'],
    hasRanked: true,
    platforms: ['Android', 'iOS'],
    loginMethods: ['Google', 'Facebook', 'Apple', 'VK', 'Guest'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: { rank: true, level: true, loginMethod: true, playerId: true, battlePass: 'Twilight Pass', extras: ['Skins', 'Heroes', 'Emblems'] },
    topupPackages: [
      { amount: 56, label: '56 Diamonds' },
      { amount: 172, label: '172 Diamonds' },
      { amount: 344, label: '344 Diamonds' },
      { amount: 706, label: '706 Diamonds' },
    ],
    requiresPlayerId: true,
    requiresRank: true,
    baseValue: 20,
  },
  {
    name: 'Valorant',
    slug: 'valorant',
    genre: 'FPS Shooter',
    color: '#FF4655',
    logo: '/games/valorant.png',
    currency: { name: 'VP', plural: 'Valorant Points', free: ['Radianite Points'] },
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
    hasRanked: true,
    platforms: ['PC'],
    loginMethods: ['Riot Account', 'Apple', 'Google', 'Facebook'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: { rank: true, level: true, loginMethod: true, playerId: false, battlePass: 'Battle Pass', extras: ['Skins', 'Agents', 'Gun Buddies'] },
    topupPackages: [
      { amount: 475, label: '475 VP' },
      { amount: 1000, label: '1000 VP' },
      { amount: 2050, label: '2050 VP' },
      { amount: 3650, label: '3650 VP' },
    ],
    requiresPlayerId: false,
    requiresRank: true,
    baseValue: 40,
  },
  {
    name: 'Roblox',
    slug: 'roblox',
    genre: 'Sandbox',
    color: '#00A2FF',
    logo: '/games/roblox.jpg',
    currency: { name: 'Robux', plural: 'Robux' },
    ranks: [],
    hasRanked: false,
    platforms: ['PC', 'Android', 'iOS', 'Xbox'],
    loginMethods: ['Roblox Account', 'Google', 'Facebook', 'Apple'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: { rank: false, level: false, loginMethod: true, playerId: true, extras: ['Limited Items', 'Game Passes', 'Avatar Items'] },
    topupPackages: [
      { amount: 400, label: '400 Robux' },
      { amount: 800, label: '800 Robux' },
      { amount: 1700, label: '1700 Robux' },
      { amount: 4500, label: '4500 Robux' },
    ],
    requiresPlayerId: true,
    requiresRank: false,
    baseValue: 15,
  },
  {
    name: 'Delta Force',
    slug: 'delta-force',
    genre: 'FPS Shooter',
    color: '#7A8B3A',
    logo: '/games/delta-force.png',
    currency: { name: 'Delta Coin', plural: 'Delta Coins' },
    ranks: [],
    hasRanked: false,
    platforms: ['PC', 'Android', 'iOS'],
    loginMethods: ['Level Infinite', 'Google', 'Facebook', 'Apple'],
    serviceTypes: FULL_SERVICE_TYPES,
    accountFields: { rank: false, level: true, loginMethod: true, playerId: false, extras: ['Skins', 'Operators', 'Weapon Blueprints'] },
    topupPackages: [
      { amount: 60, label: '60 Delta Coins' },
      { amount: 300, label: '300 Delta Coins' },
      { amount: 980, label: '980 Delta Coins' },
    ],
    requiresPlayerId: false,
    requiresRank: false,
    baseValue: 25,
  },
]

export const GAME_MAP: Record<string, GameConfig> = GAMES_CONFIG.reduce(
  (acc, g) => {
    acc[g.slug] = g
    acc[g.name.toLowerCase()] = g
    return acc
  },
  {} as Record<string, GameConfig>,
)

export const GAME_SLUGS = GAMES_CONFIG.map((g) => g.slug)
export const GAME_NAMES = GAMES_CONFIG.map((g) => g.name)

/** Resolve a game by slug or display name (case-insensitive). */
export function resolveGame(slugOrName?: string | null): GameConfig | undefined {
  if (!slugOrName) return undefined
  const key = slugOrName.trim().toLowerCase()
  return GAME_MAP[key]
}

export function getGameBySlug(slug: string): GameConfig | undefined {
  return GAME_MAP[slug?.toLowerCase()]
}
