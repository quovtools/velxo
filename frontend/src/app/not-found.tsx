import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black flex items-center">
        <div className="w-full py-12">
          <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <Gamepad2 className="w-24 h-24 text-zinc-600 mx-auto opacity-50 mb-4" />
              <h1 className="text-6xl font-black mb-2">404</h1>
              <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
              <p className="text-xl text-zinc-400 mb-8">
                Looks like you took a wrong turn. This page doesn&apos;t exist or has been moved.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Go Home
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline">
                  Browse Listings
                </Button>
              </Link>
            </div>

            <p className="text-zinc-500 text-sm mt-8">
              If you believe this is a mistake, contact our{' '}
              <Link href="/support" className="text-blue-400 hover:text-blue-300">
                support team
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
