#!/usr/bin/env node
/**
 * Clean Script — Remove all seeded data from database
 * Keeps schema intact, only deletes records
 */
import { PrismaClient } from '@prisma/client'

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n')

    // Delete in order of dependencies (reverse of creation)
    console.log('🗑️  Deleting reward redemptions...')
    await prisma.rewardRedemptions.deleteMany({})

    console.log('🗑️  Deleting reward coin transactions...')
    await prisma.rewardCoinTransactions.deleteMany({})

    console.log('🗑️  Deleting affiliate referrals...')
    await prisma.affiliateReferrals.deleteMany({})

    console.log('🗑️  Deleting blog posts...')
    await prisma.blogPosts.deleteMany({})

    console.log('🗑️  Deleting game slides...')
    await prisma.gameSlides.deleteMany({})

    console.log('🗑️  Deleting commissions...')
    await prisma.commissions.deleteMany({})

    console.log('🗑️  Deleting withdrawal requests...')
    await prisma.withdrawalRequests.deleteMany({})

    console.log('🗑️  Deleting payments...')
    await prisma.payments.deleteMany({})

    console.log('🗑️  Deleting payment methods...')
    await prisma.paymentMethods.deleteMany({})

    console.log('🗑️  Deleting fraud flags...')
    await prisma.fraudFlags.deleteMany({})

    console.log('🗑️  Deleting admin audit logs...')
    await prisma.adminAuditLogs.deleteMany({})

    console.log('🗑️  Deleting support tickets...')
    await prisma.supportTickets.deleteMany({})

    console.log('🗑️  Deleting dispute messages...')
    await prisma.disputeMessages.deleteMany({})

    console.log('🗑️  Deleting disputes...')
    await prisma.disputes.deleteMany({})

    console.log('🗑️  Deleting notifications...')
    await prisma.notifications.deleteMany({})

    console.log('🗑️  Deleting messages...')
    await prisma.messages.deleteMany({})

    console.log('🗑️  Deleting conversations...')
    await prisma.conversations.deleteMany({})

    console.log('🗑️  Deleting reviews...')
    await prisma.reviews.deleteMany({})

    console.log('🗑️  Deleting wallet transactions...')
    await prisma.walletTransactions.deleteMany({})

    console.log('🗑️  Deleting wallets...')
    await prisma.wallet.deleteMany({})

    console.log('🗑️  Deleting velxo coins...')
    await prisma.velxoCoins.deleteMany({})

    console.log('🗑️  Deleting escrow transactions...')
    await prisma.escrowTransactions.deleteMany({})

    console.log('🗑️  Deleting order items...')
    await prisma.orderItems.deleteMany({})

    console.log('🗑️  Deleting orders...')
    await prisma.orders.deleteMany({})

    console.log('🗑️  Deleting gigs...')
    await prisma.gigs.deleteMany({})

    console.log('🗑️  Deleting topup products...')
    await prisma.topupProducts.deleteMany({})

    console.log('🗑️  Deleting marquee items...')
    await prisma.marqueeItems.deleteMany({})

    console.log('🗑️  Deleting listings...')
    await prisma.listings.deleteMany({})

    console.log('🗑️  Deleting seller subscriptions...')
    await prisma.sellerSubscriptions.deleteMany({})

    console.log('🗑️  Deleting sellers...')
    await prisma.sellers.deleteMany({})

    console.log('🗑️  Deleting subcategories...')
    await prisma.subcategories.deleteMany({})

    console.log('🗑️  Deleting categories...')
    await prisma.categories.deleteMany({})

    console.log('🗑️  Deleting users...')
    await prisma.users.deleteMany({})

    console.log('🗑️  Deleting reward catalog...')
    await prisma.rewardCatalog.deleteMany({})

    console.log('\n' + '='.repeat(60))
    console.log('✅ DATABASE CLEANUP COMPLETE!')
    console.log('='.repeat(60))
    console.log('\n🧼 All records deleted. Schema preserved.')
    console.log('Ready to run fresh seed!\n')
  } catch (error) {
    console.error('❌ Cleanup Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
