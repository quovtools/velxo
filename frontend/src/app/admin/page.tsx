'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Eye, Scale, BarChart3, AlertOctagon, Image } from 'lucide-react';
import { useAuth } from '../providers';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { role } = useAuth();
  const router = useRouter();

  // Role Gate
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
    return (
      <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl max-w-lg mx-auto my-12">
        <AlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white">Access Denied</h2>
        <p className="text-gray-400 text-sm mt-2">You do not have administrative credentials to view this page.</p>
        <Link href="/" className="mt-6 inline-block bg-brand hover:bg-brand-dark px-6 py-2.5 rounded-xl font-bold transition text-white">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 my-6">
      <div className="border-b border-borderBg pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-brand" />
          Admin Operations Hub
        </h1>
        <p className="text-gray-400 mt-2">Manage listings audit, arbitrate buyer disputes, and audit financial charts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Link 1: Moderation */}
        <Link
          href="/admin/moderation"
          className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl p-8 space-y-4 transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Eye className="w-10 h-10 text-brand" />
            <h3 className="text-xl font-bold text-white">Listings Moderation</h3>
            <p className="text-sm text-gray-500">Approve pending listings, ban sellers, and flag malicious data.</p>
          </div>
          <span className="text-brand-light text-xs font-bold font-mono">Open &rarr;</span>
        </Link>

        {/* Link 2: Disputes */}
        <Link
          href="/admin/disputes"
          className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl p-8 space-y-4 transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Scale className="w-10 h-10 text-brand" />
            <h3 className="text-xl font-bold text-white">Escrow Dispute Court</h3>
            <p className="text-sm text-gray-500">Arbitrate contested transactions, refund buyers or release money to merchants.</p>
          </div>
          <span className="text-brand-light text-xs font-bold font-mono">Open &rarr;</span>
        </Link>

        {/* Link 3: Analytics */}
        <Link
          href="/admin/analytics"
          className="bg-cardBg border border-borderBg hover:border-brand/40 rounded-2xl p-8 space-y-4 transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <BarChart3 className="w-10 h-10 text-brand" />
            <h3 className="text-xl font-bold text-white">Financial &amp; Platform Stats</h3>
            <p className="text-sm text-gray-500">Audit sales commission ledger, user counts, and active daily volumes.</p>
          </div>
          <span className="text-brand-light text-xs font-bold font-mono">Open &rarr;</span>
        </Link>

        {/* Link 4: Slideshow */}
        <Link
          href="/admin/slides"
          className="bg-cardBg border border-brand/20 hover:border-brand/60 rounded-2xl p-8 space-y-4 transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Image className="w-10 h-10 text-brand" />
            <h3 className="text-xl font-bold text-white">Homepage Slideshow</h3>
            <p className="text-sm text-gray-500">Add, edit, and reorder the game banner slides shown on the homepage.</p>
          </div>
          <span className="text-brand-light text-xs font-bold font-mono">Open &rarr;</span>
        </Link>
      </div>
    </div>
  );
}
