'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useApi, apiCall } from '@/hooks/useApi'
import { Wallet } from '@/types'
import { ChevronLeft, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function WithdrawPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank_transfer',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    swiftCode: '',
  })

  const { data: wallet, loading: walletLoading } = useApi<Wallet>('/wallet')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const amount = parseFloat(formData.amount)
      if (!amount || amount <= 0 || amount > (wallet?.balance || 0)) {
        throw new Error('Invalid withdrawal amount')
      }

      await apiCall('/wallet/withdraw', {
        method: 'POST',
        body: {
          amount,
          method: formData.method,
          bankName: formData.bankName || undefined,
          accountNumber: formData.accountNumber || undefined,
          accountHolder: formData.accountHolder || undefined,
          swiftCode: formData.swiftCode || undefined,
        },
      })
      setSuccess(true)
      setTimeout(() => router.push('/wallet'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request withdrawal')
    } finally {
      setLoading(false)
    }
  }

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-zinc-800 rounded w-1/3" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const availableBalance = wallet?.balance || 0
  const minimumWithdrawal = 10
  const fee = parseFloat(formData.amount) ? (parseFloat(formData.amount) * 0.02).toFixed(2) : '0.00'
  const netAmount = parseFloat(formData.amount) ? (parseFloat(formData.amount) - parseFloat(fee)).toFixed(2) : '0.00'

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-20">
        {/* Breadcrumb */}
        <Link href="/wallet" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Wallet
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Request Withdrawal</h1>
          <p className="text-zinc-400">Transfer your earnings to your bank account or wallet</p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="p-4 bg-green-500/10 border border-green-500/30 mb-6 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-400">Withdrawal requested successfully!</h3>
              <p className="text-sm text-green-300">You will receive your funds within 1-3 business days. Redirecting...</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-500/10 border border-red-500/30 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-400">Withdrawal failed</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-zinc-700 bg-zinc-900/50">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Amount */}
                <div>
                  <h2 className="text-xl font-bold mb-6">Withdrawal Amount</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Amount to Withdraw ($)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        min={minimumWithdrawal}
                        max={availableBalance}
                        className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 text-lg font-semibold"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        Available: <span className="text-cyan-400">${availableBalance.toFixed(2)}</span> | Minimum: ${minimumWithdrawal}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-zinc-400">Withdrawal Fee (2%)</span>
                        <span className="text-sm font-semibold text-blue-400">-${fee}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-500/20">
                        <span className="text-sm font-semibold">You will receive</span>
                        <span className="text-lg font-bold text-green-400">${netAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Method */}
                <div>
                  <h2 className="text-xl font-bold mb-6">Withdrawal Method</h2>
                  <div className="space-y-4">
                    {[
                      { value: 'bank_transfer', label: 'Bank Transfer', desc: '1-3 business days' },
                      { value: 'paypal', label: 'PayPal', desc: 'Usually instant' },
                      { value: 'crypto', label: 'Cryptocurrency', desc: 'Usually instant' },
                    ].map((method) => (
                      <label key={method.value} className="flex items-center p-4 rounded-lg border cursor-pointer transition" style={{
                        borderColor: formData.method === method.value ? '#3b82f6' : '#3f3f46',
                        backgroundColor: formData.method === method.value ? 'rgba(59, 130, 246, 0.05)' : 'rgba(24, 24, 27, 0.5)',
                      }}>
                        <input
                          type="radio"
                          name="method"
                          value={method.value}
                          checked={formData.method === method.value}
                          onChange={handleInputChange}
                          className="w-4 h-4"
                        />
                        <div className="ml-4 flex-1">
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-zinc-400">{method.desc}</p>
                        </div>
                        {formData.method === method.value && (
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bank Transfer Details */}
                {formData.method === 'bank_transfer' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Bank Account Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Account Holder Name</label>
                        <input
                          type="text"
                          name="accountHolder"
                          value={formData.accountHolder}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                          placeholder="Chase Bank"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Account Number</label>
                        <input
                          type="password"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                          placeholder="••••••••••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">SWIFT/BIC Code (Optional)</label>
                        <input
                          type="text"
                          name="swiftCode"
                          value={formData.swiftCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                          placeholder="CHASUS33"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={loading || !formData.amount || parseFloat(formData.amount) < minimumWithdrawal}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Request Withdrawal'}
                  </Button>
                  <Link href="/wallet" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Balance Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <h3 className="font-bold mb-4">Available Balance</h3>
              <p className="text-3xl font-bold text-cyan-400 mb-2">${availableBalance.toFixed(2)}</p>
              <p className="text-sm text-zinc-400">Ready to withdraw</p>
            </Card>

            {/* Processing Info */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <h3 className="font-bold mb-4">Processing Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-zinc-400 mb-1">Bank Transfer</p>
                  <p className="text-cyan-400">1-3 business days</p>
                </div>
                <div>
                  <p className="text-zinc-400 mb-1">PayPal</p>
                  <p className="text-cyan-400">Usually instant</p>
                </div>
                <div>
                  <p className="text-zinc-400 mb-1">Crypto</p>
                  <p className="text-cyan-400">Usually instant</p>
                </div>
              </div>
            </Card>

            {/* Fees */}
            <Card className="p-6 border-yellow-500/20 bg-yellow-500/5">
              <h3 className="font-bold mb-4">Withdrawal Fee</h3>
              <p className="text-2xl font-bold text-yellow-400">2%</p>
              <p className="text-xs text-zinc-400 mt-2">Charged on all withdrawals to cover processing costs</p>
            </Card>

            {/* Tips */}
            <Card className="p-6 border-zinc-700 bg-zinc-900/50">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span>💡</span> Tips
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• Minimum withdrawal is ${minimumWithdrawal}</li>
                <li>• Verify your bank details carefully</li>
                <li>• Keep your account secure</li>
                <li>• Check your email for confirmation</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
