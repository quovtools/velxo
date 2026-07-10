// Central source of truth for every game supported on the Velxo marketplace.
//
// Each entry encodes how that specific game actually works in the wild:
//   - the premium in-game currency you top up (and its free currencies)
//   - the real competitive rank ladder (low -> high) used for boosting/listings
//   - the platforms the game runs on and how accounts are logged into
//   - the boosting service types that make sense for that title
//
// UI screens (sell form, boosting, gigs, top-ups, marketplace tabs) should read
// from this module instead of hard-coding generic drop-downs, so the marketplace
// "speaks" each game's language.

export interface GameServiceType {
  // value MUST stay within the backend-allowed set:
  // RANK_BOOST | SOLO | DUO | COACHING | ACCOUNT_LEVELING
  value: 'RANK_BOOST' | 'SOLO' | 'DUO' | 'COACHING' | 'ACCOUNT_LEVELING';
  label: string;
}

export interface GameCurrency {
  name: string; // premium currency, e.g. "Diamonds"
  plural: string; // e.g. "Diamonds"
  free?: string[]; // earnable currencies, e.g. ["Battle Points"]
  note?: string;
}

export interface GameConfig {
  name: string;
  slug: string;
  genre: string;
  color: string;
  currency: GameCurrency;
  /** Competitive ranks ordered lowest -> highest. Empty when the game has no ranked ladder. */
  ranks: string[];
  hasRanked: boolean;
  platforms: string[];
  loginMethods: string[];
  /** Service types offered as boosting gigs, using only backend-allowed values. */
  serviceTypes: GameServiceType[];
  /** What the listing "account" form should expose for this game. */
  accountFields: {
    rank: boolean;
    level: boolean;
    loginMethod: boolean;
    battlePass?: string; // e.g. "Elite Pass"
    extras: string[]; // suggested extra selling points, e.g. skins, pets
  };
  /** Suggested official top-up denominations for this game's currency. */
  topupPackages: { amount: number; label: string }[];
}

export const REGIONS = [
  'Africa',
  'Europe',
  'North America',
  'Asia',
  'Middle East',
  'Global',
] as const;

// Allowed boosting service types (mirrors backend gig accountType enum).
export const SERVICE_TYPE_LABELS: Record<GameServiceType['value'], string> = {
  RANK_BOOST: 'Rank Boost',
  ACCOUNT_LEVELING: 'Account Leveling',
  SOLO: 'Solo Carry',
  DUO: 'Duo Boost',
  COACHING: 'Coaching',
};

