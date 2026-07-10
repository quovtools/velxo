# Velxo Seed Data — Quick Start Guide

## 🚀 One-Command Setup

```bash
cd backend
npm run prisma:seed
```

That's it! Your database will be populated with realistic marketplace data.

---

## 📋 What Gets Seeded

✅ **1 Admin User**  
✅ **5 Verified Sellers** (with wallets & reputation)  
✅ **7 Buyer Accounts** (ready to purchase)  
✅ **20 Gaming Account Listings** (Free Fire, PUBG, ML, Valorant, Genshin)  
✅ **15-18 Gigs** (Professional rank boosting services)  
✅ **31 Top-Up Products** (Diamond/UC top-ups for all games)  
✅ **6 Game Slides** (Homepage hero section)  
✅ **7 Marquee Items** (Announcement bar messages)  
✅ **6 Reward Items** (VelxoCoins redemption catalog)  
✅ **3 Blog Posts** (Published articles)  
✅ **5 Categories** with **44 Subcategories**  

---

## 🧪 Test Credentials

### Login as Admin
```
Email: admin@velxo.shop
```

### Login as Sellers (Browse their dashboards)
```
kwame.gaming@velxo.shop      (Ghana, PRO tier, 234 sales)
david.booster@velxo.shop     (Kenya, PREMIUM tier, 412 sales)
amina.games@velxo.shop       (Egypt, PRO tier)
zainab.plays@velxo.shop      (Nigeria, FREE tier)
thabo.gamer@velxo.shop       (South Africa, FREE tier)
```

### Login as Buyers (Make purchases)
```
chidi.okafor@gmail.com       (Nigeria)
fatou.ndiaye@gmail.com       (Senegal)
yusuf.mohammed@gmail.com     (Ethiopia)
nairobi.gamer@gmail.com      (Kenya)
grace.mwanza@gmail.com       (Zambia)
kofi.mensah@gmail.com        (Ghana)
amina.diop@gmail.com         (Morocco)
```

---

## 🎮 What You Can Test

### Browse Marketplace
- [ ] View all gaming account listings
- [ ] Filter by game (Free Fire, PUBG, Mobile Legends, etc.)
- [ ] Filter by rank, region, platform
- [ ] View seller profiles with ratings
- [ ] Read seller descriptions

### Purchase Flow
- [ ] Add listing to cart
- [ ] Proceed to checkout
- [ ] See escrow protection info
- [ ] Place order as buyer
- [ ] Confirm delivery

### Seller Features
- [ ] View seller dashboard
- [ ] See sales history
- [ ] Check earnings and wallet
- [ ] View reputation score
- [ ] Access VelxoCoins balance

### Gigs (Services)
- [ ] Browse rank boosting gigs
- [ ] View gig details (from → to rank)
- [ ] See delivery timelines
- [ ] Check service pricing

### Shop/Products
- [ ] Browse top-ups by game
- [ ] See instant delivery products
- [ ] Check reward catalog
- [ ] Redeem VelxoCoins

### Content
- [ ] Read blog posts
- [ ] Check game slides on homepage
- [ ] See marquee announcements
- [ ] Browse categories

---

## 🔧 Troubleshooting

### Issue: "DATABASE_URL not set"
**Solution:** Ensure `.env` file is configured with valid database URL
```
DATABASE_URL=postgresql://user:password@localhost:5432/velxo
```

### Issue: "Prisma migrations not run"
**Solution:** Run migrations first
```bash
npm run prisma:push
```

### Issue: "Port already in use"
**Solution:** Database server might already be running or port is taken

### Issue: "Seed runs but data not visible"
**Solution:** Clear browser cache or restart dev server

---

## 📊 Seed Statistics

```
Total Records:        ~180+
Total Users:          13 (1 admin, 5 sellers, 7 buyers)
Total Listings:       20
Total Services:       15-18
Total Products:       31
Total Games:          10+
Total Categories:     5 + 44 subcategories
```

---

## ✨ Key Features of This Seed

✅ **Original Data** — All descriptions, bios, and details are unique  
✅ **Realistic Pricing** — Market-based prices for accounts and services  
✅ **Diverse Geography** — Sellers and buyers from across Africa  
✅ **Complete Profiles** — Sellers have verified KYC, ratings, wallets  
✅ **Professional Details** — Account specs match real gaming data  
✅ **Rich Content** — Blog posts, announcements, rewards catalog  
✅ **Ready to Demo** — Immediately usable for testing and demos  

---

## 🎯 Next Steps

1. Run the seed
2. Start the backend server: `npm run start:dev`
3. Start the frontend: `cd ../frontend && npm run dev`
4. Open `http://localhost:3000`
5. Login with test credentials
6. Browse and test the marketplace

---

## 📖 Full Documentation

For detailed information about all seeded data, see: `SEED_DATA_DOCUMENTATION.md`

---

**Ready to seed? Run:** `npm run prisma:seed`  
**Let's go! 🚀**
