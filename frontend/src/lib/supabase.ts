import { createBrowserClient } from '@supabase/ssr'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type User = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

export type Listing = {
  id: string
  title: string
  description: string
  price: number
  currency: string
  gameName: string
  status: string
  images: string[]
  sellerId: string
}

export type Order = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
}
