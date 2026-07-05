"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { firstName } } })
    if (error) alert(error.message)
    else { alert('Account created! Please check your email to verify.'); router.push('/auth/login') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Velxo</h1>
          <p className="mt-2 text-zinc-400">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Loading...' : 'Sign up'}</Button>
        </form>
        <p className="text-center text-sm text-zinc-400">Already have an account? <Link href="/auth/login" className="text-white underline">Sign in</Link></p>
      </div>
    </div>
  )
}
