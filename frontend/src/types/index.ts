// User Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'seller' | 'admin'
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface SellerProfile {
  id: string
  userId: string
  storeName: string
  description?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationBadge?: string
  completedOrders: number
  successRate: number
  responseTime: number // minutes
  cancellationRate: number
  averageRating: number
  yearsActive: number
  totalReviews: number
  createdAt: string
}

// Listing Types
export type ListingType = 'account' | 'coins' | 'topup' | 'boost' | 'gift_card' | 'service'

export interface Listing {
  id: string
  title: string
  description: string
  type: ListingType
  game: string
  platform: string
  price: number
  quantity: number
  status: 'active' | 'sold' | 'pending' | 'rejected'
  seller: SellerProfile
  images: string[]
  region?: string
  rank?: string
  level?: string
  skins?: number
  characters?: number
  weapons?: number
  rareItems?: number
  linkedAccounts?: string[]
  emailAvailable?: boolean
  usernameAvailable?: boolean
  createdAt: string
  updatedAt: string
  views: number
  favorites: number
}

export interface ListingFilters {
  game?: string
  type?: ListingType
  platform?: string
  minPrice?: number
  maxPrice?: number
  region?: string
  sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high' | 'rating'
  page?: number
  limit?: number
}

// Order Types
export type OrderStatus = 'pending' | 'awaiting_delivery' | 'delivered' | 'completed' | 'disputed' | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  buyerId: string
  sellerId: string
  listingId: string
  listing: Listing
  totalAmount: number
  platformFee: number
  sellerAmount: number
  status: OrderStatus
  escrowStatus: 'pending' | 'held' | 'released' | 'refunded'
  deliveryMethod: string
  deliveryDetails?: string
  sellerNotes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  dispute?: Dispute
}

// Wallet Types
export interface Wallet {
  id: string
  userId: string
  balance: number
  escrowBalance: number
  pendingBalance: number
  totalEarnings: number
  totalWithdrawals: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  walletId: string
  type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'commission' | 'refund' | 'bonus'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description: string
  relatedOrderId?: string
  createdAt: string
}

// Review Types
export interface Review {
  id: string
  orderId: string
  reviewerId: string
  reviewer: User
  revieweeId: string
  rating: number
  communication: number
  deliverySpeed: number
  accuracy: number
  professionalism: number
  comment?: string
  isSellerReview: boolean
  createdAt: string
  updatedAt: string
}

// Dispute Types
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed'

export interface Dispute {
  id: string
  orderId: string
  order: Order
  openedBy: string
  moderatorId?: string
  status: DisputeStatus
  reason: string
  buyerEvidence?: string[]
  sellerResponse?: string
  sellerEvidence?: string[]
  resolution?: string
  refundAmount?: number
  createdAt: string
  resolvedAt?: string
}

// Message Types
export interface Conversation {
  id: string
  participantIds: string[]
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  sender: User
  content: string
  attachments?: string[]
  isRead: boolean
  createdAt: string
}

// Payment Types
export interface PaymentIntent {
  id: string
  orderId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod: string
  reference?: string
  createdAt: string
}

// Search Types
export interface SearchResult {
  listings: Listing[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'order' | 'review' | 'message' | 'dispute' | 'system'
  title: string
  message: string
  relatedId?: string
  isRead: boolean
  createdAt: string
}

// Admin Types
export interface AdminDashboard {
  totalUsers: number
  totalSellers: number
  totalListings: number
  totalOrders: number
  totalRevenue: number
  gmv: number // Gross Merchandise Value
  averageOrderValue: number
  disputeRate: number
  refundRate: number
  conversionRate: number
}
