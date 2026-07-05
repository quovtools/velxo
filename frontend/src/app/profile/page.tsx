"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/users/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setUser(res.data); setFirstName(res.data?.firstName || ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    await fetch('/api/v1/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ firstName }) })
    setSaving(false)
    alert('Profile updated')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <Card className="p-8 bg-zinc-900 border-zinc-800">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">Email</label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div>
                <label className="text-sm text-zinc-400">First Name</label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Role</label>
                <Input value={user?.role || ''} disabled />
              </div>
              <Button type="submit" className="bg-white text-black hover:bg-zinc-200" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
