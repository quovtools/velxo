#!/usr/bin/env node
/**
 * Velxo Gaming Marketplace — Database Seed
 * Creates: users (sellers + buyers), sellers, listings, gigs, wallets, categories, etc.
 */
import { PrismaClient, Role, SellerAccountType, ListingStatus, GigStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

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
        role: Role.SUPER_ADMIN,
        isActive: true,
        emailVerified: true,
      },
    })
    console.log(`✅ Admin created: ${admin.email}\n`)

    // 2. Create Categories & Subcategories
    console.log('📂 Creating categories...')
    const categoriesData = [
      {
        name: 'Gaming Accounts',
        slug: 'gaming-accounts',
        description: 'Buy verified gaming accounts',
        icon: 'Gamepad2',
      },
      {
        name: 'In-Game Currency',
        slug: 'gaming-coins',
        description: 'Purchase in-game currencies',
        icon: 'Coins',
      },
      {
        name: 'Game Top-Ups',
        slug: 'top-ups',
        description: 'Instant top-ups to your account',
        icon: 'Zap',
      },
      {
        name: 'Gift Cards',
        slug: 'gift-cards',
        description: 'Digital gift cards',
        icon: 'Gift',
      },
      {
        name: 'Gaming Services',
        slug: 'services',
        description: 'Professional gaming services',
        icon: 'Trophy',
      },
    ]

    const categories = []
    for (const catData of categoriesData) {
      const cat = await prisma.categories.upsert({
        where: { slug: catData.slug },
        update: {},
        create: catData,
      })
      categories.push(cat)
    }
    console.log(`✅ ${categories.length} categories created\n`)

    // 3. Create Sellers with Wallets
    console.log('🏪 Creating sellers...')
    const sellersData = [
      {
        email: 'kwame.gaming@velxo.shop',
        firstName: 'Kwame',
        lastName: 'Asante',
        storeName: 'Kwame Gaming Store',
        storeDescription: 'Premium Free Fire & PUBG accounts. Trusted since 2021. Fast delivery!',
        reputationScore: 4.8,
        totalSales: 234,
        averageRating: 4.7,
        subscriptionTier: 'PRO',
      },
      {
        email: 'zainab.plays@velxo.shop',
        firstName: 'Zainab',
        lastName: 'Okonkwo',
        storeName: 'Zainab Pro Gaming',
        storeDescription: 'Mobile Legends and COD Mobile specialist. Instant delivery!',
        reputationScore: 4.5,
        totalSales: 89,
        averageRating: 4.4,
        subscriptionTier: 'FREE',
      },
      {
        email: 'david.booster@velxo.shop',
        firstName: 'David',
        lastName: 'Ochieng',
        storeName: 'Elite Boost Services',
        storeDescription: 'Professional rank boosting for Valorant and League of Legends.',
        reputationScore: 4.9,
        totalSales: 412,
        averageRating: 4.8,
        subscriptionTier: 'PREMIUM',
      },
      {
        email: 'amina.games@velxo.shop',
        firstName: 'Amina',
        lastName: 'Hassan',
        storeName: 'Amina GameVault',
        storeDescription: 'Genshin Impact, Fortnite, and Roblox accounts with 24/7 support.',
        reputationScore: 4.6,
        totalSales: 156,
        averageRating: 4.5,
        subscriptionTier: 'PRO',
      },
      {
        email: 'thabo.gamer@velxo.shop',
        firstName: 'Thabo',
        lastName: 'Molefe',
        storeName: 'Thabo Gaming Hub',
        storeDescription: 'EA FC coins and Clash accounts. Quick delivery, competitive prices.',
        reputationScore: 4.4,
        totalSales: 67,
        averageRating: 4.3,
        subscriptionTier: 'FREE',
      },
    ]

    const sellers = []
    for (const sellerData of sellersData) {
      // Create user
      const user = await prisma.users.upsert({
        where: { email: sellerData.email },
        update: {},
        create: {
          email: sellerData.email,
          firstName: sellerData.firstName,
          lastName: sellerData.lastName,
          role: Role.SELLER,
          emailVerified: true,
          isActive: true,
        },
      })

      // Create seller profile
      const seller = await prisma.sellers.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          storeName: sellerData.storeName,
          storeDescription: sellerData.storeDescription,
          storeSlug: sellerData.storeName.toLowerCase().replace(/\s+/g, '-'),
          accountType: SellerAccountType.STANDARD,
          isVerified: true,
          verifiedAt: new Date(),
          kycStatus: 'APPROVED',
          reputationScore: sellerData.reputationScore,
          totalSales: sellerData.totalSales,
          totalRevenue: new Decimal(sellerData.totalSales * 50),
          averageRating: sellerData.averageRating,
          responseRate: 98,
          subscriptionTier: sellerData.subscriptionTier,
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      // Create wallet
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: new Decimal(Math.random() * 5000 + 1000),
          totalEarnings: new Decimal(sellerData.totalSales * 45),
          currency: 'USD',
        },
      })

      // Create velxoCoins
      await prisma.velxoCoins.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: Math.floor(Math.random() * 5000 + 1000),
        },
      })

      sellers.push(seller)
      console.log(`  ✓ ${sellerData.storeName}`)
    }
    console.log(`✅ ${sellers.length} sellers created\n`)

    // 4. Create Buyers
    console.log('👥 Creating buyers...')
    const buyersData = [
      { email: 'chidi.okafor@gmail.com', firstName: 'Chidi', lastName: 'Okafor' },
      { email: 'fatou.ndiaye@gmail.com', firstName: 'Fatou', lastName: 'Ndiaye' },
      { email: 'yusuf.mohammed@gmail.com', firstName: 'Yusuf', lastName: 'Mohammed' },
      { email: 'nairobi.gamer@gmail.com', firstName: 'Brian', lastName: 'Kipchoge' },
      { email: 'grace.mwanza@gmail.com', firstName: 'Grace', lastName: 'Mwanza' },
      { email: 'kofi.mensah@gmail.com', firstName: 'Kofi', lastName: 'Mensah' },
      { email: 'amina.diop@gmail.com', firstName: 'Amina', lastName: 'Diop' },
    ]

    for (const buyerData of buyersData) {
      const user = await prisma.users.upsert({
        where: { email: buyerData.email },
        update: {},
        create: {
          email: buyerData.email,
          firstName: buyerData.firstName,
          lastName: buyerData.lastName,
          role: Role.BUYER,
          emailVerified: true,
          isActive: true,
        },
      })

      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: new Decimal(Math.random() * 2000),
          currency: 'USD',
        },
      })

      await prisma.velxoCoins.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: Math.floor(Math.random() * 2000),
        },
      })

      console.log(`  ✓ ${buyerData.firstName} ${buyerData.lastName}`)
    }
    console.log(`✅ ${buyersData.length} buyers created\n`)

    // 5. Create Listings
    console.log('📋 Creating listings...')
    const gamingAccountsCategory = categories[0] // Gaming Accounts

    const listingsData = [
      {
        title: 'Free Fire Account - Level 45, Heroic, 18 Skins',
        description: 'Premium Free Fire account with 18 legendary skins. 2500 Diamonds, 45K Gold. All characters unlocked. Fast delivery!',
        gameName: 'Free Fire',
        price: new Decimal(85),
        rank: 'Heroic',
        level: 45,
        loginMethod: 'Email Transfer',
        platform: 'Android/iOS',
        region: 'Global',
      },
      {
        title: 'PUBG Mobile - Conqueror Rank, 150 UC',
        description: 'High-tier PUBG account at Conqueror rank. 150 UC balance, 50+ cosmetics. Clean account with no bans. Instant delivery.',
        gameName: 'PUBG Mobile',
        price: new Decimal(120),
        rank: 'Conqueror',
        level: 48,
        loginMethod: 'Email Transfer',
        platform: 'Android/iOS',
        region: 'Global',
      },
      {
        title: 'Mobile Legends - Mythic 2, 45 Skins',
        description: 'Competitive MLBB account at Mythic 2 with 25 heroes unlocked and 45 skins. Ready for ranked push. Fast support!',
        gameName: 'Mobile Legends',
        price: new Decimal(95),
        rank: 'Mythic 2',
        level: 80,
        loginMethod: 'Moonton ID Transfer',
        platform: 'Android/iOS',
        region: 'Global',
      },
      {
        title: 'Valorant - Diamond 2, 85+ Skins',
        description: 'Competitive Valorant account with Diamond 2 rank. All 24 agents unlocked. 85+ skin collection including rare variants.',
        gameName: 'Valorant',
        price: new Decimal(150),
        rank: 'Diamond 2',
        level: 95,
        loginMethod: 'Riot ID Transfer',
        platform: 'PC',
        region: 'EU',
      },
      {
        title: 'Genshin Impact - AR 58, 72 Characters',
        description: 'Late-game Genshin account with Adventure Rank 58. 72 characters including all limited 5-stars. Floor 12 Abyss ready!',
        gameName: 'Genshin Impact',
        price: new Decimal(280),
        level: 58,
        loginMethod: 'HoYoverse Account Transfer',
        platform: 'PC/Mobile',
        region: 'Asia',
      },
    ]

    let listingIndex = 0
    for (const seller of sellers) {
      for (let i = 0; i < 2; i++) {
        if (listingIndex >= listingsData.length) break

        const listingData = listingsData[listingIndex]

        await prisma.listings.create({
          data: {
            sellerId: seller.id,
            categoryId: gamingAccountsCategory.id,
            title: listingData.title,
            description: listingData.description,
            gameName: listingData.gameName,
            price: listingData.price,
            currency: 'USD',
            rank: listingData.rank,
            level: listingData.level,
            loginMethod: listingData.loginMethod,
            platform: listingData.platform,
            region: listingData.region,
            status: ListingStatus.ACTIVE,
            images: ['https://velxo.shop/images/games/placeholder.jpg'],
            isFeatured: Math.random() > 0.5,
            viewCount: Math.floor(Math.random() * 500 + 50),
            salesCount: Math.floor(Math.random() * 20),
          },
        })

        listingIndex++
      }
    }
    console.log(`✅ ${listingIndex} listings created\n`)

    // 6. Create Gigs
    console.log('🎮 Creating gigs...')
    const gigsData = [
      {
        title: 'Mobile Legends Rank Boost - Warrior to Epic',
        description: 'Professional MLBB rank boosting. I will boost your account safely with 100% account security guaranteed.',
        gameName: 'Mobile Legends',
        rankFrom: 'Warrior',
        rankTo: 'Epic',
        platform: 'Android/iOS',
        region: 'SEA',
        price: new Decimal(45),
      },
      {
        title: 'Free Fire Rank Push - Bronze to Heroic',
        description: 'Fast Free Fire ranking service. Safe methods only, no hacks. Your account stays confidential.',
        gameName: 'Free Fire',
        rankFrom: 'Bronze',
        rankTo: 'Heroic',
        platform: 'Android/iOS',
        region: 'Global',
        price: new Decimal(50),
      },
      {
        title: 'Valorant Elo Boost - Iron to Diamond',
        description: 'Professional Valorant boosting by Immortal player. Duo or solo queue options available.',
        gameName: 'Valorant',
        rankFrom: 'Iron',
        rankTo: 'Diamond',
        platform: 'PC',
        region: 'EU',
        price: new Decimal(120),
      },
      {
        title: 'PUBG Mobile Tier Boost - Bronze to Conqueror',
        description: 'Professional PUBG boosting service. Our team has 3+ years experience. FPP and TPP available.',
        gameName: 'PUBG Mobile',
        rankFrom: 'Bronze',
        rankTo: 'Conqueror',
        platform: 'Android/iOS',
        region: 'Global',
        price: new Decimal(90),
      },
    ]

    let gigIndex = 0
    for (const seller of sellers) {
      const gigsPerSeller = Math.min(3, gigsData.length - gigIndex)
      for (let i = 0; i < gigsPerSeller; i++) {
        if (gigIndex >= gigsData.length) break

        const gigData = gigsData[gigIndex]
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
            price: gigData.price,
            currency: 'USD',
            deliveryTime: 7 * 24 * 60,
            status: GigStatus.ACTIVE,
            isActive: true,
          },
        })

        gigIndex++
      }
    }
    console.log(`✅ ${gigIndex} gigs created\n`)

    // 7. Create Game Slides
    console.log('🖼️  Creating game slides...')
    const slides = [
      { title: 'Free Fire', subtitle: 'Get Diamonds & Accounts Instantly', imageUrl: 'https://velxo.shop/images/games/free-fire.jpg' },
      { title: 'PUBG Mobile', subtitle: 'Buy UC & Rank Boost Services', imageUrl: 'https://velxo.shop/images/games/pubg-mobile.jpg' },
      { title: 'Mobile Legends', subtitle: 'Diamonds, Accounts & Boosting', imageUrl: 'https://velxo.shop/images/games/mobile-legends.jpg' },
      { title: 'Valorant', subtitle: 'Rank Boost by Pro Players', imageUrl: 'https://velxo.shop/images/games/valorant.jpg' },
      { title: 'Genshin Impact', subtitle: 'Premium Accounts & Top-Ups', imageUrl: 'https://velxo.shop/images/games/genshin-impact.jpg' },
    ]

    for (let i = 0; i < slides.length; i++) {
      await prisma.gameSlides.create({
        data: {
          title: slides[i].title,
          subtitle: slides[i].subtitle,
          imageUrl: slides[i].imageUrl,
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${slides.length} game slides created\n`)

    // 8. Create Marquee Items
    console.log('📢 Creating marquee items...')
    const marquees = [
      '🎮 Welcome to Velxo — Africa\'s #1 Gaming Marketplace',
      '✨ Secure Escrow Protection on All Transactions',
      '⚡ Instant Delivery on Digital Products',
      '🏆 Verified Sellers with 100% Buyer Protection',
      '💎 Gaming Accounts, Coins, Top-Ups & More',
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
        excerpt: 'Learn best practices to protect yourself from scams and fraud.',
        content: 'Use escrow protection, verify seller reputation, and check account verification before purchasing.',
        category: 'Safety',
        isPublished: true,
        isFeatured: true,
      },
      {
        title: 'Top 5 Gaming Trends to Watch in 2025',
        slug: 'gaming-trends-2025',
        excerpt: 'Explore the hottest gaming trends taking over Africa.',
        content: 'Mobile gaming dominance, cloud gaming expansion, cross-platform play, esports growth, and play-to-earn evolution.',
        category: 'Trends',
        isPublished: true,
        isFeatured: false,
      },
      {
        title: 'Velxo Seller Success Story: Kwame Gaming Store',
        slug: 'seller-success-kwame-gaming',
        excerpt: 'Read how Kwame turned his gaming passion into a thriving business.',
        content: 'From 5 accounts to 234 successful sales. Key to success: consistency, communication, quality, and reputation.',
        category: 'Success Stories',
        isPublished: true,
        isFeatured: true,
      },
    ]

    for (const blog of blogs) {
      await prisma.blogPosts.upsert({
        where: { slug: blog.slug },
        update: {},
        create: {
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          category: blog.category,
          author: 'Velxo Team',
          isPublished: blog.isPublished,
          isFeatured: blog.isFeatured,
          publishedAt: blog.isPublished ? new Date() : null,
        },
      })
    }
    console.log(`✅ ${blogs.length} blog posts created\n`)

    // 10. Create Reward Catalog
    console.log('🎁 Creating reward catalog...')
    const rewards = [
      { name: '$5 Free Fire Gift Card', type: 'GIFT_CARD', coinCost: 250, description: 'Get 200 Free Fire Diamonds' },
      { name: '$10 PUBG UC Bundle', type: 'GIFT_CARD', coinCost: 500, description: 'Get 600 UC for PUBG Mobile' },
      { name: 'Mobile Legends 206 Diamonds', type: 'TOP_UP', coinCost: 300, description: 'Instant MLBB diamonds' },
      { name: '$25 Steam Wallet', type: 'GIFT_CARD', coinCost: 1200, description: 'Use on any Steam game' },
      { name: 'PlayStation $20 Card', type: 'GIFT_CARD', coinCost: 1000, description: 'PSN credit for games' },
      { name: 'Genshin 300 Primogems', type: 'TOP_UP', coinCost: 400, description: 'Premium currency top-up' },
    ]

    for (let i = 0; i < rewards.length; i++) {
      await prisma.rewardCatalog.create({
        data: {
          name: rewards[i].name,
          description: rewards[i].description,
          type: rewards[i].type,
          coinCost: rewards[i].coinCost,
          isActive: true,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ ${rewards.length} reward items created\n`)

    // Final Summary
    console.log('\n' + '='.repeat(70))
    console.log('✨ VELXO DATABASE SEEDING COMPLETE! ✨')
    console.log('='.repeat(70))
    console.log('\n📊 Summary:')
    console.log(`  • Admin Users: 1`)
    console.log(`  • Sellers: ${sellers.length}`)
    console.log(`  • Buyers: ${buyersData.length}`)
    console.log(`  • Listings: ${listingIndex}`)
    console.log(`  • Gigs: ${gigIndex}`)
    console.log(`  • Game Slides: ${slides.length}`)
    console.log(`  • Marquee Items: ${marquees.length}`)
    console.log(`  • Blog Posts: ${blogs.length}`)
    console.log(`  • Reward Items: ${rewards.length}`)
    console.log(`  • Categories: ${categories.length}`)
    console.log('\n🔗 Test Accounts:')
    console.log(`  Admin: admin@velxo.shop`)
    console.log(`  Sellers: kwame.gaming@, zainab.plays@, david.booster@, amina.games@, thabo.gamer@velxo.shop`)
    console.log(`  Buyers: chidi.okafor@, fatou.ndiaye@, yusuf.mohammed@, nairobi.gamer@, grace.mwanza@, kofi.mensah@, amina.diop@gmail.com`)
    console.log('\n✅ Your marketplace is ready!\n')
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
