#!/usr/bin/env node
/**
 * Velxo Gaming Marketplace — Database Seed
 * Populates: users (sellers + buyers), sellers, wallets, velxoCoins,
 * categories, subcategories, listings (gaming accounts), gigs, topupProducts,
 * gameSlides, marqueeItems, rewardCatalog
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

const usd = (n: number) => n.toFixed(2)

// Real Supabase-CDN-hosted game cover images (public, CDN-backed)
const IMG = {
  freeFire:   'https://velxo.shop/images/games/free-fire.jpg',
  pubg:       'https://velxo.shop/images/games/pubg-mobile.jpg',
  codMobile:  'https://velxo.shop/images/games/cod-mobile.jpg',
  mlbb:       'https://velxo.shop/images/games/mobile-legends.jpg',
  valorant:   'https://velxo.shop/images/games/valorant.jpg',
  fortnite:   'https://velxo.shop/images/games/fortnite.jpg',
  lol:        'https://velxo.shop/images/games/league-of-legends.jpg',
  genshin:    'https://velxo.shop/images/games/genshin-impact.jpg',
  clashClans: 'https://velxo.shop/images/games/clash-of-clans.jpg',
  clashRoyale:'https://velxo.shop/images/games/clash-royale.jpg',
  roblox:     'https://velxo.shop/images/games/roblox.jpg',
  fc24:       'https://velxo.shop/images/games/ea-fc.jpg',
  avatar:     'https://velxo.shop/images/avatars/default.jpg',
}


// ─── Seed Data ──────────────────────────────────────────────────────────────

// Sellers (5 diverse African gaming vendors)
const SELLERS = [
  {
    email: 'kwame.gaming@velxo.shop',
    firstName: 'Kwame',
    lastName: 'Asante',
    storeName: 'Kwame Gaming Store',
    storeDescription: 'Premium Free Fire & PUBG accounts. Trusted seller since 2021 with 500+ successful transactions. Fast delivery, verified accounts only.',
    accountType: 'STANDARD' as const,
    kycStatus: 'APPROVED',
    subscriptionTier: 'PRO',
    reputationScore: 4.8,
    totalSales: 234,
    averageRating: 4.7,
    country: 'Ghana',
  },
  {
    email: 'zainab.plays@velxo.shop',
    firstName: 'Zainab',
    lastName: 'Okonkwo',
    storeName: 'Zainab Pro Gaming',
    storeDescription: 'Specialist in Mobile Legends and COD Mobile accounts. Nigerian seller with instant delivery. All accounts come with full access guarantee.',
    accountType: 'STANDARD' as const,
    kycStatus: 'APPROVED',
    subscriptionTier: 'FREE',
    reputationScore: 4.5,
    totalSales: 89,
    averageRating: 4.4,
    country: 'Nigeria',
  },
  {
    email: 'david.booster@velxo.shop',
    firstName: 'David',
    lastName: 'Ochieng',
    storeName: 'Elite Boost Services',
    storeDescription: 'Professional rank boosting and account services for Valorant, League of Legends, and Mobile Legends. Kenya-based team with 3 years experience.',
    accountType: 'BOOSTER' as const,
    kycStatus: 'APPROVED',
    subscriptionTier: 'PREMIUM',
    reputationScore: 4.9,
    totalSales: 412,
    averageRating: 4.8,
    country: 'Kenya',
  },
  {
    email: 'amina.games@velxo.shop',
    firstName: 'Amina',
    lastName: 'Hassan',
    storeName: 'Amina GameVault',
    storeDescription: 'Your trusted source for Genshin Impact, Fortnite, and Roblox accounts. Egyptian seller with 24/7 support. Secure transactions guaranteed.',
    accountType: 'STANDARD' as const,
    kycStatus: 'APPROVED',
    subscriptionTier: 'PRO',
    reputationScore: 4.6,
    totalSales: 156,
    averageRating: 4.5,
    country: 'Egypt',
  },
  {
    email: 'thabo.gamer@velxo.shop',
    firstName: 'Thabo',
    lastName: 'Molefe',
    storeName: 'Thabo Gaming Hub',
    storeDescription: 'South African seller specializing in EA FC coins, Clash accounts, and gift cards. Quick delivery, competitive prices. Serving gamers since 2020.',
    accountType: 'BOTH' as const,
    kycStatus: 'APPROVED',
    subscriptionTier: 'FREE',
    reputationScore: 4.4,
    totalSales: 67,
    averageRating: 4.3,
    country: 'South Africa',
  },
]


// Buyers (7 diverse African gamers)
const BUYERS = [
  { email: 'chidi.okafor@gmail.com', firstName: 'Chidi', lastName: 'Okafor', country: 'Nigeria' },
  { email: 'fatou.ndiaye@gmail.com', firstName: 'Fatou', lastName: 'Ndiaye', country: 'Senegal' },
  { email: 'yusuf.mohammed@gmail.com', firstName: 'Yusuf', lastName: 'Mohammed', country: 'Ethiopia' },
  { email: 'nairobi.gamer@gmail.com', firstName: 'Brian', lastName: 'Kipchoge', country: 'Kenya' },
  { email: 'grace.mwanza@gmail.com', firstName: 'Grace', lastName: 'Mwanza', country: 'Zambia' },
  { email: 'kofi.mensah@gmail.com', firstName: 'Kofi', lastName: 'Mensah', country: 'Ghana' },
  { email: 'amina.diop@gmail.com', firstName: 'Amina', lastName: 'Diop', country: 'Morocco' },
]

// Categories with subcategories
const CATEGORIES = [
  {
    name: 'Gaming Accounts',
    slug: 'gaming-accounts',
    description: 'Buy verified gaming accounts for all major titles',
    icon: 'Gamepad2',
    subcategories: ['Free Fire', 'PUBG Mobile', 'Call of Duty Mobile', 'Mobile Legends', 'Valorant', 'Fortnite', 'Genshin Impact', 'League of Legends', 'EA FC', 'Roblox'],
  },
  {
    name: 'In-Game Currency',
    slug: 'gaming-coins',
    description: 'Purchase in-game currencies and coins at competitive rates',
    icon: 'Coins',
    subcategories: ['Free Fire Diamonds', 'PUBG UC', 'COD Points', 'ML Diamonds', 'V-Bucks', 'Valorant Points', 'Robux', 'EA FC Coins', 'Genshin Primogems'],
  },
  {
    name: 'Game Top-Ups',
    slug: 'top-ups',
    description: 'Instant top-ups delivered directly to your game account',
    icon: 'Zap',
    subcategories: ['Mobile Legends Top-Up', 'Free Fire Top-Up', 'PUBG Top-Up', 'Genshin Top-Up', 'Valorant Top-Up'],
  },
  {
    name: 'Gift Cards',
    slug: 'gift-cards',
    description: 'Digital gift cards for gaming platforms and stores',
    icon: 'Gift',
    subcategories: ['Steam', 'PlayStation', 'Xbox', 'Nintendo', 'Google Play', 'Apple', 'Razer Gold', 'Amazon', 'Riot Games'],
  },
  {
    name: 'Gaming Services',
    slug: 'services',
    description: 'Professional gaming services including boosting and coaching',
    icon: 'Trophy',
    subcategories: ['Rank Boosting', 'Coaching', 'Account Recovery', 'Battle Pass Service', 'Custom Services'],
  },
]


// Gigs (boosting services) - 2-3 per seller
const createGigs = (sellerId: string, sellerIndex: number): Array<{
  title: string
  description: string
  gameName: string
  rankFrom: string
  rankTo: string
  platform: string
  region: string
  price: number
  deliveryTime: number
  imageUrl: string
}> => {
  const gigTemplates = [
    {
      title: 'Mobile Legends Rank Boost — Warrior to Epic',
      description: 'Professional MLBB rank boosting service. I will boost your account from Warrior to Epic tier safely. No cheats, pure skill. 100% account safety guaranteed with VPN protection. Average completion 3-5 days depending on current rank.',
      gameName: 'Mobile Legends',
      ranks: [['Warrior', 'Elite'], ['Elite', 'Master'], ['Master', 'Grandmaster'], ['Grandmaster', 'Epic']],
      platform: 'Android/iOS',
      region: 'SEA',
      priceRange: [25, 120],
      deliveryDays: 5,
      img: IMG.mlbb,
    },
    {
      title: 'Free Fire Rank Push — Bronze to Heroic',
      description: 'Experienced Free Fire player will push your rank from Bronze to Heroic. Safe methods only, no hacks. Your account details are kept confidential. Includes free tips to maintain your rank. Typical delivery 2-7 days.',
      gameName: 'Free Fire',
      ranks: [['Bronze', 'Silver'], ['Silver', 'Gold'], ['Gold', 'Diamond'], ['Diamond', 'Heroic']],
      platform: 'Android/iOS',
      region: 'Global',
      priceRange: [15, 80],
      deliveryDays: 7,
      img: IMG.freeFire,
    },
    {
      title: 'Valorant Rank Boost — Iron to Diamond',
      description: 'Professional Valorant boosting by Immortal player. Boost from any rank up to Diamond. Duo or solo queue options. Streaming available on request. All agents unlocked required. ETA: 2-10 days.',
      gameName: 'Valorant',
      ranks: [['Iron', 'Bronze'], ['Bronze', 'Silver'], ['Silver', 'Gold'], ['Gold', 'Platinum'], ['Platinum', 'Diamond']],
      platform: 'PC',
      region: 'EU',
      priceRange: [30, 200],
      deliveryDays: 10,
      img: IMG.valorant,
    },
    {
      title: 'PUBG Mobile Tier Boost — Bronze to Conqueror',
      description: 'Push your PUBG Mobile rank safely. Our boosters are Conqueror-tier players with 3+ years experience. FPP and TPP available. We use VPN to protect your account. Completion in 5-14 days.',
      gameName: 'PUBG Mobile',
      ranks: [['Bronze', 'Silver'], ['Silver', 'Gold'], ['Gold', 'Diamond'], ['Diamond', 'Crown'], ['Crown', 'Ace'], ['Ace', 'Conqueror']],
      platform: 'Android/iOS',
      region: 'Global',
      priceRange: [20, 150],
      deliveryDays: 14,
      img: IMG.pubg,
    },
    {
      title: 'League of Legends Elo Boost — Iron to Platinum',
      description: 'Get your LoL account boosted by Diamond+ players. We offer both solo and duo queue boosting. Available for all regions. Champion pool flexibility required. No scripts or hacks used ever. 3-14 days depending on target rank.',
      gameName: 'League of Legends',
      ranks: [['Iron', 'Bronze'], ['Bronze', 'Silver'], ['Silver', 'Gold'], ['Gold', 'Platinum']],
      platform: 'PC',
      region: 'EUW',
      priceRange: [25, 180],
      deliveryDays: 14,
      img: IMG.lol,
    },
    {
      title: 'COD Mobile Ranked Boost — Rookie to Legendary',
      description: 'Professional COD Mobile boosting service. Push from Rookie to Legendary rank. MP and BR modes available. We never use cheats — pure skill. Your stats will improve naturally. Average 4-10 days.',
      gameName: 'Call of Duty Mobile',
      ranks: [['Rookie', 'Veteran'], ['Veteran', 'Elite'], ['Elite', 'Pro'], ['Pro', 'Master'], ['Master', 'Legendary']],
      platform: 'Android/iOS',
      region: 'Global',
      priceRange: [18, 100],
      deliveryDays: 10,
      img: IMG.codMobile,
    },
  ]
  // Select 2-3 gigs per seller
  const sellerGigs = gigTemplates.slice(sellerIndex % 4, (sellerIndex % 4) + 3)
  return sellerGigs.map((gig, idx) => {
    const rankPair = gig.ranks[idx % gig.ranks.length]
    return {
      title: gig.title.split('—')[0].trim() + ` — ${rankPair[0]} to ${rankPair[1]}`,
      description: gig.description,
      gameName: gig.gameName,
      rankFrom: rankPair[0],
      rankTo: rankPair[1],
      platform: gig.platform,
      region: gig.region,
      price: gig.priceRange[0] + Math.floor(Math.random() * (gig.priceRange[1] - gig.priceRange[0])),
      deliveryTime: gig.deliveryDays * 24 * 60, // minutes
      imageUrl: gig.img,
    }
  })
}


// Top-up products
const TOPUP_PRODUCTS = [
  { gameName: 'Free Fire', title: '100 Diamonds', price: 1.99, region: 'Global', deliveryInfo: 'Instant delivery via Player ID' },
  { gameName: 'Free Fire', title: '310 Diamonds', price: 4.99, region: 'Global', deliveryInfo: 'Instant delivery via Player ID' },
  { gameName: 'Free Fire', title: '520 Diamonds', price: 7.99, region: 'Global', deliveryInfo: 'Instant delivery via Player ID' },
  { gameName: 'Free Fire', title: '1060 Diamonds', price: 14.99, region: 'Global', deliveryInfo: 'Instant delivery via Player ID' },
  { gameName: 'Free Fire', title: '2180 Diamonds', price: 29.99, region: 'Global', deliveryInfo: 'Instant delivery via Player ID' },
  { gameName: 'PUBG Mobile', title: '60 UC', price: 0.99, region: 'Global', deliveryInfo: 'Instant via PUBG ID' },
  { gameName: 'PUBG Mobile', title: '325 UC', price: 4.99, region: 'Global', deliveryInfo: 'Instant via PUBG ID' },
  { gameName: 'PUBG Mobile', title: '660 UC', price: 9.99, region: 'Global', deliveryInfo: 'Instant via PUBG ID' },
  { gameName: 'PUBG Mobile', title: '1800 UC', price: 24.99, region: 'Global', deliveryInfo: 'Instant via PUBG ID' },
  { gameName: 'PUBG Mobile', title: '3850 UC', price: 49.99, region: 'Global', deliveryInfo: 'Instant via PUBG ID' },
  { gameName: 'Mobile Legends', title: '86 Diamonds', price: 1.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '172 Diamonds', price: 3.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '257 Diamonds', price: 4.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '344 Diamonds', price: 6.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '514 Diamonds', price: 9.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '706 Diamonds', price: 14.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '1412 Diamonds', price: 29.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Mobile Legends', title: '2195 Diamonds', price: 44.99, region: 'Global', deliveryInfo: 'Instant via MLBB User ID' },
  { gameName: 'Genshin Impact', title: '60 Genesis Crystals', price: 0.99, region: 'Global', deliveryInfo: 'Instant via UID' },
  { gameName: 'Genshin Impact', title: '330 Genesis Crystals', price: 4.99, region: 'Global', deliveryInfo: 'Instant via UID' },
  { gameName: 'Genshin Impact', title: '1090 Genesis Crystals', price: 14.99, region: 'Global', deliveryInfo: 'Instant via UID' },
  { gameName: 'Genshin Impact', title: '2240 Genesis Crystals', price: 29.99, region: 'Global', deliveryInfo: 'Instant via UID' },
  { gameName: 'Genshin Impact', title: '3880 Genesis Crystals', price: 49.99, region: 'Global', deliveryInfo: 'Instant via UID' },
  { gameName: 'Genshin Impact', title: '8080 Genesis Crystals', price: 99.99, region: 'Global', deliveryInfo: 'Instant via UID' },
  { gameName: 'Valorant', title: '125 VP', price: 1.49, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
  { gameName: 'Valorant', title: '420 VP', price: 4.99, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
  { gameName: 'Valorant', title: '700 VP', price: 7.99, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
  { gameName: 'Valorant', title: '1375 VP', price: 14.99, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
  { gameName: 'Valorant', title: '2400 VP', price: 24.99, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
  { gameName: 'Valorant', title: '4000 VP', price: 39.99, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
  { gameName: 'Valorant', title: '8150 VP', price: 79.99, region: 'Global', deliveryInfo: 'Instant via Riot ID' },
]


// Game slides (homepage hero section)
const GAME_SLIDES = [
  {
    title: 'Free Fire',
    subtitle: 'Get Diamonds & Accounts Instantly',
    imageUrl: IMG.freeFire,
    badge: 'Hot',
  },
  {
    title: 'PUBG Mobile',
    subtitle: 'Buy UC & Rank Boost Services',
    imageUrl: IMG.pubg,
    badge: 'New',
  },
  {
    title: 'Mobile Legends',
    subtitle: 'Diamonds, Accounts & Boosting',
    imageUrl: IMG.mlbb,
    badge: null,
  },
  {
    title: 'Valorant',
    subtitle: 'Rank Boost by Pro Players',
    imageUrl: IMG.valorant,
    badge: 'Elite',
  },
  {
    title: 'Genshin Impact',
    subtitle: 'Premium Accounts & Top-Ups',
    imageUrl: IMG.genshin,
    badge: null,
  },
  {
    title: 'Fortnite',
    subtitle: 'V-Bucks & Battle Pass Services',
    imageUrl: IMG.fortnite,
    badge: 'Popular',
  },
]


// Marquee items (announcement bar)
const MARQUEE_ITEMS = [
  { text: '🎮 Welcome to Velxo — Africa\'s #1 Gaming Marketplace', color: 'brand' },
  { text: '✨ Secure Escrow Protection on All Transactions', color: 'brand' },
  { text: '⚡ Instant Delivery on Digital Products', color: 'brand' },
  { text: '🏆 Verified Sellers with 100% Buyer Protection', color: 'brand' },
  { text: '💎 Gaming Accounts, Coins, Top-Ups & More', color: 'brand' },
  { text: '🚀 Join 50,000+ Trusted Gamers Across Africa', color: 'brand' },
  { text: '🤝 Dispute Resolution & 24/7 Support', color: 'brand' },
]

// Reward catalog
const REWARD_CATALOG = [
  {
    name: '$5 Free Fire Gift Card',
    type: 'GIFT_CARD',
    coinCost: 250,
    description: 'Redeem for 200 Free Fire Diamonds instantly. Valid globally.',
    imageUrl: IMG.freeFire,
  },
  {
    name: '$10 PUBG UC Bundle',
    type: 'GIFT_CARD',
    coinCost: 500,
    description: 'Get 600 UC for PUBG Mobile. Instant delivery to your account.',
    imageUrl: IMG.pubg,
  },
  {
    name: 'Mobile Legends 206 Diamonds',
    type: 'TOP_UP',
    coinCost: 300,
    description: 'Instant MLBB diamonds top-up to your account.',
    imageUrl: IMG.mlbb,
  },
  {
    name: '$25 Steam Wallet Gift Card',
    type: 'GIFT_CARD',
    coinCost: 1200,
    description: 'Use on any Steam game, DLC, or in-game item.',
    imageUrl: 'https://velxo.shop/images/platforms/steam.jpg',
  },
  {
    name: 'PlayStation Network $20 Card',
    type: 'GIFT_CARD',
    coinCost: 1000,
    description: 'PSN credit for PS Store games and add-ons.',
    imageUrl: 'https://velxo.shop/images/platforms/playstation.jpg',
  },
  {
    name: 'Genshin Impact 300 Primogems',
    type: 'TOP_UP',
    coinCost: 400,
    description: 'Premium currency top-up for Genshin Impact.',
    imageUrl: IMG.genshin,
  },
]


// Blog posts
const BLOG_POSTS = [
  {
    title: 'How to Stay Safe When Buying Gaming Accounts Online',
    slug: 'stay-safe-buying-accounts',
    excerpt: 'Learn best practices to protect yourself from scams and fraud when purchasing gaming accounts on any marketplace.',
    content: `
# How to Stay Safe When Buying Gaming Accounts Online

Buying gaming accounts online can be a great way to get premium content, but it comes with risks. Here are proven strategies to protect yourself:

## 1. Use Escrow Protection
Always use a marketplace with escrow protection like Velxo. This ensures funds are held securely until you receive what you paid for.

## 2. Verify Seller Reputation
Check the seller's ratings, reviews, and transaction history. Look for sellers with 4.5+ stars and hundreds of completed transactions.

## 3. Check Account Verification
Ensure the account comes with proof of ownership and all original security details are transferred.

## 4. Change Passwords Immediately
After receiving the account, change the password, email, and enable 2FA. Most reputable sellers expect this.

## 5. Document Everything
Take screenshots of the purchase, delivery confirmation, and account details for evidence if disputes arise.

## 6. Avoid Sharing Payment Info Directly
Use the marketplace's secure payment system. Never wire money directly or use untraceable payment methods.

### Red Flags to Watch For:
- Prices significantly lower than market rate
- Sellers pushing for off-platform payments
- Accounts with suspicious activity or bans
- Sellers with zero reviews or negative history
- Pressure to complete transactions quickly

Follow these guidelines and you'll have a safe, secure experience buying gaming accounts!
`,
    category: 'Safety',
    author: 'Velxo Team',
    isPublished: true,
    isFeatured: true,
  },
  {
    title: 'Top 5 Gaming Trends to Watch in 2025',
    slug: 'gaming-trends-2025',
    excerpt: 'Explore the hottest gaming trends taking over Africa and the world in 2025.',
    content: `
# Top 5 Gaming Trends to Watch in 2025

The gaming landscape is evolving rapidly. Here are the trends shaping 2025:

## 1. Mobile Gaming Dominance
Mobile games continue to lead in Africa due to accessibility and low device costs.

## 2. Cloud Gaming Expansion
Services like Xbox Cloud Gaming and PlayStation Plus Premium are making console experiences mobile-accessible.

## 3. Cross-Platform Play
Games like Valorant, Fortnite, and PUBG are breaking platform barriers with true cross-play.

## 4. Esports Growth in Africa
African esports tournaments and prize pools are growing exponentially, attracting top talent.

## 5. Play-to-Earn Evolution
Web3 gaming and play-to-earn models are maturing with better tokenomics and real utility.

Stay ahead of the curve by following these trends and joining the Velxo community!
`,
    category: 'Trends',
    author: 'Gaming Analyst',
    isPublished: true,
    isFeatured: false,
  },
  {
    title: 'Velxo Seller Success Story: Kwame Gaming Store',
    slug: 'seller-success-kwame-gaming',
    excerpt: 'Read how Kwame turned his gaming passion into a thriving business on Velxo.',
    content: `
# Velxo Seller Success Story: Kwame Gaming Store

**From gamer to entrepreneur** — that's the Kwame Gaming Store story.

Started in 2021 with just 5 accounts listed, Kwame has grown to 234 successful sales and a 4.7-star rating.

## The Journey
Kwame started small, testing the market with Free Fire and PUBG accounts. His commitment to fast delivery and customer service quickly earned him trust.

## Key Success Factors
1. **Consistency** - Delivered on every promise
2. **Communication** - Responded to buyers within 10 minutes
3. **Quality** - Only listed verified, legitimate accounts
4. **Reputation** - Prioritized reviews over volume

Today, Kwame runs a team, offers 15+ account types, and has earned Pro subscription benefits including a public storefront.

**Want to replicate Kwame's success?** Start selling on Velxo today!
`,
    category: 'Success Stories',
    author: 'Velxo Team',
    isPublished: true,
    isFeatured: true,
  },
]


// Gaming accounts listings - diverse set per seller
const createListings = (sellerId: string, sellerIndex: number): Array<{
  title: string
  description: string
  gameName: string
  platform: string
  region: string
  rank?: string
  level?: number
  price: number
  images: string[]
  loginMethod: string
  status: 'ACTIVE' | 'DRAFT'
}> => {
  const listings = [
    {
      title: 'Free Fire Account — Level 45 with 18 Skins',
      description: `Premium Free Fire account ready to use. Account details:
• Level 45 (Heroic rank)
• 18 Legendary skins including Hayato Phantom, Hayato Neon
• 2500 Diamonds balance
• 45,000 Gold
• Fully unlocked characters
• No bans, clean account history
• Email will be transferred with account recovery codes
• 2FA enabled for security
• Instant delivery via email transfer
Seller: ${SELLERS[sellerIndex]?.storeName || 'Professional Seller'}
Safe & Verified ✓ Escrow Protected ✓ Instant Delivery ✓`,
      gameName: 'Free Fire',
      platform: 'Android/iOS',
      region: 'Global',
      rank: 'Heroic',
      price: 85,
      images: [IMG.freeFire],
      loginMethod: 'Email Transfer',
    },
    {
      title: 'PUBG Mobile Account — Conqueror with 150 UC',
      description: `High-tier PUBG Mobile account with Conqueror rank. Includes:
• Rank: Conqueror (Season 28)
• 150 UC balance
• 50+ cosmetics unlocked
• All weapons skins
• Multiple emotes and parachutes
• Clean account with no suspensions
• Statistics available on profile
• Full access to all modes
• Level 48
Delivery: Direct account transfer with recovery emails
Velxo Guarantee: 100% safe, verified seller with 412+ sales`,
      gameName: 'PUBG Mobile',
      platform: 'Android/iOS',
      region: 'Global',
      rank: 'Conqueror',
      price: 120,
      images: [IMG.pubg],
      loginMethod: 'Email Transfer',
    },
    {
      title: 'Mobile Legends Account — Mythic 2 with Rare Skins',
      description: `Competitive Mobile Legends account at high rank. Account contains:
• Current Rank: Mythic 2 (96 stars)
• 25 Heroes unlocked
• 45 Skins including 8 Epic skins
• 2 Magic Dust
• 18,000 BP
• 25 Tickets
• All heroes at minimum 20 stars
• Perfect for ranked push
• Account age: 4 years
Clean record, no restrictions`,
      gameName: 'Mobile Legends',
      platform: 'Android/iOS',
      region: 'Global',
      rank: 'Mythic 2',
      price: 95,
      images: [IMG.mlbb],
      loginMethod: 'Moonton ID Transfer',
    },
    {
      title: 'Valorant Account — Diamond 2 with All Agents Unlocked',
      description: `Competitive Valorant account ready for ranked. Details:
• Current Rank: Diamond 2 in last episode
• All 24 agents unlocked and mastered
• 85+ skin collection including Reaver, Dragon Lore, Elderflame variants
• Radiant MMR: 220 RR
• Valorant Points available for next purchase
• No hardware bans or restrictions
• Region: EU (can change region)
• Account verified and clean
Perfect for competitive players or collectors`,
      gameName: 'Valorant',
      platform: 'PC',
      region: 'EU',
      rank: 'Diamond 2',
      price: 150,
      images: [IMG.valorant],
      loginMethod: 'Riot ID Transfer',
    },
    {
      title: 'Genshin Impact Account — AR 58 with 70+ Characters',
      description: `Late-game Genshin account with massive roster. Includes:
• Adventure Rank: 58 (max level)
• 72 Characters (includes all limited 5-stars from past 2 years)
• 8 Five-star weapons
• All daily domains cleared
• Spiral Abyss: Floor 12 (36 stars)
• 50,000+ Primogems farming potential remaining
• Welkin Moon: 60 days remaining
• Perfect for experienced players
• Server: Asia
• Full 2FA setup with recovery codes`,
      gameName: 'Genshin Impact',
      platform: 'PC/Mobile',
      region: 'Asia',
      level: 58,
      price: 280,
      images: [IMG.genshin],
      loginMethod: 'HoYoverse Account Transfer',
    },
  ]
  return listings.map((listing, idx) => ({
    ...listing,
    status: 'ACTIVE' as const,
  }))
}


// ─── MAIN SEED FUNCTION ─────────────────────────────────────────────────────

async function main() {
  try {
    console.log('🚀 Starting Velxo Database Seed...\n')

    // 1. Create Admin User
    console.log('📝 Creating admin user...')
    const admin = await prisma.users.upsert({
      where: { email: 'admin@velxo.shop' },
      update: {},
      create: {
        email: 'admin@velxo.shop',
        firstName: 'Admin',
        lastName: 'Velxo',
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true,
      },
    })
    console.log(`✅ Admin created: ${admin.email}\n`)

    // 2. Create Categories & Subcategories
    console.log('📂 Creating categories and subcategories...')
    for (const cat of CATEGORIES) {
      const category = await prisma.categories.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          isActive: true,
        },
      })
      // Create subcategories
      for (let i = 0; i < cat.subcategories.length; i++) {
        const subName = cat.subcategories[i]
        await prisma.subcategories.upsert({
          where: {
            categoryId_slug: {
              categoryId: category.id,
              slug: subName.toLowerCase().replace(/\s+/g, '-'),
            },
          },
          update: {},
          create: {
            categoryId: category.id,
            name: subName,
            slug: subName.toLowerCase().replace(/\s+/g, '-'),
            sortOrder: i,
            isActive: true,
          },
        })
      }
    }
    console.log(`✅ Categories and ${CATEGORIES.reduce((sum, c) => sum + c.subcategories.length, 0)} subcategories created\n`)

    // 3. Create Seller Users & Sellers
    console.log('🏪 Creating sellers...')
    const createdSellers: any[] = []
    for (let i = 0; i < SELLERS.length; i++) {
      const sellerData = SELLERS[i]
      const user = await prisma.users.upsert({
        where: { email: sellerData.email },
        update: {},
        create: {
          email: sellerData.email,
          firstName: sellerData.firstName,
          lastName: sellerData.lastName,
          role: 'SELLER',
          emailVerified: true,
          isActive: true,
        },
      })

      const seller = await prisma.sellers.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          storeName: sellerData.storeName,
          storeDescription: sellerData.storeDescription,
          storeSlug: sellerData.storeName.toLowerCase().replace(/\s+/g, '-'),
          accountType: sellerData.accountType,
          isVerified: true,
          verifiedAt: new Date(),
          kycStatus: sellerData.kycStatus,
          reputationScore: sellerData.reputationScore,
          totalSales: sellerData.totalSales,
          totalRevenue: new (require('@prisma/client')).Decimal(sellerData.totalSales * 50), // avg $50 per sale
          averageRating: sellerData.averageRating,
          responseRate: 98,
          subscriptionTier: sellerData.subscriptionTier,
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      })

      createdSellers.push({ user, seller })

      // Create wallet for seller
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: new (require('@prisma/client')).Decimal(Math.random() * 5000 + 1000),
          totalEarnings: new (require('@prisma/client')).Decimal(sellerData.totalSales * 45),
          currency: 'USD',
        },
      })

      // Create velxoCoins for seller
      await prisma.velxoCoins.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: Math.floor(Math.random() * 5000 + 1000),
        },
      })

      console.log(`  ✓ ${sellerData.storeName}`)
    }
    console.log(`✅ ${createdSellers.length} sellers created\n`)


    // 4. Create Buyer Users & Wallets
    console.log('👥 Creating buyers...')
    const createdBuyers: any[] = []
    for (const buyerData of BUYERS) {
      const user = await prisma.users.upsert({
        where: { email: buyerData.email },
        update: {},
        create: {
          email: buyerData.email,
          firstName: buyerData.firstName,
          lastName: buyerData.lastName,
          role: 'BUYER',
          emailVerified: true,
          isActive: true,
        },
      })

      // Create wallet
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: new (require('@prisma/client')).Decimal(Math.random() * 2000),
          currency: 'USD',
        },
      })

      // Create velxoCoins
      await prisma.velxoCoins.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: Math.floor(Math.random() * 2000),
        },
      })

      createdBuyers.push(user)
      console.log(`  ✓ ${buyerData.firstName} ${buyerData.lastName}`)
    }
    console.log(`✅ ${createdBuyers.length} buyers created\n`)

    // 5. Create Listings (Gaming Accounts)
    console.log('📋 Creating listings...')
    let listingCount = 0
    const gameCategory = await prisma.categories.findUnique({
      where: { slug: 'gaming-accounts' },
    })

    if (gameCategory) {
      for (let i = 0; i < createdSellers.length; i++) {
        const seller = createdSellers[i].seller
        const listings = createListings(seller.id, i)

        for (const listingData of listings) {
          const listing = await prisma.listings.create({
            data: {
              sellerId: seller.id,
              categoryId: gameCategory.id,
              title: listingData.title,
              description: listingData.description,
              gameName: listingData.gameName,
              platform: listingData.platform,
              region: listingData.region,
              rank: listingData.rank,
              level: listingData.level,
              price: new (require('@prisma/client')).Decimal(listingData.price),
              currency: 'USD',
              images: listingData.images,
              loginMethod: listingData.loginMethod,
              status: 'ACTIVE',
              isFeatured: Math.random() > 0.7, // 30% featured
              viewCount: Math.floor(Math.random() * 500 + 50),
              salesCount: Math.floor(Math.random() * 20),
            },
          })
          listingCount++
        }
      }
    }
    console.log(`✅ ${listingCount} listings created\n`)

    // 6. Create Gigs
    console.log('🎮 Creating gigs...')
    let gigCount = 0
    for (let i = 0; i < createdSellers.length; i++) {
      const seller = createdSellers[i].seller
      const gigs = createGigs(seller.id, i)

      for (const gigData of gigs) {
        await prisma.gigs.create({
          data: {
            sellerId: seller.id,
            title: gigData.title,
            description: gigData.description,
            gameName: gigData.gameName,
            rankFrom: gigData.rankFrom,
            rankTo: gigData.rankTo,
            platform: gigData.platform,
            region: gigData.region,
            price: new (require('@prisma/client')).Decimal(gigData.price),
            deliveryTime: gigData.deliveryTime,
            imageUrl: gigData.imageUrl,
            status: 'ACTIVE',
            isActive: true,
          },
        })
        gigCount++
      }
    }
    console.log(`✅ ${gigCount} gigs created\n`)

    // 7. Create Top-Up Products
    console.log('💎 Creating top-up products...')
    for (const product of TOPUP_PRODUCTS) {
      await prisma.topupProducts.create({
        data: {
          gameName: product.gameName,
          title: product.title,
          price: new (require('@prisma/client')).Decimal(product.price),
          region: product.region,
          deliveryInfo: product.deliveryInfo,
          isActive: true,
          sortOrder: TOPUP_PRODUCTS.indexOf(product),
        },
      })
    }
    console.log(`✅ ${TOPUP_PRODUCTS.length} top-up products created\n`)


    // 8. Create Game Slides
    console.log('🖼️  Creating game slides...')
    for (let i = 0; i < GAME_SLIDES.length; i++) {
      const slide = GAME_SLIDES[i]
      await prisma.gameSlides.create({
        data: {
          title: slide.title,
          subtitle: slide.subtitle,
          imageUrl: slide.imageUrl,
          badge: slide.badge,
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${GAME_SLIDES.length} game slides created\n`)

    // 9. Create Marquee Items
    console.log('📢 Creating marquee items...')
    for (let i = 0; i < MARQUEE_ITEMS.length; i++) {
      const item = MARQUEE_ITEMS[i]
      await prisma.marqueeItems.create({
        data: {
          text: item.text,
          color: item.color,
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${MARQUEE_ITEMS.length} marquee items created\n`)

    // 10. Create Reward Catalog
    console.log('🎁 Creating reward catalog...')
    for (let i = 0; i < REWARD_CATALOG.length; i++) {
      const reward = REWARD_CATALOG[i]
      await prisma.rewardCatalog.create({
        data: {
          name: reward.name,
          description: reward.description,
          type: reward.type,
          coinCost: reward.coinCost,
          imageUrl: reward.imageUrl,
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${REWARD_CATALOG.length} rewards created\n`)

    // 11. Create Blog Posts
    console.log('📰 Creating blog posts...')
    for (const post of BLOG_POSTS) {
      const now = new Date()
      await prisma.blogPosts.upsert({
        where: { slug: post.slug },
        update: {},
        create: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          author: post.author,
          isPublished: post.isPublished,
          isFeatured: post.isFeatured,
          publishedAt: post.isPublished ? now : null,
        },
      })
    }
    console.log(`✅ ${BLOG_POSTS.length} blog posts created\n`)

    // 12. Summary
    console.log('\n' + '='.repeat(70))
    console.log('✨ VELXO DATABASE SEEDING COMPLETE! ✨')
    console.log('='.repeat(70))
    console.log('\n📊 Summary:')
    console.log(`  • Admin Users: 1`)
    console.log(`  • Sellers: ${createdSellers.length}`)
    console.log(`  • Buyers: ${createdBuyers.length}`)
    console.log(`  • Gaming Accounts (Listings): ${listingCount}`)
    console.log(`  • Gigs (Services): ${gigCount}`)
    console.log(`  • Top-Up Products: ${TOPUP_PRODUCTS.length}`)
    console.log(`  • Game Slides: ${GAME_SLIDES.length}`)
    console.log(`  • Marquee Items: ${MARQUEE_ITEMS.length}`)
    console.log(`  • Reward Catalog Items: ${REWARD_CATALOG.length}`)
    console.log(`  • Blog Posts: ${BLOG_POSTS.length}`)
    console.log(`  • Categories: ${CATEGORIES.length}`)
    console.log(`  • Subcategories: ${CATEGORIES.reduce((sum, c) => sum + c.subcategories.length, 0)}`)
    console.log('\n🔗 Test Accounts:')
    console.log(`  Admin: admin@velxo.shop`)
    SELLERS.forEach(s => {
      console.log(`  Seller: ${s.email}`)
    })
    BUYERS.forEach(b => {
      console.log(`  Buyer: ${b.email}`)
    })
    console.log('\n✅ Your marketplace is ready to explore!\n')
  } catch (error) {
    console.error('❌ Seed Error:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
