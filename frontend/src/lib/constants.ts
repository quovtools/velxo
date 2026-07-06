export const GAMES = [
  { id: 'free_fire', name: 'Free Fire', category: 'mobile' },
  { id: 'pubg_mobile', name: 'PUBG Mobile', category: 'mobile' },
  { id: 'cod_mobile', name: 'Call of Duty Mobile', category: 'mobile' },
  { id: 'fortnite', name: 'Fortnite', category: 'multi' },
  { id: 'valorant', name: 'Valorant', category: 'pc' },
  { id: 'lol', name: 'League of Legends', category: 'pc' },
  { id: 'roblox', name: 'Roblox', category: 'multi' },
  { id: 'minecraft', name: 'Minecraft', category: 'multi' },
  { id: 'coc', name: 'Clash of Clans', category: 'mobile' },
  { id: 'mobile_legends', name: 'Mobile Legends', category: 'mobile' },
  { id: 'ea_fc', name: 'EA FC', category: 'multi' },
  { id: 'steam', name: 'Steam', category: 'pc' },
  { id: 'epic', name: 'Epic Games', category: 'pc' },
  { id: 'playstation', name: 'PlayStation', category: 'console' },
  { id: 'xbox', name: 'Xbox', category: 'console' },
  { id: 'nintendo', name: 'Nintendo', category: 'console' },
  { id: 'genshin', name: 'Genshin Impact', category: 'multi' },
]

export const PLATFORMS = ['PC', 'Mobile', 'PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Epic']

export const REGIONS = ['Global', 'North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania']

export const LISTING_TYPES = [
  { id: 'account', label: 'Gaming Accounts', icon: 'User' },
  { id: 'coins', label: 'In-Game Currency', icon: 'Coins' },
  { id: 'topup', label: 'Game Top-Ups', icon: 'CreditCard' },
  { id: 'boost', label: 'Ranking Services', icon: 'TrendingUp' },
  { id: 'gift_card', label: 'Gift Cards', icon: 'Gift' },
  { id: 'service', label: 'Custom Services', icon: 'Zap' },
]

export const VERIFICATION_LEVELS = [
  { level: 1, name: 'Email Verified', badge: 'email' },
  { level: 2, name: 'Phone Verified', badge: 'phone' },
  { level: 3, name: 'ID Verified', badge: 'id' },
  { level: 4, name: 'Business Verified', badge: 'business' },
]

export const ORDER_STATUSES = {
  pending: 'Payment Pending',
  awaiting_delivery: 'Awaiting Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

export const DISPUTE_REASONS = [
  'Item not received',
  'Item not as described',
  'Quality issues',
  'Account already taken',
  'Seller unresponsive',
  'Other',
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  NGN: '₦',
  ZAR: 'R',
  KES: 'KSh',
}

export const COMMISSION_RATE = 0.1 // 10%
