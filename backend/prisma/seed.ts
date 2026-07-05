#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  const admin = await prisma.users.upsert({ where: { email: 'admin@velxo.shop' }, update: {}, create: { email: 'admin@velxo.shop', role: 'SUPER_ADMIN', isActive: true, emailVerified: true } })
  console.log('Created admin:', admin.email)
  await prisma.categories.createMany({ data: [{ name: 'Gaming Accounts', slug: 'gaming-accounts' }, { name: 'Gaming Coins', slug: 'gaming-coins' }, { name: 'Top-Ups', slug: 'top-ups' }, { name: 'Gift Cards', slug: 'gift-cards' }, { name: 'Services', slug: 'services' }], skipDuplicates: true })
  console.log('Seed complete')
}
main().finally(async () => { await prisma.$disconnect() })
