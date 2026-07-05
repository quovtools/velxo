"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function SellPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/v1/listings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ title, price, categoryId: 'placeholder', gameName: 'placeholder' }) })
    if (res.ok) router.push('/seller/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Create Listing</h1>
        <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Listing'}</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
