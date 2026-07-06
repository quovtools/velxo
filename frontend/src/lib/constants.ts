export const GAMES = [
  { id: 'free_fire', name: 'Free Fire', category: 'mobile', icon: '🔥' },
  { id: 'pubg_mobile', name: 'PUBG Mobile', category: 'mobile', icon: '🎯' },
  { id: 'cod_mobile', name: 'Call of Duty Mobile', category: 'mobile', icon: '🎖️' },
  { id: 'fortnite', name: 'Fortnite', category: 'multi', icon: '⚡' },
  { id: 'valorant', name: 'Valorant', category: 'pc', icon: '🎮' },
  { id: 'lol', name: 'League of Legends', category: 'pc', icon: '👑' },
  { id: 'roblox', name: 'Roblox', category: 'multi', icon: '🧱' },
  { id: 'minecraft', name: 'Minecraft', category: 'multi', icon: '⛏️' },
  { id: 'coc', name: 'Clash of Clans', category: 'mobile', icon: '🏰' },
  { id: 'mobile_legends', name: 'Mobile Legends', category: 'mobile', icon: '⚔️' },
  { id: 'ea_fc', name: 'EA FC', category: 'multi', icon: '⚽' },
  { id: 'steam', name: 'Steam', category: 'pc', icon: '🐍' },
  { id: 'epic', name: 'Epic Games', category: 'pc', icon: '🎬' },
  { id: 'playstation', name: 'PlayStation', category: 'console', icon: '📺' },
  { id: 'xbox', name: 'Xbox', category: 'console', icon: '📦' },
  { id: 'nintendo', name: 'Nintendo', category: 'console', icon: '🕹️' },
  { id: 'genshin', name: 'Genshin Impact', category: 'multi', icon: '✨' },
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
