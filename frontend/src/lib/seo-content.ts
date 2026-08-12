/**
 * seo-content.ts
 *
 * Per-game rich SEO content: descriptions, rank guides, FAQs, and buyer tips.
 * Consumed by game catalog pages, the boosting page, topups page, and blog helpers.
 * Keep content genuinely useful — these are displayed to real users, not just crawlers.
 */

export interface GameFAQ {
  question: string;
  answer: string;
}

export interface GameSEOContent {
  slug: string;
  name: string;
  shortDescription: string;
  /** 2–3 sentences shown above the listing grid */
  buyerGuide: string;
  /** Displayed in an accordion or collapsible rank guide section */
  rankGuide: {
    title: string;
    summary: string;
    tiers: { name: string; description: string }[];
  } | null;
  /** Displayed in an FAQ accordion (also emitted as FAQPage JSON-LD) */
  faqs: GameFAQ[];
  /** One-liner trust signals shown as badges */
  trustPoints: string[];
  /** What extra items make an account more valuable — shown to buyers */
  valueDrivers: string[];
  /** Meta description override (falls back to layout default if absent) */
  metaDescription: string;
}

const SITE = 'Piyrox';

export const GAME_SEO_CONTENT: Record<string, GameSEOContent> = {
  'free-fire': {
    slug: 'free-fire',
    name: 'Free Fire',
    shortDescription:
      'Garena Free Fire is one of the most-played battle royale games in Africa, South-East Asia and Latin America. High-ranked accounts with rare skins and pets command strong resale value.',
    buyerGuide: `Browse verified Free Fire accounts on ${SITE}. Every seller is KYC-checked and all payments go through Trust-Trade escrow — your money is only released once you confirm safe delivery. Filter by rank, login method, region and Elite Pass status to find exactly what you need.`,
    rankGuide: {
      title: 'Free Fire Rank Ladder',
      summary:
        'Free Fire uses a six-tier ranked system. Higher-ranked accounts take hundreds of hours to earn and are priced accordingly.',
      tiers: [
        { name: 'Bronze', description: 'Entry-level rank, ideal for casual players.' },
        { name: 'Silver', description: 'Basic competitive play; accounts are common and affordable.' },
        { name: 'Gold', description: 'Mid-tier accounts start showing cosmetic value.' },
        { name: 'Platinum', description: 'Serious competitive bracket; rarer skins and pets appear.' },
        { name: 'Diamond', description: 'High value — only a fraction of the playerbase reaches Diamond.' },
        { name: 'Heroic', description: 'Elite tier. Heroic accounts with full skins sets are highly sought after.' },
        {
          name: 'Grandmaster',
          description:
            'Top 300 players per region. Grandmaster accounts are the most valuable and rarest listings on the market.',
        },
      ],
    },
    faqs: [
      {
        question: 'Is it safe to buy a Free Fire account on Piyrox?',
        answer: `Yes. ${SITE} uses Trust-Trade escrow: your payment is held securely and only transferred to the seller after you confirm you have full access to the account. All sellers go through identity verification before listing.`,
      },
      {
        question: 'What login methods do Free Fire accounts use?',
        answer:
          'Free Fire accounts can be linked to Google, Facebook, VK, Apple ID, X (Twitter), Huawei or left as Guest. Google and Facebook-linked accounts are easiest to transfer. Always confirm the login method with the seller before purchase.',
      },
      {
        question: 'Can I buy Free Fire Diamonds on Piyrox?',
        answer: `Yes — check the Top-Ups section for official Diamond packages. ${SITE} sells Diamonds directly at competitive rates with escrow protection and instant delivery.`,
      },
      {
        question: 'What makes a Free Fire account more valuable?',
        answer:
          'Rare bundles (e.g. Chrono, Alok), high rank (Heroic/Grandmaster), Elite Pass history, OB-exclusive skins, pets with max skills, and original email access all increase account value significantly.',
      },
      {
        question: 'How do I sell my Free Fire account on Piyrox?',
        answer: `Create a seller profile, complete KYC verification, then use the Sell page to list your account with rank, login method, screenshots and a fair price. ${SITE} charges a small platform fee only on successful sales.`,
      },
    ],
    trustPoints: [
      'Trust-Trade escrow on every transaction',
      'KYC-verified sellers only',
      'Dispute resolution within 24 hours',
      'Buyer protection guarantee',
    ],
    valueDrivers: ['Grandmaster / Heroic rank', 'Rare limited skins (Chrono, Alok)', 'Max-skill pets', 'Original email included', 'Elite Pass history'],
    metaDescription: `Buy and sell verified Free Fire accounts on ${SITE}. Browse Grandmaster, Heroic and Diamond accounts with rare skins, pets and Elite Pass. Trust-Trade escrow on every trade.`,
  },

  'efootball': {
    slug: 'efootball',
    name: 'eFootball',
    shortDescription:
      'eFootball (formerly PES) by Konami is a free-to-play football simulation game available on mobile, PC, PlayStation and Xbox. High-division accounts with EPIC and Legend players are highly valued.',
    buyerGuide: `Find verified eFootball accounts for sale on ${SITE}. Whether you want a squad packed with EPIC players, a specific Division ranking, or a coin top-up to build your dream team, every transaction is protected by Trust-Trade escrow.`,
    rankGuide: {
      title: 'eFootball Division System',
      summary:
        'eFootball uses a 10-division ranking ladder. Division 1 is the highest and hardest to reach. Accounts in the top divisions with strong squads are the most valuable.',
      tiers: [
        { name: 'Division 10', description: 'Starting division for new accounts.' },
        { name: 'Division 9–8', description: 'Early competitive play; squad depth matters.' },
        { name: 'Division 7–5', description: 'Mid-tier divisions; regular EPIC cards start appearing in squads.' },
        { name: 'Division 4–3', description: 'High-skill bracket with well-built squads.' },
        { name: 'Division 2', description: 'Near-elite; accounts here usually have Legend or high-rated EPICs.' },
        {
          name: 'Division 1',
          description:
            'The top rank. Division 1 accounts with full EPIC/Legend squads are the most sought-after on the market.',
        },
      ],
    },
    faqs: [
      {
        question: 'Is it safe to buy an eFootball account on Piyrox?',
        answer: `All trades on ${SITE} are escrow-protected. You pay first, but the funds go into Trust-Trade and are only released to the seller once you confirm safe access to the account. Sellers are KYC-verified.`,
      },
      {
        question: 'What are eFootball Coins used for?',
        answer:
          'eFootball Coins are the premium currency used to scout EPIC and Legend players, buy packs, hire managers and unlock cosmetics. Buying coins via top-up is faster than earning GP through matches.',
      },
      {
        question: 'Can I transfer an eFootball account to a different platform?',
        answer:
          'eFootball supports cross-platform progress via a Konami ID. Accounts linked to a Konami ID can be accessed on mobile (Android/iOS) and PC simultaneously. Always confirm the login method before purchase.',
      },
      {
        question: 'What makes an eFootball account valuable?',
        answer:
          'EPIC-rated players (especially limited event cards), Legend players, high Division rank, large coin balance, quality managers, and rare strip kits all add significant value.',
      },
      {
        question: 'How long does delivery take?',
        answer: `Most sellers on ${SITE} transfer login credentials within a few hours. You can message the seller directly via our chat system to agree a handover time before completing payment.`,
      },
    ],
    trustPoints: [
      'Trust-Trade escrow on every transaction',
      'KYC-verified sellers only',
      'Cross-platform accounts available',
      '24-hour dispute resolution',
    ],
    valueDrivers: ['Division 1 rank', 'EPIC & Legend player cards', 'Large eFootball Coin balance', 'Original Konami ID', 'Rare event squads'],
    metaDescription: `Buy and sell verified eFootball accounts on ${SITE}. Find Division 1 accounts, EPIC player squads and eFootball Coin top-ups. Escrow-protected trades with KYC-verified sellers.`,
  },

  'pubg-mobile': {
    slug: 'pubg-mobile',
    name: 'PUBG Mobile',
    shortDescription:
      'PUBG Mobile is the world\'s most-downloaded battle royale game. Conqueror-ranked accounts, high-UC stashes and exclusive seasonal skins make it one of the most active trading categories on the market.',
    buyerGuide: `Shop verified PUBG Mobile accounts on ${SITE}. Filter by rank (Conqueror, Ace, Crown), UC balance, Royale Pass tier, region and login method. Trust-Trade escrow guarantees your money back if anything goes wrong.`,
    rankGuide: {
      title: 'PUBG Mobile Rank Ladder',
      summary:
        'PUBG Mobile has one of the most competitive rank ladders in mobile gaming. Conqueror is a title held by only the top 500 players per region.',
      tiers: [
        { name: 'Bronze', description: 'Entry tier, very common.' },
        { name: 'Silver', description: 'Basic competitive play.' },
        { name: 'Gold', description: 'Mid-level; accounts begin accumulating cosmetics.' },
        { name: 'Platinum', description: 'Above-average players; Royale Pass skins start appearing.' },
        { name: 'Diamond', description: 'Skilled players; UC spending reflects here.' },
        { name: 'Crown', description: 'High-value accounts with significant time investment.' },
        { name: 'Ace', description: 'Top-tier; Ace accounts with exclusive frames command premium prices.' },
        { name: 'Ace Master', description: 'Elite bracket; rare Ace Master borders are visible in lobbies.' },
        { name: 'Ace Dominator', description: 'Near-peak; very few players reach Ace Dominator each season.' },
        {
          name: 'Conqueror',
          description:
            'Top 500 per region. Conqueror accounts are the pinnacle of PUBG Mobile and the most valuable listings on any marketplace.',
        },
      ],
    },
    faqs: [
      {
        question: 'Can I safely buy a PUBG Mobile account on Piyrox?',
        answer: `Yes. ${SITE} holds your payment in Trust-Trade escrow until you confirm access. If the account details don't match the listing, you can open a dispute and get a full refund.`,
      },
      {
        question: 'What is UC in PUBG Mobile?',
        answer:
          'UC (Unknown Cash) is the premium currency in PUBG Mobile. It\'s used to buy Royale Pass, crates, outfit sets and weapon skins. Accounts with high UC balance or a stocked inventory are more valuable.',
      },
      {
        question: 'What login methods do PUBG Mobile accounts use?',
        answer:
          'PUBG Mobile accounts can be bound to Google Play, Facebook, Twitter, Apple Game Center, WeChat or QQ. Google and Facebook bindings are the easiest to transfer to a new owner.',
      },
      {
        question: 'What is the Royale Pass and why does it matter?',
        answer:
          'The Royale Pass is PUBG Mobile\'s seasonal battle pass. Accounts with high RP Tier, Ace/Conqueror borders or exclusive seasonal outfits from past Royale Passes are much more valuable than basic accounts.',
      },
      {
        question: 'Can I sell my PUBG Mobile account on Piyrox?',
        answer: `Yes. Complete seller verification, list your account with accurate rank, UC balance and screenshots, and set your price. ${SITE} escrow protects both buyer and seller throughout the handover.`,
      },
    ],
    trustPoints: [
      'Trust-Trade escrow on every transaction',
      'Conqueror-verified listings',
      'KYC-verified sellers only',
      'Buyer protection guarantee',
    ],
    valueDrivers: ['Conqueror / Ace Dominator rank', 'High UC balance', 'Exclusive Royale Pass skins', 'Original Facebook/Google binding', 'Rare season-exclusive outfits'],
    metaDescription: `Buy and sell verified PUBG Mobile accounts on ${SITE}. Browse Conqueror, Ace and Crown ranked accounts with UC balance and Royale Pass skins. Escrow-protected with KYC sellers.`,
  },

  'cod-mobile': {
    slug: 'cod-mobile',
    name: 'COD Mobile',
    shortDescription:
      'Call of Duty Mobile brings the franchise\'s iconic multiplayer and battle royale to Android and iOS. Legendary-ranked accounts with rare Blueprint weapons and Operator skins are consistently in demand.',
    buyerGuide: `Buy and sell COD Mobile accounts on ${SITE}. Filter by rank (Legendary, Grandmaster, Master), CP balance, Battle Pass status, region and login method. Every trade goes through Trust-Trade escrow so your money is always protected.`,
    rankGuide: {
      title: 'COD Mobile Rank Ladder',
      summary:
        'COD Mobile has a 10-tier ranked system. Legendary is the top rank, held by only the best players each season, and these accounts attract the highest prices.',
      tiers: [
        { name: 'Rookie', description: 'Beginner bracket; brand-new accounts.' },
        { name: 'Bronze', description: 'Entry competitive play.' },
        { name: 'Silver', description: 'Slightly more seasoned players.' },
        { name: 'Gold', description: 'Mid-level; cosmetics start appearing.' },
        { name: 'Platinum', description: 'Above-average skill; Battle Pass unlocks visible.' },
        { name: 'Diamond', description: 'High-skill bracket with notable loadouts.' },
        { name: 'Pro', description: 'Near-elite; rare weapon Blueprints appear.' },
        { name: 'Master', description: 'Elite tier with exclusive Master rank borders.' },
        { name: 'Grandmaster', description: 'Very rare rank; high-value accounts with exclusive frame.' },
        {
          name: 'Legendary',
          description:
            'Top rank in COD Mobile. Legendary accounts with exclusive season borders and rare Operator skins are the most valuable listings.',
        },
      ],
    },
    faqs: [
      {
        question: 'Is buying a COD Mobile account on Piyrox safe?',
        answer: `Completely. ${SITE} holds your payment in Trust-Trade escrow and only releases it to the seller once you have verified full access. Any disputes are resolved by our team within 24 hours.`,
      },
      {
        question: 'What are COD Points (CP) and why do they matter?',
        answer:
          'COD Points are the premium currency in COD Mobile used to buy the Battle Pass, Lucky Draws, Blueprints and Operator skins. An account with a high CP balance or a full Lucky Draw set is significantly more valuable.',
      },
      {
        question: 'What login methods does COD Mobile support?',
        answer:
          'COD Mobile accounts can be linked to an Activision account, Facebook, Google Play or Apple Game Center. Activision-linked accounts are the most flexible and easiest to transfer.',
      },
      {
        question: 'What makes a COD Mobile account valuable?',
        answer:
          'Legendary rank, Legendary-grade weapon Blueprints, exclusive seasonal Operator skins, Lucky Draw completions, original email access and a Battle Pass+ history all significantly increase an account\'s resale value.',
      },
      {
        question: 'How do I buy COD Points (CP) on Piyrox?',
        answer: `Visit the Top-Ups section on ${SITE} and select COD Mobile. Choose your CP package and complete escrow-protected payment. CP is delivered to your account — no account login sharing required.`,
      },
    ],
    trustPoints: [
      'Trust-Trade escrow on every transaction',
      'Legendary-rank verified listings',
      'KYC-verified sellers only',
      '24-hour dispute resolution',
    ],
    valueDrivers: ['Legendary rank border', 'Rare Lucky Draw Blueprints', 'Exclusive Operator skins', 'Original Activision account', 'CP balance & Battle Pass+'],
    metaDescription: `Buy and sell verified COD Mobile accounts on ${SITE}. Find Legendary, Grandmaster and Master ranked accounts with rare Blueprints and Operator skins. Escrow-protected trades.`,
  },

  'blood-strike': {
    slug: 'blood-strike',
    name: 'Blood Strike',
    shortDescription:
      'NetEase Blood Strike is a fast-paced free-to-play FPS available on Android, iOS and PC. Accounts with rare Strikers, Mythic weapon skins and Legend rank are the most traded on the market.',
    buyerGuide: `Find verified Blood Strike accounts on ${SITE}. Browse by rank, Striker collection, Mythic skin ownership, region and login method. Trust-Trade escrow means your payment is only released once you hold the account safely.`,
    rankGuide: {
      title: 'Blood Strike Rank Ladder',
      summary:
        'Blood Strike has a 7-tier rank system. Legend is the top rank and is held by a very small fraction of the playerbase.',
      tiers: [
        { name: 'Bronze', description: 'Entry tier, beginner accounts.' },
        { name: 'Silver', description: 'Early competitive play.' },
        { name: 'Gold', description: 'Mid-level; cosmetics and Striker unlocks begin.' },
        { name: 'Platinum', description: 'Above-average; Strike Pass rewards visible.' },
        { name: 'Diamond', description: 'High-skill bracket; Mythic-grade items appear.' },
        { name: 'Master', description: 'Near-peak; rare Striker collections and Gold stash matter here.' },
        {
          name: 'Legend',
          description:
            'Top rank in Blood Strike. Legend accounts with Mythic skins and rare Strikers are the highest-value listings on the market.',
        },
      ],
    },
    faqs: [
      {
        question: 'Is it safe to buy a Blood Strike account on Piyrox?',
        answer: `Yes. ${SITE} Trust-Trade escrow holds your payment until you confirm full account access. KYC-verified sellers and a 24-hour dispute team protect every buyer.`,
      },
      {
        question: 'What are Blood Strike Golds?',
        answer:
          'Golds are the premium currency in Blood Strike, used to purchase Strikers, weapon skins and the Strike Pass (Elite or Premium). Accounts with a large Gold stash or fully-purchased Strike Pass tiers are worth more.',
      },
      {
        question: 'What login methods does Blood Strike support?',
        answer:
          'Blood Strike accounts can be linked to a NetEase account, Google, Facebook, Apple, Game Center or X (Twitter). NetEase-linked accounts are the most stable for transfers.',
      },
      {
        question: 'What makes a Blood Strike account valuable?',
        answer:
          'Legend rank, Mythic-grade weapon skins, rare limited Strikers, a large Gold balance, completed Strike Pass tiers and original login method access all drive value up.',
      },
      {
        question: 'Does Blood Strike support PC play?',
        answer:
          'Yes — Blood Strike is available on Android, iOS and PC. Accounts linked to a NetEase ID work across all platforms, so PC accounts can be used on mobile and vice versa.',
      },
    ],
    trustPoints: [
      'Trust-Trade escrow on every transaction',
      'KYC-verified sellers only',
      'Cross-platform (mobile + PC) accounts',
      '24-hour dispute resolution',
    ],
    valueDrivers: ['Legend rank', 'Mythic weapon skins', 'Rare limited Strikers', 'Large Gold balance', 'Original NetEase account'],
    metaDescription: `Buy and sell verified Blood Strike accounts on ${SITE}. Find Legend-ranked accounts with Mythic skins and rare Strikers. Escrow-protected trades with KYC-verified sellers.`,
  },
};

/** Returns the SEO content for a game by slug, or null if not found. */
export function getGameSEOContent(slug: string): GameSEOContent | null {
  return GAME_SEO_CONTENT[slug] ?? null;
}

/**
 * Builds a FAQPage JSON-LD block from a list of FAQs.
 * Drop this into a <script type="application/ld+json"> tag for rich results.
 */
export function buildFAQJsonLd(faqs: GameFAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/**
 * Generates per-game boosting-page metadata description.
 */
export function getBoostingMetaDescription(gameName: string, currency: string): string {
  return `Hire verified ${gameName} boosters on Piyrox. Rank boost, solo carry, duo boost and coaching services — all escrow-protected. Pay with ${currency} or USD. Delivered by KYC-verified sellers.`;
}

/**
 * Generates per-game topup metadata description.
 */
export function getTopupMetaDescription(gameName: string, currency: string): string {
  return `Buy official ${gameName} ${currency} top-ups on Piyrox at competitive rates. 100% legitimate, escrow-protected delivery. No account sharing required.`;
}
