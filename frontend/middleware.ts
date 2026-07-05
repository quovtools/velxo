import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: any) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string) {
          request.cookies.set({ name, value })
          response.cookies.set({ name, value })
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')
  const isProtected = request.nextUrl.pathname.startsWith('/seller') || request.nextUrl.pathname.startsWith('/profile')
  if ((isAdmin || isProtected) && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  return response
}

export const config = { matcher: ['/admin/:path*', '/seller/:path*', '/profile/:path*', '/orders/:path*'] }
