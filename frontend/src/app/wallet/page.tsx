"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [txns, setTxns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/wallet/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: null }))
      .then(res => { setWallet(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await fetch('/api/v1/wallet/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount) }) })
    alert('Withdrawal requested')
    setAmount('')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Wallet</h1>
        <Card className="p-8 bg-zinc-900 border-zinc-800 space-y-2">
          <p className="text-zinc-400 text-sm">Available Balance</p>
          {loading ? <Skeleton className="h-12 w-32" /> : <p className="text-4xl font-bold">${wallet?.balance?.toFixed(2) || '0.00'}</p>}
        </Card>
        <Card className="p-6 bg-zinc-900 border-zinc-800 mt-6">
          <h2 className="font-bold mb-4">Request Withdrawal</h2>
          <form onSubmit={handleWithdraw} className="flex gap-4">
            <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} min="1" step="0.01" required />
            <Button type="submit" disabled={loading}>Withdraw</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
