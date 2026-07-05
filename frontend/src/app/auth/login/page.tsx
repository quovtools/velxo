"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else router.push('/')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Velxo</h1>
          <p className="mt-2 text-zinc-400">The safest gaming marketplace</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Loading...' : 'Sign in'}</Button>
        </form>
        <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700" /></div><div className="relative flex justify-center text-sm"><span className="bg-zinc-950 px-2 text-zinc-400">or continue with</span></div></div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>Google</Button>
        <p className="text-center text-sm text-zinc-400">Don't have an account? <Link href="/auth/register" className="text-white underline">Sign up</Link></p>
      </div>
    </div>
  )
}
