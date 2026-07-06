"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface WalletData {
  balance: number
  escrowBalance: number
  pendingBalance: number
  totalLifetime: number
}

interface Transaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  createdAt: string
  relatedId?: string
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [processingWithdraw, setProcessingWithdraw] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setWallet(data.data)
        }

        const txRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/wallet/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (txRes.ok) {
          const txData = await txRes.json()
          setTransactions(txData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()
  }, [router])

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setProcessingWithdraw(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      })

      if (res.ok) {
        alert('Withdrawal request submitted! You will receive your funds within 24-48 hours.')
        setWithdrawAmount('')
        router.refresh()
      } else {
        alert('Failed to process withdrawal')
      }
    } catch (error) {
      alert('Error processing withdrawal')
    } finally {
      setProcessingWithdraw(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full bg-zinc-800 mb-8" />
          <Skeleton className="h-96 w-full bg-zinc-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Wallet</h1>
          <p className="text-zinc-400">Manage your funds and transactions</p>
        </div>

        {/* Balance Cards */}
        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/10 border-blue-800">
              <p className="text-zinc-400 text-sm mb-2">Available Balance</p>
              <h2 className="text-4xl font-bold text-blue-400 mb-2">${wallet.balance.toFixed(2)}</h2>
              <p className="text-xs text-zinc-500">Ready to withdraw</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-purple-800">
              <p className="text-zinc-400 text-sm mb-2">Total Lifetime Earnings</p>
              <h2 className="text-4xl font-bold text-purple-400 mb-2">${wallet.totalLifetime.toFixed(2)}</h2>
              <p className="text-xs text-zinc-500">All time</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border-yellow-800">
              <p className="text-zinc-400 text-sm mb-2">In Escrow</p>
              <h2 className="text-4xl font-bold text-yellow-400">${wallet.escrowBalance.toFixed(2)}</h2>
              <p className="text-xs text-zinc-500">Held in escrow</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/10 border-orange-800">
              <p className="text-zinc-400 text-sm mb-2">Pending</p>
              <h2 className="text-4xl font-bold text-orange-400">${wallet.pendingBalance.toFixed(2)}</h2>
              <p className="text-xs text-zinc-500">Processing</p>
            </Card>
          </div>
        )}

        {/* Withdraw Section */}
        <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">Withdraw Funds</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount ($)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
              {wallet && (
                <p className="text-xs text-zinc-400 mt-2">
                  Available: ${wallet.balance.toFixed(2)}
                </p>
              )}
            </div>
            <button
              onClick={handleWithdraw}
              disabled={processingWithdraw || !withdrawAmount}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              {processingWithdraw ? 'Processing...' : 'Withdraw Now'}
            </button>
            <p className="text-xs text-zinc-400">
              Withdrawals are processed within 24-48 hours to your registered bank account.
            </p>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={`font-bold text-lg ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No transactions yet</p>
          )}
        </Card>
      </div>
    </div>
  )
}
