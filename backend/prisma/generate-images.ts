#!/usr/bin/env node
/**
 * Generate placeholder images for seed data using Placeholder.com
 * This creates URLs for game covers, product images, and design elements
 */

export const generateImageUrls = () => {
  // Game covers (600x400)
  const gameCovers = {
    freeFire: 'https://via.placeholder.com/600x400/FF6B35/FFFFFF?text=Free+Fire',
    pubgMobile: 'https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=PUBG+Mobile',
    mobileLegends: 'https://via.placeholder.com/600x400/7B2CBF/FFFFFF?text=Mobile+Legends',
    valorant: 'https://via.placeholder.com/600x400/FF4655/FFFFFF?text=Valorant',
    genshinImpact: 'https://via.placeholder.com/600x400/FFB84D/FFFFFF?text=Genshin+Impact',
    lol: 'https://via.placeholder.com/600x400/0A66C2/FFFFFF?text=League+of+Legends',
    codMobile: 'https://via.placeholder.com/600x400/1A1A1A/FFFFFF?text=COD+Mobile',
    fortnite: 'https://via.placeholder.com/600x400/2E5090/FFFFFF?text=Fortnite',
  }

  // Product/Listing images (400x300)
  const productImages = [
    'https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=Gaming+Account+1',
    'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Gaming+Account+2',
    'https://via.placeholder.com/400x300/7B2CBF/FFFFFF?text=Gaming+Account+3',
    'https://via.placeholder.com/400x300/FF4655/FFFFFF?text=Gaming+Account+4',
    'https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Gaming+Account+5',
  ]

  // Seller avatars (200x200)
  const sellerAvatars = [
    'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=Kwame',
    'https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=Zainab',
    'https://via.placeholder.com/200x200/7B2CBF/FFFFFF?text=David',
    'https://via.placeholder.com/200x200/FF4655/FFFFFF?text=Amina',
    'https://via.placeholder.com/200x200/FFB84D/FFFFFF?text=Thabo',
  ]

  // Homepage slides (1200x400)
  const homeSlides = {
    freeFire: 'https://via.placeholder.com/1200x400/FF6B35/FFFFFF?text=Free+Fire+-+Get+Diamonds+Now',
    pubgMobile: 'https://via.placeholder.com/1200x400/4A90E2/FFFFFF?text=PUBG+Mobile+-+Rank+Boost',
    mobileLegends: 'https://via.placeholder.com/1200x400/7B2CBF/FFFFFF?text=Mobile+Legends+-+Top+Seller',
    valorant: 'https://via.placeholder.com/1200x400/FF4655/FFFFFF?text=Valorant+-+Pro+Boosting',
    genshin: 'https://via.placeholder.com/1200x400/FFB84D/FFFFFF?text=Genshin+-+Premium+Accounts',
    fortnite: 'https://via.placeholder.com/1200x400/2E5090/FFFFFF?text=Fortnite+-+V-Bucks+Ready',
  }

  // Reward/Gift images (300x300)
  const rewardImages = [
    'https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=$5+Gift+Card',
    'https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=$10+Bundle',
    'https://via.placeholder.com/300x300/7B2CBF/FFFFFF?text=Diamonds',
    'https://via.placeholder.com/300x300/FF4655/FFFFFF?text=Steam+Card',
    'https://via.placeholder.com/300x300/FFB84D/FFFFFF?text=PlayStation',
    'https://via.placeholder.com/300x300/2E5090/FFFFFF?text=Primogems',
  ]

  // Blog cover images (800x400)
  const blogCovers = [
    'https://via.placeholder.com/800x400/FF6B35/FFFFFF?text=Stay+Safe+When+Buying+Accounts',
    'https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Gaming+Trends+2025',
    'https://via.placeholder.com/800x400/7B2CBF/FFFFFF?text=Seller+Success+Story',
  ]

  return {
    gameCovers,
    productImages,
    sellerAvatars,
    homeSlides,
    rewardImages,
    blogCovers,
  }
}

export default generateImageUrls
