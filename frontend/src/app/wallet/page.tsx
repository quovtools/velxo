'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import { ArrowDownLeft, ArrowUpRight, Plus, Send } from 'lucide-react'

interface WalletData {
  id: string
  balance: number
  escrowBalance: number
  pendingBalance: number
  totalEarnings: number
  totalWithdrawals: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
}

export default function WalletPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { data: walletData, loading: walletLoading } = useApi<WalletData>('/wallet')
  const { data: transactionsData, loading: transLoading } = useApi<{ transactions: Transaction[] }>(
    '/wallet/transactions'
  )

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || walletLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin">Loading...</div>
        </div>
        <Footer />
      </>
    )
  }

  const transactions = transactionsData?.transactions || []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <h1 className="text-4xl font-black mb-12">Wallet</h1>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: 'Available Balance',
                value: walletData?.balance || 0,
                icon: '💵',
                color: 'from-green-600 to-green-700',
              },
              {
                label: 'Escrow Held',
                value: walletData?.escrowBalance || 0,
                icon: '🔒',
                color: 'from-blue-600 to-blue-700',
              },
              {
                label: 'Pending',
                value: walletData?.pendingBalance || 0,
                icon: '⏳',
                color: 'from-yellow-600 to-yellow-700',
              },
              {
                label: 'Total Earnings',
                value: walletData?.totalEarnings || 0,
                icon: '📈',
                color: 'from-purple-600 to-purple-700',
              },
            ].map((card, i) => (
              <Card key={i} className="border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">{card.label}</p>
                    <p className={`text-3xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                      {formatPrice(card.value)}
                    </p>
                  </div>
                  <span className="text-2xl">{card.icon}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-5 h-5" />
              Add Funds
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Send className="w-5 h-5" />
              Withdraw Funds
            </Button>
          </div>

          {/* Transaction History */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-8">
            <h2 className="text-2xl font-bold mb-6">Transaction History</h2>

            {transLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">Type</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">Description</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">Amount</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-zinc-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/30 transition"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {tx.type.includes('deposit') || tx.type.includes('credit') ? (
                              <ArrowDownLeft className="w-4 h-4 text-green-400" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm font-medium capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-zinc-300">{tx.description}</td>
                        <td className="py-4 px-4 text-sm font-semibold">
                          {tx.type.includes('deposit') || tx.type.includes('credit') ? '+' : '-'}
                          {formatPrice(Math.abs(tx.amount))}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              tx.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : tx.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-zinc-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-400">No transactions yet</p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
