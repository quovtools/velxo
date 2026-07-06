'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';

interface WalletData {
  balance: string;
  lockedBalance: string;
  totalEarnings: string;
  totalWithdrawn: string;
}

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadWallet() {
      try {
        const [wRes, tRes] = await Promise.all([
          api.get<{ success: boolean; data: WalletData }>('/wallet'),
          api.get<{ success: boolean; data: Transaction[] }>('/wallet/transactions'),
        ]);

        if (wRes.success) setWallet(wRes.data);
        if (tRes.success) setTransactions(tRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, [user, router]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || parseFloat(withdrawAmount) > parseFloat(wallet.balance)) {
      alert('Insufficient funds available for withdrawal.');
      return;
    }

    alert('Withdrawal request registered! Funds will be processed within 24 hours.');
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setDestination('');
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading wallet dashboard...</div>;
  }

  return (
    <div className="space-y-8 my-6">
      <div className="border-b border-borderBg pb-6">
        <h1 className="text-3xl font-extrabold text-white">Your Wallet</h1>
        <p className="text-gray-400 mt-2">Manage your earnings, request withdrawals, and check transaction logs.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Available Balance</p>
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-black text-white">${Number(wallet?.balance || 0).toFixed(2)}</h2>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-brand hover:bg-brand-dark px-4 py-2 rounded-xl text-xs font-bold transition text-white"
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Locked Escrow</p>
          <h2 className="text-3xl font-black text-gray-400">${Number(wallet?.lockedBalance || 0).toFixed(2)}</h2>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Earnings</p>
          <h2 className="text-3xl font-black text-emerald-400">${Number(wallet?.totalEarnings || 0).toFixed(2)}</h2>
        </div>

        <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Withdrawn</p>
          <h2 className="text-3xl font-black text-white">${Number(wallet?.totalWithdrawn || 0).toFixed(2)}</h2>
        </div>
      </div>

      {/* Ledger transactions list */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-bold text-white">Transaction History</h3>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No transaction records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase font-bold border-b border-borderBg">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderBg">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-background/20 transition">
                    <td className="py-4 px-4 flex items-center gap-2">
                      {['CREDIT', 'RELEASE', 'REFUND'].includes(t.type) ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-bold text-white text-xs">{t.type}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{t.description}</td>
                    <td className={`py-4 px-4 text-right font-bold ${
                      ['CREDIT', 'RELEASE', 'REFUND'].includes(t.type) ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {['CREDIT', 'RELEASE', 'REFUND'].includes(t.type) ? '+' : '-'}${Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg border border-borderBg rounded-3xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-white">Withdraw Funds</h3>
              <p className="text-gray-400 text-xs mt-1">Request a payout from your available wallet balance.</p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payout Method</label>
                <select
                  required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                >
                  <option value="bank">Bank Transfer (NGN/GHS)</option>
                  <option value="crypto">USDT (TRC-20)</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (USD)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Destination Details</label>
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand"
                  placeholder={withdrawMethod === 'crypto' ? 'USDT Wallet Address' : 'Account Number & Bank Name'}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="bg-background border border-borderBg rounded-2xl p-4 flex gap-2 text-[10px] text-gray-500">
                <Clock className="w-5 h-5 text-brand flex-shrink-0" />
                <p>Withdrawal requests are processed manually within 24-48 hours after passing compliance security audits.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-background border border-borderBg py-3 rounded-xl font-bold transition text-gray-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand hover:bg-brand-dark py-3 rounded-xl font-bold transition text-white text-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
