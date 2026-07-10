#!/usr/bin/env node
/**
 * Generate listing images as PNG using puppeteer
 * Creates unique images for each game listing
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const imagesDir = path.join(__dirname, '../public/images/listings')
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

// Color schemes for each game
const gameColors = {
  'Free Fire': { primary: '#FF6B35', secondary: '#FFB84D', accent: '#FFFFFF' },
  'Bloodstrike': { primary: '#1A1A1A', secondary: '#FF0000', accent: '#FFFFFF' },
  'CODM': { primary: '#000000', secondary: '#FFD700', accent: '#FFFFFF' },
  'PUBG': { primary: '#4A90E2', secondary: '#1A472A', accent: '#FFFFFF' },
}

const ranks = {
  'Free Fire': ['Bronze', 'Silver', 'Gold', 'Diamond', 'Heroic', 'Mythic', 'Legend'],
  'Bloodstrike': ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
  'CODM': ['Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Legendary'],
  'PUBG': ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
}

async function generateListingImage(gameName, rank, price, index) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 400, height: 300 })

    const colors = gameColors[gameName] || gameColors['Free Fire']

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 400px;
            height: 300px;
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            font-family: 'Arial', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            color: ${colors.accent};
            overflow: hidden;
            position: relative;
          }
          
          .background-pattern {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            background-image: 
              repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px);
            top: 0;
            left: 0;
          }

          .content {
            position: relative;
            z-index: 2;
            text-align: center;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
          }

          .game-title {
            font-size: 28px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            margin-top: 20px;
          }

          .rank-badge {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            border: 2px solid ${colors.accent};
          }

          .price-tag {
            font-size: 32px;
            font-weight: bold;
            background: rgba(255,255,255,0.9);
            color: ${colors.primary};
            padding: 10px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
          }

          .listing-number {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="background-pattern"></div>
        <div class="content">
          <div>
            <div class="game-title">${gameName}</div>
            <div class="rank-badge">${rank}</div>
          </div>
          <div>
            <div class="price-tag">$${price}</div>
            <div class="listing-number">Listing #${index}</div>
          </div>
        </div>
      </body>
      </html>
    `

    await page.setContent(html)
    const filename = `${gameName.replace(/\s+/g, '-')}-${rank.replace(/\s+/g, '-')}-${index}.png`
    const filepath = path.join(imagesDir, filename)
    
    await page.screenshot({ path: filepath, type: 'png' })
    await browser.close()
    
    return { filename, filepath }
  } catch (error) {
    console.error(`Error generating image for ${gameName} ${rank}:`, error.message)
    return null
  }
}

async function main() {
  console.log('🎨 Generating listing images...\n')

  const listings = []
  let index = 1

  for (const [gameName, gameRanks] of Object.entries(ranks)) {
    const prices = [45, 65, 85, 105, 125, 145, 165]
    
    for (let i = 0; i < 18; i++) {
      const rank = gameRanks[i % gameRanks.length]
      const price = prices[i % prices.length]
      
      console.log(`Creating: ${gameName} - ${rank} ($${price}) - Image #${index}`)
      
      const result = await generateListingImage(gameName, rank, price, index)
      if (result) {
        listings.push({
          game: gameName,
          rank,
          price,
          image: `/images/listings/${result.filename}`,
        })
      }
      
      index++
    }
  }

  // Save mapping for seed
  const configPath = path.join(__dirname, 'listing-images.json')
  fs.writeFileSync(configPath, JSON.stringify(listings, null, 2))

  console.log(`\n✅ Generated ${listings.length} listing images`)
  console.log(`📁 Saved to: ${imagesDir}`)
  console.log(`📋 Config saved to: ${configPath}\n`)
}

main().catch(console.error)
