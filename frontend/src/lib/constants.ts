export const GAMES = [
  { id: 'free_fire', name: 'Free Fire', category: 'mobile', logo: 'https://cdn-icons-png.flaticon.com/128/9524/9524583.png' },
  { id: 'pubg_mobile', name: 'PUBG Mobile', category: 'mobile', logo: 'https://cdn-icons-png.flaticon.com/128/7502/7502492.png' },
  { id: 'cod_mobile', name: 'Call of Duty Mobile', category: 'mobile', logo: 'https://cdn-icons-png.flaticon.com/128/9524/9524618.png' },
  { id: 'fortnite', name: 'Fortnite', category: 'multi', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968755.png' },
  { id: 'valorant', name: 'Valorant', category: 'pc', logo: 'https://cdn-icons-png.flaticon.com/128/7502/7502513.png' },
  { id: 'lol', name: 'League of Legends', category: 'pc', logo: 'https://cdn-icons-png.flaticon.com/128/2991/2991139.png' },
  { id: 'roblox', name: 'Roblox', category: 'multi', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968954.png' },
  { id: 'minecraft', name: 'Minecraft', category: 'multi', logo: 'https://cdn-icons-png.flaticon.com/128/7502/7502477.png' },
  { id: 'coc', name: 'Clash of Clans', category: 'mobile', logo: 'https://cdn-icons-png.flaticon.com/128/7502/7502474.png' },
  { id: 'mobile_legends', name: 'Mobile Legends', category: 'mobile', logo: 'https://cdn-icons-png.flaticon.com/128/7502/7502498.png' },
  { id: 'ea_fc', name: 'EA FC', category: 'multi', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968815.png' },
  { id: 'steam', name: 'Steam', category: 'pc', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968862.png' },
  { id: 'epic', name: 'Epic Games', category: 'pc', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968923.png' },
  { id: 'playstation', name: 'PlayStation', category: 'console', logo: 'https://cdn-icons-png.flaticon.com/128/6124/6124995.png' },
  { id: 'xbox', name: 'Xbox', category: 'console', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968887.png' },
  { id: 'nintendo', name: 'Nintendo Switch', category: 'console', logo: 'https://cdn-icons-png.flaticon.com/128/5968/5968866.png' },
  { id: 'genshin', name: 'Genshin Impact', category: 'multi', logo: 'https://cdn-icons-png.flaticon.com/128/8879/8879232.png' },
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
