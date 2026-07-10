#!/usr/bin/env node
/**
 * Velxo Gaming Marketplace — Professional Seed
 * Creates: 11 sellers, 16 buyers, 70+ listings, gigs, categories with subcategories
 * Games: Free Fire, Bloodstrike, CODM, PUBG Mobile
 */
import { PrismaClient, Role, SellerAccountType, ListingStatus, GigStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

const IMG = {
  freeFire: '/images/games/FREE_FIRE_LOGO.png',
  pubg: '/images/games/pubg logo.jpg',
  ml: '/images/games/mobilelegend logo.png',
  valorant: '/images/games/valorant logo.png',
  codm: '/images/games/codm logo.png',
  bloodstrike: '/images/games/bloodstrike logo.jpg',
}

async function main() {
  try {
    console.log('🚀 Starting Velxo Database Seed...\n')

    // 1. Create Admin
    console.log('📝 Creating admin user...')
    const admin = await prisma.users.create({
      data: {
        email: 'admin@velxo.shop',
        firstName: 'Admin',
        lastName: 'Velxo',
        role: Role.SUPER_ADMIN,
        isActive: true,
        emailVerified: true,
      },
    })
    console.log(`✅ Admin created: ${admin.email}\n`)

    // 2. Create Categories & Subcategories
    console.log('📂 Creating categories and subcategories...')

    // Gaming Accounts Category
    const gamingAccounts = await prisma.categories.create({
      data: {
        name: 'Gaming Accounts',
        slug: 'gaming-accounts',
        description: 'Buy verified gaming accounts for all major games',
        icon: 'Gamepad2',
        sortOrder: 1,
        isActive: true,
      },
    })

    const gaSubcats = [
      { name: 'Free Fire Accounts', slug: 'free-fire-accounts', icon: '🔥' },
      { name: 'PUBG Mobile Accounts', slug: 'pubg-accounts', icon: '🎖️' },
      { name: 'CODM Accounts', slug: 'codm-accounts', icon: '🎯' },
      { name: 'Bloodstrike Accounts', slug: 'bloodstrike-accounts', icon: '⚔️' },
      { name: 'Mobile Legends Accounts', slug: 'ml-accounts', icon: '🗡️' },
      { name: 'Valorant Accounts', slug: 'valorant-accounts', icon: '🎮' },
      { name: 'Genshin Impact Accounts', slug: 'genshin-accounts', icon: '⭐' },
      { name: 'Fortnite Accounts', slug: 'fortnite-accounts', icon: '🏆' },
      { name: 'Roblox Accounts', slug: 'roblox-accounts', icon: '🎲' },
      { name: 'Other Game Accounts', slug: 'other-game-accounts', icon: '🎪' },
    ]

    for (const subcat of gaSubcats) {
      await prisma.subcategories.create({
        data: {
          categoryId: gamingAccounts.id,
          name: subcat.name,
          slug: subcat.slug,
          description: `Buy and sell ${subcat.name.toLowerCase()}`,
          isActive: true,
        },
      })
    }

    // In-Game Currency Category
    const inGameCurrency = await prisma.categories.create({
      data: {
        name: 'In-Game Currency',
        slug: 'in-game-currency',
        description: 'Purchase in-game currencies and virtual money',
        icon: 'Coins',
        sortOrder: 2,
        isActive: true,
      },
    })

    const igcSubcats = [
      { name: 'Free Fire Diamonds', slug: 'ff-diamonds', icon: '💎' },
      { name: 'PUBG UC', slug: 'pubg-uc', icon: '💵' },
      { name: 'CODM CP', slug: 'codm-cp', icon: '🪙' },
      { name: 'ML Diamonds', slug: 'ml-diamonds', icon: '✨' },
      { name: 'Valorant Points', slug: 'valorant-points', icon: '🎯' },
      { name: 'Genshin Primogems', slug: 'genshin-primogems', icon: '⭐' },
      { name: 'Fortnite V-Bucks', slug: 'fortnite-vbucks', icon: '💜' },
      { name: 'Robux', slug: 'robux', icon: '🎲' },
      { name: 'Other Currencies', slug: 'other-currencies', icon: '💰' },
    ]

    for (const subcat of igcSubcats) {
      await prisma.subcategories.create({
        data: {
          categoryId: inGameCurrency.id,
          name: subcat.name,
          slug: subcat.slug,
          description: `Buy ${subcat.name.toLowerCase()}`,
          isActive: true,
        },
      })
    }

    // Game Top-Ups Category
    const topUps = await prisma.categories.create({
      data: {
        name: 'Game Top-Ups',
        slug: 'game-top-ups',
        description: 'Instant top-ups to your game account',
        icon: 'Zap',
        sortOrder: 3,
        isActive: true,
      },
    })

    const tuSubcats = [
      { name: 'Free Fire Top-Ups', slug: 'ff-topups', icon: '🔥' },
      { name: 'PUBG Top-Ups', slug: 'pubg-topups', icon: '🎖️' },
      { name: 'CODM Top-Ups', slug: 'codm-topups', icon: '🎯' },
      { name: 'ML Top-Ups', slug: 'ml-topups', icon: '🗡️' },
      { name: 'Valorant Top-Ups', slug: 'valorant-topups', icon: '🎮' },
    ]

    for (const subcat of tuSubcats) {
      await prisma.subcategories.create({
        data: {
          categoryId: topUps.id,
          name: subcat.name,
          slug: subcat.slug,
          description: `Get instant ${subcat.name.toLowerCase()}`,
          isActive: true,
        },
      })
    }

    // Gift Cards Category
    const giftCards = await prisma.categories.create({
      data: {
        name: 'Gift Cards',
        slug: 'gift-cards',
        description: 'Digital gift cards for games and services',
        icon: 'Gift',
        sortOrder: 4,
        isActive: true,
      },
    })

    const gcSubcats = [
      { name: 'Steam Gift Cards', slug: 'steam-cards', icon: '🎮' },
      { name: 'PlayStation Gift Cards', slug: 'playstation-cards', icon: '🎮' },
      { name: 'Xbox Gift Cards', slug: 'xbox-cards', icon: '🎮' },
      { name: 'Google Play Cards', slug: 'google-play-cards', icon: '📱' },
      { name: 'Apple Gift Cards', slug: 'apple-cards', icon: '🍎' },
      { name: 'Razer Gold', slug: 'razer-gold', icon: '⚡' },
      { name: 'Amazon Gift Cards', slug: 'amazon-cards', icon: '🛒' },
      { name: 'Riot Games Cards', slug: 'riot-cards', icon: '🎮' },
      { name: 'Other Gift Cards', slug: 'other-cards', icon: '🎁' },
    ]

    for (const subcat of gcSubcats) {
      await prisma.subcategories.create({
        data: {
          categoryId: giftCards.id,
          name: subcat.name,
          slug: subcat.slug,
          description: `Buy ${subcat.name.toLowerCase()}`,
          isActive: true,
        },
      })
    }

    // Gaming Services Category
    const services = await prisma.categories.create({
      data: {
        name: 'Gaming Services',
        slug: 'gaming-services',
        description: 'Professional gaming services including boosting',
        icon: 'Trophy',
        sortOrder: 5,
        isActive: true,
      },
    })

    const svcSubcats = [
      { name: 'Rank Boosting', slug: 'rank-boosting', icon: '📈' },
      { name: 'Coaching', slug: 'coaching', icon: '👨‍🏫' },
      { name: 'Account Recovery', slug: 'account-recovery', icon: '🔐' },
      { name: 'Battle Pass Service', slug: 'battle-pass', icon: '🎖️' },
      { name: 'Custom Services', slug: 'custom-services', icon: '⚙️' },
    ]

    for (const subcat of svcSubcats) {
      await prisma.subcategories.create({
        data: {
          categoryId: services.id,
          name: subcat.name,
          slug: subcat.slug,
          description: `Get ${subcat.name.toLowerCase()} services`,
          isActive: true,
        },
      })
    }

    console.log(`✅ 5 categories with 44 subcategories created\n`)

    // 3. Create 11 Sellers
    console.log('🏪 Creating 11 sellers with gamer-type names...')
    const sellersData = [
      { email: 'noobmaster92@velxo.shop', name: 'NoobMaster92', desc: 'Free Fire legend accounts & boosting. Pro player since 2020. 500+ happy customers!' },
      { email: 'shadowhunter88@velxo.shop', name: 'ShadowHunter88', desc: 'PUBG & Bloodstrike specialist. Conqueror rank booster. Premium quality guaranteed.' },
      { email: 'phoenixgamer23@velxo.shop', name: 'PhoenixGamer23', desc: 'CODM accounts & services. 1K+ successful sales. Fast delivery, 24/7 support.' },
      { email: 'vortexking99@velxo.shop', name: 'VortexKing99', desc: 'Multi-game booster. All ranks covered. Instant delivery. Verified seller.' },
      { email: 'titanforce55@velxo.shop', name: 'TitanForce55', desc: 'PUBG Conqueror booster. Mythic+ Free Fire. 8 years gaming experience.' },
      { email: 'ghostrider77@velxo.shop', name: 'GhostRider77', desc: 'Bloodstrike & Free Fire expert. Fast & safe. 400+ positive reviews.' },
      { email: 'cyberpunk33@velxo.shop', name: 'CyberPunk33', desc: 'CODM & Valorant specialist. Diamond accounts. Professional delivery.' },
      { email: 'inferno666@velxo.shop', name: 'Inferno666', desc: 'Free Fire mythic accounts. 5 years gaming. 500+ reviews. Trusted seller.' },
      { email: 'nexus2024@velxo.shop', name: 'Nexus2024', desc: 'All games covered. Premium quality. 24/7 customer support. Verified.' },
      { email: 'primal_beast@velxo.shop', name: 'PrimalBeast', desc: 'PUBG conqueror booster. Instant delivery. 100% safe method. Pro team.' },
      { email: 'lunar_eclipse@velxo.shop', name: 'LunarEclipse', desc: 'Bloodstrike & CODM specialist. Elite tier booster. Fast transaction.' },
    ]

    const sellers = []
    for (const sellerData of sellersData) {
      const nameParts = sellerData.name.match(/[A-Z][a-z]*|\d+/g) || [sellerData.name]
      const user = await prisma.users.create({
        data: {
          email: sellerData.email,
          firstName: nameParts[0] || 'Gaming',
          lastName: nameParts.slice(1).join(' ') || 'Seller',
          role: Role.SELLER,
          emailVerified: true,
          isActive: true,
        },
      })

      const seller = await prisma.sellers.create({
        data: {
          userId: user.id,
          storeName: sellerData.name,
          storeDescription: sellerData.desc,
          storeSlug: sellerData.name.toLowerCase().replace(/\s+/g, '-'),
          accountType: SellerAccountType.STANDARD,
          isVerified: true,
          verifiedAt: new Date(),
          kycStatus: 'APPROVED',
          reputationScore: Math.random() * 0.4 + 4.5,
          totalSales: Math.floor(Math.random() * 400 + 50),
          totalRevenue: new Decimal(Math.floor(Math.random() * 50000 + 5000)),
          averageRating: Math.random() * 0.3 + 4.5,
          responseRate: 95 + Math.random() * 5,
          subscriptionTier: ['FREE', 'PRO', 'PREMIUM'][Math.floor(Math.random() * 3)],
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: new Decimal(Math.random() * 5000 + 1000),
          totalEarnings: new Decimal(Math.random() * 50000 + 5000),
          currency: 'USD',
        },
      })

      await prisma.velxoCoins.create({
        data: {
          userId: user.id,
          balance: Math.floor(Math.random() * 5000 + 1000),
        },
      })

      sellers.push(seller)
      console.log(`  ✓ ${sellerData.name}`)
    }
    console.log(`✅ ${sellers.length} sellers created\n`)

    // 4. Create 16 Buyers
    console.log('👥 Creating 16 buyers from Africa...')
    const buyersData = [
      { email: 'chidi.okafor@gmail.com', name: 'Chidi Okafor' },
      { email: 'fatou.ndiaye@gmail.com', name: 'Fatou Ndiaye' },
      { email: 'yusuf.mohammed@gmail.com', name: 'Yusuf Mohammed' },
      { email: 'nairobi.gamer@gmail.com', name: 'Brian Kipchoge' },
      { email: 'grace.mwanza@gmail.com', name: 'Grace Mwanza' },
      { email: 'kofi.mensah@gmail.com', name: 'Kofi Mensah' },
      { email: 'amina.diop@gmail.com', name: 'Amina Diop' },
      { email: 'david.makwere@gmail.com', name: 'David Makwere' },
      { email: 'zainab.hussein@gmail.com', name: 'Zainab Hussein' },
      { email: 'mwangi.simon@gmail.com', name: 'Simon Mwangi' },
      { email: 'blessing.obi@gmail.com', name: 'Blessing Obi' },
      { email: 'amara.ahmed@gmail.com', name: 'Amara Ahmed' },
      { email: 'sekou.sano@gmail.com', name: 'Sekou Sano' },
      { email: 'nia.thompson@gmail.com', name: 'Nia Thompson' },
      { email: 'kwesi.boateng@gmail.com', name: 'Kwesi Boateng' },
      { email: 'aisha.moudi@gmail.com', name: 'Aisha Moudi' },
    ]

    for (const buyerData of buyersData) {
      const user = await prisma.users.create({
        data: {
          email: buyerData.email,
          firstName: buyerData.name.split(' ')[0],
          lastName: buyerData.name.split(' ')[1],
          role: Role.BUYER,
          emailVerified: true,
          isActive: true,
        },
      })

      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: new Decimal(Math.random() * 2000),
          currency: 'USD',
        },
      })

      await prisma.velxoCoins.create({
        data: {
          userId: user.id,
          balance: Math.floor(Math.random() * 2000),
        },
      })

      console.log(`  ✓ ${buyerData.name}`)
    }
    console.log(`✅ ${buyersData.length} buyers created\n`)

    // 5. Create 74 Listings
    console.log('📋 Creating 74 listings across 4 games...')

    // Get Free Fire subcategory
    const ffSubcat = await prisma.subcategories.findUnique({
      where: {
        categoryId_slug: {
          categoryId: gamingAccounts.id,
          slug: 'free-fire-accounts',
        },
      },
    })

    const pubgSubcat = await prisma.subcategories.findUnique({
      where: {
        categoryId_slug: {
          categoryId: gamingAccounts.id,
          slug: 'pubg-accounts',
        },
      },
    })

    const codmSubcat = await prisma.subcategories.findUnique({
      where: {
        categoryId_slug: {
          categoryId: gamingAccounts.id,
          slug: 'codm-accounts',
        },
      },
    })

    const bsSubcat = await prisma.subcategories.findUnique({
      where: {
        categoryId_slug: {
          categoryId: gamingAccounts.id,
          slug: 'bloodstrike-accounts',
        },
      },
    })

    // Free Fire Listings (20)
    const ffTitles = [
      'Free Fire Level 45 Heroic Rank 18 Skins',
      'FF Account Level 52 Mythic 32 Skins',
      'Free Fire Master Account 48 Skins $99',
      'FF Heroic Level 40 20 Legendary Skins',
      'Free Fire Mythic+4 Level 55 Premium',
      'FF Level 38 Diamond 25 Skins Fast',
      'Free Fire Legend Account 60 Skins',
      'FF Heroic Rank 42 Level Premium Bundle',
      'Free Fire Master 50 Level 30 Rare Skins',
      'FF Account 45 Diamonds Full Collection',
      'Free Fire Mythic 56 Level Max BP',
      'FF Legend Rank 52 Amazing Skins',
      'Free Fire Diamond Rank 35 18 Skins',
      'FF Heroic 47 Level 22 Epic Weapons',
      'Free Fire Master Account 49 Level',
      'FF Mythic Level 54 Complete Skin Set',
      'Free Fire Heroic 41 Level 20 Skins',
      'FF Legend 53 Level Rare Collection',
      'Free Fire Diamond 36 Level Fast Deal',
      'FF Master 51 Level Amazing Value',
    ]

    for (let i = 0; i < ffTitles.length; i++) {
      const seller = sellers[i % sellers.length]
      const rank = ['Heroic', 'Mythic', 'Legend', 'Master', 'Diamond'][Math.floor(Math.random() * 5)]
      const level = 35 + Math.floor(Math.random() * 25)
      const price = 75 + Math.floor(Math.random() * 75)

      await prisma.listings.create({
        data: {
          sellerId: seller.id,
          categoryId: gamingAccounts.id,
          subcategoryId: ffSubcat?.id,
          title: ffTitles[i],
          description: `Premium Free Fire account at ${rank} tier. Level ${level}. Perfect for ranked. Safe delivery. Verified seller. 100% buyer protection. Fast transaction guaranteed.`,
          gameName: 'Free Fire',
          price: new Decimal(price),
          currency: 'USD',
          rank,
          level,
          loginMethod: 'Email Transfer',
          platform: 'Android/iOS',
          region: 'Global',
          status: ListingStatus.ACTIVE,
          images: [IMG.freeFire],
          isFeatured: Math.random() > 0.3,
          viewCount: Math.floor(Math.random() * 500 + 50),
          salesCount: Math.floor(Math.random() * 20),
        },
      })
    }

    // PUBG Mobile Listings (18)
    const pubgTitles = [
      'PUBG Mobile Conqueror 2500 UC',
      'Pubg Crown 2000 UC Premium',
      'PUBG Diamond 1500 UC Clean',
      'Pubg Mobile Conqueror 2200 UC',
      'PUBG Ace Tier 1800 UC Deal',
      'Pubg Platinum 1000 UC Budget',
      'PUBG Mobile Crown 2100 UC Pro',
      'Pubg Diamond 1600 UC Quick',
      'PUBG Conqueror 2400 UC Top',
      'Pubg Mobile Ace 1900 UC Safe',
      'PUBG Crown 2000 UC Value',
      'Pubg Gold 800 UC Starter',
      'PUBG Mobile Diamond 1700 UC',
      'Pubg Platinum 1100 UC Clean',
      'PUBG Ace 2000 UC Premium',
      'Pubg Conqueror 2600 UC Master',
      'PUBG Crown 1900 UC Fast',
      'Pubg Diamond 1500 UC Best Price',
    ]

    for (let i = 0; i < pubgTitles.length; i++) {
      const seller = sellers[(i + 2) % sellers.length]
      const rank = ['Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'][Math.floor(Math.random() * 6)]
      const level = 30 + Math.floor(Math.random() * 27)
      const price = 70 + Math.floor(Math.random() * 80)

      await prisma.listings.create({
        data: {
          sellerId: seller.id,
          categoryId: gamingAccounts.id,
          subcategoryId: pubgSubcat?.id,
          title: pubgTitles[i],
          description: `PUBG Mobile account at ${rank} tier. Level ${level}. High-tier account. Season-ready. Verified & safe. Instant delivery. Best price guaranteed. 100% buyer protection.`,
          gameName: 'PUBG Mobile',
          price: new Decimal(price),
          currency: 'USD',
          rank,
          level,
          loginMethod: 'Email Transfer',
          platform: 'Android/iOS',
          region: 'Global',
          status: ListingStatus.ACTIVE,
          images: [IMG.pubg],
          isFeatured: Math.random() > 0.3,
          viewCount: Math.floor(Math.random() * 500 + 50),
          salesCount: Math.floor(Math.random() * 20),
        },
      })
    }

    // CODM Listings (18)
    const codmTitles = [
      'CODM Master Rank 50 Level Premium',
      'Call of Duty Mobile Legend 45 Level',
      'CODM Elite Pro 40 Level 25 Weapons',
      'Call of Duty Master 48 Level Elite',
      'CODM Legendary 46 Level Loaded',
      'Call of Duty Pro 38 Level Fast Deal',
      'CODM Veteran 35 Level Budget Friendly',
      'Call of Duty Master 49 Level Amazing',
      'CODM Legend 44 Level Best Value',
      'Call of Duty Elite 42 Level Rare',
      'CODM Master 51 Level Top Tier',
      'Call of Duty Pro 39 Level Clean',
      'CODM Legend 47 Level Premium Pack',
      'Call of Duty Veteran 36 Level Safe',
      'CODM Elite Pro 41 Level Quality',
      'Call of Duty Master 52 Level Supreme',
      'CODM Legend 43 Level Good Deal',
      'Call of Duty Elite 44 Level Premium',
    ]

    for (let i = 0; i < codmTitles.length; i++) {
      const seller = sellers[(i + 4) % sellers.length]
      const rank = ['Veteran', 'Elite', 'Pro', 'Master', 'Legend'][Math.floor(Math.random() * 5)]
      const level = 35 + Math.floor(Math.random() * 22)
      const price = 65 + Math.floor(Math.random() * 60)

      await prisma.listings.create({
        data: {
          sellerId: seller.id,
          categoryId: gamingAccounts.id,
          subcategoryId: codmSubcat?.id,
          title: codmTitles[i],
          description: `CODM account at ${rank} tier. Level ${level}. Ranked-ready. Weapons unlocked. Safe & secure. Fast delivery. Professional seller. 100% authentic. Money-back guarantee.`,
          gameName: 'CODM',
          price: new Decimal(price),
          currency: 'USD',
          rank,
          level,
          loginMethod: 'Email Transfer',
          platform: 'Android/iOS',
          region: 'Global',
          status: ListingStatus.ACTIVE,
          images: [IMG.codm],
          isFeatured: Math.random() > 0.3,
          viewCount: Math.floor(Math.random() * 500 + 50),
          salesCount: Math.floor(Math.random() * 20),
        },
      })
    }

    // Bloodstrike Listings (18)
    const bsTitles = [
      'Bloodstrike Diamond Tier 42 Skins',
      'BS Platinum Rank 38 Level 15 Weapons',
      'Bloodstrike Elite Tier 45 Level Premium',
      'BS Diamond 40 Level Epic Collection',
      'Bloodstrike Platinum 35 Level 12 Skins',
      'BS Elite 44 Level Legendary Weapons',
      'Bloodstrike Gold Tier 30 Level Fast',
      'BS Diamond 41 Level Amazing Skins',
      'Bloodstrike Master Elite 46 Level',
      'BS Platinum 36 Level Clean Account',
      'Bloodstrike Diamond 39 18 Skins Quick',
      'BS Elite 43 Level Rare Weapon Set',
      'Bloodstrike Gold 31 Level Budget Deal',
      'BS Platinum 37 Level 14 Cool Skins',
      'Bloodstrike Diamond 43 Level Premium',
      'BS Elite Master 47 Level Max Value',
      'Bloodstrike Platinum 38 Level Quick Sale',
      'BS Diamond 44 Level Best Deals',
    ]

    for (let i = 0; i < bsTitles.length; i++) {
      const seller = sellers[(i + 6) % sellers.length]
      const rank = ['Gold', 'Platinum', 'Diamond', 'Elite'][Math.floor(Math.random() * 4)]
      const level = 30 + Math.floor(Math.random() * 20)
      const price = 60 + Math.floor(Math.random() * 65)

      await prisma.listings.create({
        data: {
          sellerId: seller.id,
          categoryId: gamingAccounts.id,
          subcategoryId: bsSubcat?.id,
          title: bsTitles[i],
          description: `Bloodstrike account at ${rank} tier. Level ${level}. Action-packed gameplay. Safe delivery. Verified seller. 100% secure transaction. Fast & reliable. Best marketplace price.`,
          gameName: 'Bloodstrike',
          price: new Decimal(price),
          currency: 'USD',
          rank,
          level,
          loginMethod: 'Email Transfer',
          platform: 'Android/iOS',
          region: 'Global',
          status: ListingStatus.ACTIVE,
          images: [IMG.bloodstrike],
          isFeatured: Math.random() > 0.3,
          viewCount: Math.floor(Math.random() * 500 + 50),
          salesCount: Math.floor(Math.random() * 20),
        },
      })
    }

    console.log(`✅ 74 listings created (20 FF + 18 PUBG + 18 CODM + 18 BS)\n`)

    // 6. Create Gigs
    console.log('🎮 Creating gigs...')
    const gigs = [
      { title: 'Free Fire Rank Boost Bronze to Heroic', game: 'Free Fire', rankFrom: 'Bronze', rankTo: 'Heroic', price: 50 },
      { title: 'PUBG Mobile Boost Bronze to Conqueror', game: 'PUBG Mobile', rankFrom: 'Bronze', rankTo: 'Conqueror', price: 90 },
      { title: 'Bloodstrike Rank Push Gold to Elite', game: 'Bloodstrike', rankFrom: 'Gold', rankTo: 'Elite', price: 75 },
      { title: 'CODM Ranked Boost Rookie to Master', game: 'CODM', rankFrom: 'Rookie', rankTo: 'Master', price: 85 },
      { title: 'Free Fire Fast Rank Push Diamond to Mythic', game: 'Free Fire', rankFrom: 'Diamond', rankTo: 'Mythic', price: 60 },
      { title: 'PUBG Crown Tier Boost Service', game: 'PUBG Mobile', rankFrom: 'Diamond', rankTo: 'Crown', price: 100 },
      { title: 'Bloodstrike Elite Pro Boost Fast', game: 'Bloodstrike', rankFrom: 'Diamond', rankTo: 'Elite', price: 80 },
      { title: 'CODM Master Rank Guarantee Service', game: 'CODM', rankFrom: 'Elite', rankTo: 'Master', price: 95 },
    ]

    for (let i = 0; i < gigs.length; i++) {
      const seller = sellers[i % sellers.length]
      await prisma.gigs.create({
        data: {
          sellerId: seller.id,
          title: gigs[i].title,
          description: `Professional ${gigs[i].game} rank boosting. Safe and fast delivery from ${gigs[i].rankFrom} to ${gigs[i].rankTo}. 100% account security guaranteed. Verified booster with 1000+ successful boosts.`,
          gameName: gigs[i].game,
          rankFrom: gigs[i].rankFrom,
          rankTo: gigs[i].rankTo,
          platform: 'Android/iOS',
          region: 'Global',
          price: new Decimal(gigs[i].price),
          currency: 'USD',
          deliveryTime: 7 * 24 * 60,
          status: GigStatus.ACTIVE,
          isActive: true,
        },
      })
    }
    console.log(`✅ ${gigs.length} gigs created\n`)

    // 7. Create Game Slides
    console.log('🖼️  Creating game slides...')
    const slides = [
      { title: 'Free Fire', subtitle: 'Level Up Your Game Now', img: IMG.freeFire, order: 1 },
      { title: 'Bloodstrike', subtitle: 'Action Packed Gaming', img: IMG.bloodstrike, order: 2 },
      { title: 'CODM', subtitle: 'Rank Boost Services', img: IMG.codm, order: 3 },
      { title: 'PUBG Mobile', subtitle: 'Become A Conqueror', img: IMG.pubg, order: 4 },
      { title: 'Mobile Legends', subtitle: 'Mythic Rank Accounts', img: IMG.ml, order: 5 },
      { title: 'Valorant', subtitle: 'Diamond+ Accounts', img: IMG.valorant, order: 6 },
    ]

    for (const slide of slides) {
      await prisma.gameSlides.create({
        data: {
          title: slide.title,
          subtitle: slide.subtitle,
          imageUrl: slide.img,
          isActive: true,
          sortOrder: slide.order,
        },
      })
    }
    console.log(`✅ ${slides.length} game slides created\n`)

    // 8. Create Marquee Items
    console.log('📢 Creating marquee items...')
    const marquees = [
      '🎮 Welcome to Velxo — Africa\'s Premier Gaming Marketplace',
      '✨ 100% Secure Escrow Protection on All Sales',
      '⚡ Instant Delivery on Digital Products',
      '🏆 Verified Sellers with Maximum Buyer Protection',
      '💎 70+ Premium Gaming Accounts Available Now',
      '🔥 Rank Boosting Services with Guaranteed Success',
      '🌍 Serving 50,000+ Gamers Across Africa',
    ]

    for (let i = 0; i < marquees.length; i++) {
      await prisma.marqueeItems.create({
        data: {
          text: marquees[i],
          color: 'brand',
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${marquees.length} marquee items created\n`)

    // 9. Create Blog Posts
    console.log('📰 Creating blog posts...')
    const blogs = [
      {
        title: 'How to Stay Safe When Buying Gaming Accounts Online',
        slug: 'stay-safe-buying-accounts',
        excerpt: 'Learn best practices to protect yourself from scams.',
        content: 'Use escrow protection. Verify seller reputation. Check account status. Never share passwords. Use secure platforms only.',
        category: 'Safety',
        isFeatured: true,
      },
      {
        title: 'Top Gaming Trends Taking Over Africa in 2024-2025',
        slug: 'gaming-trends-africa',
        excerpt: 'Mobile gaming dominance, cloud gaming, esports growth.',
        content: 'Mobile gaming leads the market. Cloud gaming expands. Esports tournaments grow. Play-to-earn models emerge. Cross-platform gaming increases.',
        category: 'Trends',
        isFeatured: false,
      },
      {
        title: 'Success Story: How NoobMaster92 Built a Gaming Empire',
        slug: 'noobmaster92-success-story',
        excerpt: 'From casual gamer to 500+ successful sales.',
        content: 'Started as casual player. Now runs top store. Secret: consistency, communication, quality. 1000+ happy customers.',
        category: 'Success Stories',
        isFeatured: true,
      },
    ]

    for (const blog of blogs) {
      await prisma.blogPosts.create({
        data: {
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          category: blog.category,
          author: 'Velxo Team',
          isPublished: true,
          isFeatured: blog.isFeatured,
          publishedAt: new Date(),
        },
      })
    }
    console.log(`✅ ${blogs.length} blog posts created\n`)

    // 10. Create Reward Catalog
    console.log('🎁 Creating reward catalog...')
    const rewards = [
      { name: '$5 Free Fire Gift', type: 'GIFT_CARD', cost: 250, desc: '200 Free Fire Diamonds', img: IMG.freeFire },
      { name: '$10 PUBG UC Bundle', type: 'GIFT_CARD', cost: 500, desc: '600 UC Instant', img: IMG.pubg },
      { name: 'Mobile Legends 206 Diamonds', type: 'TOP_UP', cost: 300, desc: 'Instant delivery', img: IMG.ml },
      { name: '$25 Steam Wallet', type: 'GIFT_CARD', cost: 1200, desc: 'Any Steam game', img: IMG.valorant },
      { name: 'PlayStation $20 Card', type: 'GIFT_CARD', cost: 1000, desc: 'PSN credit', img: IMG.codm },
      { name: 'CODM 8000 CP Bundle', type: 'TOP_UP', cost: 400, desc: 'Premium bundle', img: IMG.codm },
    ]

    for (let i = 0; i < rewards.length; i++) {
      await prisma.rewardCatalog.create({
        data: {
          name: rewards[i].name,
          description: rewards[i].desc,
          type: rewards[i].type,
          coinCost: rewards[i].cost,
          imageUrl: rewards[i].img,
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${rewards.length} reward items created\n`)

    // Final Summary
    console.log('\n' + '='.repeat(80))
    console.log('✨ VELXO GAMING MARKETPLACE SEEDING COMPLETE! ✨')
    console.log('='.repeat(80))
    console.log('\n📊 DATABASE SUMMARY:')
    console.log('  • Admin Users: 1')
    console.log('  • Sellers: 11 (with gamer-type names)')
    console.log('  • Buyers: 16 (from African countries)')
    console.log('  • Listings: 74 (20 FF + 18 BS + 18 CODM + 18 PUBG)')
    console.log('  • Gigs: 8 (rank boosting services)')
    console.log('  • Game Slides: 6')
    console.log('  • Marquee Items: 7')
    console.log('  • Blog Posts: 3')
    console.log('  • Reward Items: 6')
    console.log('  • Categories: 5')
    console.log('  • Subcategories: 44')
    console.log('  • Total Records: 200+')
    console.log('\n🎮 GAMES COVERED:')
    console.log('  • Free Fire (20 listings)')
    console.log('  • Bloodstrike (18 listings)')
    console.log('  • CODM (18 listings)')
    console.log('  • PUBG Mobile (18 listings)')
    console.log('\n👥 SELLER ACCOUNTS (Gamer Type Names):')
    for (let i = 0; i < Math.min(5, sellers.length); i++) {
      console.log(`  ${i + 1}. ${sellersData[i].name} (${sellersData[i].email})`)
    }
    console.log(`  ... and ${sellers.length - 5} more sellers`)
    console.log('\n🎯 TEST ACCOUNTS:')
    console.log('  Admin: admin@velxo.shop')
    console.log('  Sellers: noobmaster92@, shadowhunter88@, phoenixgamer23@velxo.shop')
    console.log('  Buyers: chidi.okafor@, fatou.ndiaye@, yusuf.mohammed@gmail.com')
    console.log('\n✅ Marketplace ready for testing and production!\n')
  } catch (error) {
    console.error('❌ Seed Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
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
