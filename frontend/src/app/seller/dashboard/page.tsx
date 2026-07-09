'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { DollarSign, Star, TrendingUp, Package, Clock, Shield, Users, AlertCircle, Menu, X, CheckCircle, PlusCircle, ShieldCheck, MessageSquare, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string;
  isVerified: boolean;
  reputationScore: number;
  totalSales: number;
  totalRevenue: string;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  subscriptionTier: string;
  verifiedAt?: string;
}

interface SellerListing {
  id: string;
  title: string;
  price: string;
  status: string;
  salesCount: number;
  viewCount: number;
}

interface SellerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  buyer: { id: string; firstName: string; lastName: string };
  orderItems: Array<{ listing: { title: string; gameName: string } }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl p-5 hover:border-brand/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-brand/10 rounded-lg text-brand">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trendUp 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{title}</h3>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadDashboard() {
      try {
        const [sRes, lRes, oRes] = await Promise.all([
          api.get<{ success: boolean; data: SellerProfile }>('/sellers/me'),
          api.get<{ success: boolean; data: { listings: SellerListing[] } }>('/listings?sellerId=' + user!.id),
          api.get<{ success: boolean; data: SellerOrder[] }>('/orders/seller'),
        ]);

        if (sRes.success) setSeller(sRes.data);
        if (lRes.success) setListings(lRes.data?.listings || []);
        if (oRes.success) setSellerOrders(oRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user, authLoading, router]);

  const handleMarkDelivered = async (orderId: string) => {
    if (!confirm('Mark this order as delivered? The buyer will be asked to confirm receipt and release escrow.')) return;
    setDeliveringId(orderId);
    try {
      const res = await api.patch<{ success: boolean }>(`/orders/${orderId}/mark-delivered`, {
        deliveryData: { message: 'Order marked as delivered by seller.', deliveredAt: new Date().toISOString() },
      });
      if (res.success) {
        const oRes = await api.get<{ success: boolean; data: SellerOrder[] }>('/orders/seller');
        if (oRes.success) setSellerOrders(oRes.data || []);
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to mark as delivered');
    } finally {
      setDeliveringId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

interface TierInfo {
  name: string;
  color: string;
  border: string;
}

interface TierConfig {
  FREE: TierInfo;
  BASIC: TierInfo;
  PRO: TierInfo;
  PREMIUM: TierInfo;
}

const tierConfig: TierConfig = {
  FREE: { name: 'Free', color: 'text-gray-400', border: 'border-gray-500/20' },
  BASIC: { name: 'Basic', color: 'text-blue-400', border: 'border-blue-500/30' },
  PRO: { name: 'Pro', color: 'text-purple-400', border: 'border-purple-500/30' },
  PREMIUM: { name: 'Premium', color: 'text-yellow-400', border: 'border-yellow-500/30' },
};

const currentTier = tierConfig[seller?.subscriptionTier as keyof TierConfig] || tierConfig.FREE;

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Header with mobile menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Seller Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your store, track performance, and grow your business</p>
        </div>
          <div className="flex items-center gap-2">
            <Link
              href="/seller/gigs"
              className="hidden sm:flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-bold transition text-white shadow-lg shadow-purple-600/20"
            >
              <Gamepad2 className="w-5 h-5" />
              Boosting Gigs
            </Link>
            <Link
              href="/sell"
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-6 py-3 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20"
            >
              <Package className="w-5 h-5" />
              Create Listing
            </Link>
          </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden space-y-3 animate-fade-in">
           <Link href="/sell" className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white">
            <Package className="w-5 h-5" />
            Create Listing
          </Link>
          <Link href="/seller/gigs" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition text-white">
            <Gamepad2 className="w-5 h-5" />
            Boosting Gigs
          </Link>
          <Link href="/seller/settings" className="flex items-center gap-2 text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-hoverBg transition">
            <Users className="w-5 h-5" />
            Store Settings
          </Link>
          <Link href="/wallet" className="flex items-center gap-2 text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-hoverBg transition">
            <DollarSign className="w-5 h-5" />
            Wallet
          </Link>
        </div>
      )}

      {/* Verification Status Banner */}
      {seller?.isVerified && seller.verifiedAt && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Verified Seller
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </h3>
              <p className="text-sm text-emerald-200/80 mt-1">
                Verified since {new Date(seller.verifiedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-xs text-emerald-400/70 font-medium px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              {seller?.subscriptionTier || 'FREE'} Tier
            </span>
          </div>
        </div>
      )}

      {/* Store Info Card - Amazon-style */}
      <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
        <div className="bg-hoverBg/50 px-6 py-4 border-b border-borderBg">
          <h2 className="text-sm font-bold text-white">Store Information</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
               <span className="text-2xl font-black text-white">{seller?.storeName?.[0]?.toUpperCase() || '?'}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{seller?.storeName}</h2>
                {seller?.isVerified && <ShieldCheck className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-gray-400 text-sm mt-2 max-w-2xl">{seller?.storeDescription || 'No description provided.'}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-white">{seller?.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-xs text-gray-500">({seller?.totalSales} ratings)</span>
                </div>
                <div className="w-px h-4 bg-borderBg"></div>
                <div className="text-sm text-gray-400">
                  {seller?.totalSales} items sold
                </div>
                <div className="w-px h-4 bg-borderBg"></div>
                <div className="text-sm text-gray-400">
                  {seller?.responseRate ? (seller.responseRate * 100).toFixed(0) : 0}% response rate
                </div>
                {seller?.responseTime && (
                  <>
                    <div className="w-px h-4 bg-borderBg"></div>
                    <div className="text-sm text-gray-400">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      {seller.responseTime}h avg response
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue"
          value={`$${Number(seller?.totalRevenue || 0).toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard 
          title="Total Sales"
          value={seller?.totalSales || 0}
          icon={<Package className="w-6 h-6" />}
          trend="+8.2%"
          trendUp={true}
        />
        <StatCard 
          title="Rating"
          value={seller?.averageRating?.toFixed(1) || '0.0'}
          icon={<Star className="w-6 h-6" />}
        />
        <StatCard 
          title="Reputation"
          value={(seller?.reputationScore || 0).toFixed(0)}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* Orders / Inbox */}
      <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-borderBg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-white">Orders &amp; Buyer Inbox</h2>
          </div>
          <span className="text-xs text-gray-500 bg-hoverBg/50 px-3 py-1 rounded-full border border-borderBg">
            {sellerOrders.length} total
          </span>
        </div>

        {sellerOrders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">No orders yet. Sales will appear here once buyers purchase your listings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-hoverBg/30 text-xs uppercase font-semibold text-gray-400">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderBg/50">
                {sellerOrders.map((o) => {
                  const item = o.orderItems?.[0];
                  const buyerName = [o.buyer?.firstName, o.buyer?.lastName].filter(Boolean).join(' ') || 'Buyer';
                  return (
                    <tr key={o.id} className="hover:bg-hoverBg/20 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">#{o.orderNumber.slice(-8).toUpperCase()}</div>
                        <div className="text-xs text-gray-500 mt-0.5">${Number(o.totalAmount).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{buyerName}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white truncate max-w-[200px]" title={item?.listing?.title}>
                          {item?.listing?.title || 'Gaming Assets'}
                        </div>
                        <div className="text-xs text-brand-light font-semibold mt-0.5">{item?.listing?.gameName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          o.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : o.status === 'DISPUTED'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : o.status === 'IN_PROGRESS'
                            ? 'bg-brand/10 text-brand-light border-brand/30'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/messages?buyerId=${o.buyer.id}&sellerId=${user?.id}`}
                            className="text-brand hover:text-brand-light text-sm font-medium flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                          </Link>
                          {o.status === 'PAID' && (
                            <button
                              onClick={() => handleMarkDelivered(o.id)}
                              disabled={deliveringId === o.id}
                              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> {deliveringId === o.id ? '...' : 'Deliver'}
                            </button>
                          )}
                          <Link
                            href={`/orders/${o.id}`}
                            className="text-gray-400 hover:text-white text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Listings Table */}
      <div className="bg-cardBg border border-borderBg rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-borderBg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-white">Active Listings</h2>
          </div>
          <span className="text-xs text-gray-500 bg-hoverBg/50 px-3 py-1 rounded-full border border-borderBg">
            {listings.length} active
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-hoverBg/30 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white">No Active Listings</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Start selling by creating your first listing. We'll guide you through the process.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-xl font-bold transition text-white shadow-lg shadow-brand/20"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-hoverBg/30 text-xs uppercase font-semibold text-gray-400">
                <tr>
                  <th className="px-6 py-4">Listing</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Views</th>
                  <th className="px-6 py-4 text-center">Sales</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderBg/50">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-hoverBg/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white truncate max-w-xs" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">ID: {item.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-light">${Number(item.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : item.status === 'PENDING_APPROVAL'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {item.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                        {item.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">{item.viewCount}</td>
                    <td className="px-6 py-4 text-center font-semibold text-white">{item.salesCount}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/listings/${item.id}`} className="text-brand hover:text-brand-light text-sm font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {listings.length > 0 && (
          <div className="px-6 py-4 border-t border-borderBg bg-hoverBg/20">
            <Link href="/sell" className="text-sm text-brand hover:text-brand-light font-medium flex items-center gap-1">
              Create New Listing <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}