'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Scale, CheckCircle2, RefreshCw } from 'lucide-react';

interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  createdAt: string;
  order: {
    totalAmount: string;
    buyer: {
      firstName: string;
      lastName: string;
    };
    seller: {
      storeName: string;
    };
  };
}

export default function AdminDisputesPage() {
  const { role } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDisputes() {
    try {
      const response = await api.get<{ success: boolean; data: Dispute[] }>('/disputes/open');
      if (response.success) {
        setDisputes(response.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR') {
      loadDisputes();
    }
  }, [role]);

  const handleArbitration = async (id: string, resolution: 'REFUND_BUYER' | 'RELEASE_TO_SELLER') => {
    const confirmation = confirm(`Resolve dispute: execute ${resolution} on escrow hold?`);
    if (!confirmation) return;

    try {
      const response = await api.patch<{ success: boolean }>(`/disputes/${id}/resolve`, {
        resolutionType: resolution,
        resolutionNotes: `Arbitrated by platform support. Escrow assigned: ${resolution}.`,
      });

      if (response.success) {
        alert('Dispute arbitrated and settled successfully!');
        await loadDisputes();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to settle dispute');
    }
  };

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
    return <div className="text-center py-20 text-red-400 font-bold">Access Denied</div>;
  }

  return (
    <div className="space-y-8 my-6">
      <div className="border-b border-borderBg pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Scale className="w-8 h-8 text-brand" />
          Escrow Dispute Arbitrator
        </h1>
        <p className="text-gray-400 mt-2">Mediate transaction complaints, review statements, and distribute funds.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading dispute logs...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12 bg-cardBg border border-borderBg rounded-2xl">
          <p className="text-gray-400">Perfect record! No transaction complaints are currently active.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-cardBg border border-borderBg rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs font-semibold px-2 py-0.5 rounded bg-red-950/20 border border-red-500/20">
                    Dispute #{d.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">Filed {new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-lg text-white mt-1">Reason: {d.reason}</h3>
                <p className="text-xs text-gray-500">
                  Buyer: <span className="text-gray-300">{d.order?.buyer?.firstName} {d.order?.buyer?.lastName}</span> • Seller: <span className="text-brand-light">{d.order?.seller?.storeName}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between border-t border-borderBg pt-4 md:border-t-0 md:pt-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold">Escrow Hold</p>
                  <p className="text-xl font-black text-white">${Number(d.order?.totalAmount || 0).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleArbitration(d.id, 'RELEASE_TO_SELLER')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2.5 px-4 rounded-xl transition text-white"
                  >
                    Release to Seller
                  </button>
                  <button
                    onClick={() => handleArbitration(d.id, 'REFUND_BUYER')}
                    className="bg-red-600 hover:bg-red-700 text-xs font-bold py-2.5 px-4 rounded-xl transition text-white"
                  >
                    Refund Buyer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