export const GAME_CONFIG: Record<string, GameConfig> = {
  'Free Fire': {
    name: 'Free Fire',
    slug: 'free-fire',
    genre: 'Battle Royale',
    color: '#FF4500',
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
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Rank Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
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
  },

  'COD Mobile': {
    name: 'COD Mobile',
    slug: 'cod-mobile',
    genre: 'FPS Shooter',
    color: '#00CC66',
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
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Rank Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
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
  },

  'Blood Strike': {
    name: 'Blood Strike',
    slug: 'blood-strike',
    genre: 'FPS Shooter',
    color: '#CC0000',
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
  },

  'Delta Force': {
    name: 'Delta Force',
    slug: 'delta-force',
    genre: 'Tactical Shooter',
    color: '#4A9EFF',
    currency: {
      name: 'Delta Coin',
      plural: 'Delta Coins',
      free: ['Delta Tickets', 'Tekniq Alloys', 'Mandelbricks'],
      note: 'Premium currency for skins, operators and the Season Pass. Operations mode also uses Tekniq Alloys.',
    },
    ranks: ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Colonel', 'General', 'General of the Army'],
    hasRanked: true,
    platforms: ['PC', 'PlayStation', 'Xbox', 'Android', 'iOS'],
    loginMethods: ['Level Infinite', 'Google', 'Facebook', 'Apple', 'X (Twitter)'],
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Merit Rank Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Operator Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      battlePass: 'Season Pass',
      extras: ['Operators', 'Weapon Skins', 'Mandelbricks', 'Gear'],
    },
    topupPackages: [
      { amount: 300, label: '300 Delta Coins' },
      { amount: 680, label: '680 Delta Coins' },
      { amount: 1280, label: '1280 Delta Coins' },
      { amount: 3280, label: '3280 Delta Coins' },
      { amount: 6480, label: '6480 Delta Coins' },
      { amount: 12960, label: '12960 Delta Coins' },
    ],
  },

  'PUBG Mobile': {
    name: 'PUBG Mobile',
    slug: 'pubg-mobile',
    genre: 'Battle Royale',
    color: '#F5A623',
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
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Rank Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
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
  },

  Valorant: {
    name: 'Valorant',
    slug: 'valorant',
    genre: 'Tactical FPS',
    color: '#FF4655',
    currency: {
      name: 'Valorant Point',
      plural: 'Valorant Points',
      free: ['Radianite Points'],
      note: 'Premium currency for agents, skins and the Battle Pass.',
    },
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
    hasRanked: true,
    platforms: ['PC', 'PlayStation', 'Xbox'],
    loginMethods: ['Riot Account', 'Xbox', 'PlayStation'],
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Rank Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      battlePass: 'Battle Pass',
      extras: ['Agents', 'Weapon Skins', 'Sprays', 'Buddies'],
    },
    topupPackages: [
      { amount: 475, label: '475 VP' },
      { amount: 1000, label: '1000 VP' },
      { amount: 2050, label: '2050 VP' },
      { amount: 3650, label: '3650 VP' },
      { amount: 5350, label: '5350 VP' },
      { amount: 11000, label: '11000 VP' },
    ],
  },

  Roblox: {
    name: 'Roblox',
    slug: 'roblox',
    genre: 'Sandbox',
    color: '#CC0000',
    currency: {
      name: 'Robux',
      plural: 'Robux',
      free: ['Tickets (legacy)'],
      note: 'Premium currency for avatar items, game passes, experiences and Premium.',
    },
    // Roblox has no unified competitive rank ladder.
    ranks: [],
    hasRanked: false,
    platforms: ['PC', 'Android', 'iOS', 'Xbox', 'Meta Quest'],
    loginMethods: ['Roblox Account', 'Apple', 'Google', 'Facebook', 'Xbox'],
    serviceTypes: [
      { value: 'ACCOUNT_LEVELING', label: 'Account / Items' },
      { value: 'SOLO', label: 'Solo Play' },
      { value: 'DUO', label: 'Duo Play' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: false,
      level: true,
      loginMethod: true,
      battlePass: 'Premium',
      extras: ['Robux', 'Game Passes', 'Limited Items', 'Avatar Items'],
    },
    topupPackages: [
      { amount: 400, label: '400 Robux' },
      { amount: 800, label: '800 Robux' },
      { amount: 1700, label: '1700 Robux' },
      { amount: 4500, label: '4500 Robux' },
      { amount: 10000, label: '10000 Robux' },
      { amount: 22500, label: '22500 Robux' },
    ],
  },

  'Mobile Legends': {
    name: 'Mobile Legends',
    slug: 'mobile-legends',
    genre: 'MOBA',
    color: '#9B59B6',
    currency: {
      name: 'Diamond',
      plural: 'Diamonds',
      free: ['Battle Points', 'Tickets'],
      note: 'Premium currency for draws, skins and the Starlight Pass.',
    },
    ranks: ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Glory', 'Mythical Immortal'],
    hasRanked: true,
    platforms: ['Android', 'iOS'],
    loginMethods: ['Moonton Account', 'Google Play', 'Game Center (Apple)', 'Facebook', 'VK', 'TikTok'],
    serviceTypes: [
      { value: 'RANK_BOOST', label: 'Rank / Star Boost' },
      { value: 'ACCOUNT_LEVELING', label: 'Account Leveling' },
      { value: 'SOLO', label: 'Solo Carry' },
      { value: 'DUO', label: 'Duo Boost' },
      { value: 'COACHING', label: 'Coaching' },
    ],
    accountFields: {
      rank: true,
      level: true,
      loginMethod: true,
      battlePass: 'Starlight Pass',
      extras: ['Skins', 'Heroes', 'Emblems', 'Collection'],
    },
    topupPackages: [
      { amount: 86, label: '86 Diamonds' },
      { amount: 172, label: '172 Diamonds' },
      { amount: 257, label: '257 Diamonds' },
      { amount: 514, label: '514 Diamonds' },
      { amount: 1028, label: '1028 Diamonds' },
      { amount: 2570, label: '2570 Diamonds' },
    ],
  },

  eFootball: {
    name: 'eFootball',
    slug: 'efootball',
    genre: 'Sports',
    color: '#00C8FF',
    currency: {
      name: 'eFootball Coin',
      plural: 'eFootball Coins',
      free: ['GP (Game Points)', 'eFootball Points'],
      note: 'Premium currency for signing players, managers and packs.',
    },
    // eFootball League divisions, Division 10 (beginner) -> Division 1 (elite).
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
  },
};

export const GAME_LIST = Object.values(GAME_CONFIG).map((g) => ({
  name: g.name,
  slug: g.slug,
  genre: g.genre,
  color: g.color,
}));

export const GAME_NAMES = Object.keys(GAME_CONFIG);

export function getGameConfig(name: string): GameConfig | undefined {
  return GAME_CONFIG[name];
}

export function slugToGameName(slug: string): string {
  const found = GAME_LIST.find((g) => g.slug === slug);
  if (found) return found.name;
  // Fallback: title-case the slug (e.g. "cod-mobile" -> "Cod Mobile").
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getGameCurrencyName(name: string): string {
  return GAME_CONFIG[name]?.currency.plural ?? 'currency';
}

export function getGameSlug(name: string): string | undefined {
  return GAME_CONFIG[name]?.slug;
}
