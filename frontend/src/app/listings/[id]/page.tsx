'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Shield, Sparkles, UserCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '@/app/providers';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  gameName: string;
  platform: string;
  region: string;
  rank: string;
  level: number;
  loginMethod: string;
  deliveryTime: number;
  images: string[];
  seller: {
    userId: string;
    storeName: string;
    averageRating: number;
    totalSales: number;
    isVerified: boolean;
  };
  listingReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    buyer: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/listings/${id}`);
        if (!response.ok) throw new Error('Listing not found');
        const result = await response.json();
        setListing(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 space-y-8 animate-pulse">
        <div className="h-96 bg-cardBg rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-40 bg-cardBg rounded-2xl"></div>
          <div className="h-40 bg-cardBg rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-20 bg-cardBg border border-borderBg rounded-2xl">
        <p className="text-red-400 text-lg font-semibold">{error || 'Listing not found'}</p>
        <Link href="/" className="text-brand hover:underline mt-4 inline-block font-semibold">
          Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upper breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition">Home</Link> &gt;{' '}
        <Link href={`/games/${listing.gameName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-white transition">
          {listing.gameName}
        </Link> &gt;{' '}
        <span className="text-gray-300">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details and Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 md:p-8 space-y-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {listing.title}
            </h1>

            {/* Tags row */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-brand/10 text-brand-light text-xs font-bold px-3 py-1.5 rounded-full border border-brand/20">
                {listing.gameName}
              </span>
              {listing.platform && (
                <span className="bg-cyan-900/20 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-500/20">
                  {listing.platform}
                </span>
              )}
              {listing.region && (
                <span className="bg-emerald-950/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/20">
                  {listing.region}
                </span>
              )}
            </div>

            {/* Images mockup / container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-background border border-borderBg flex items-center justify-center">
              {listing.images && listing.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.images[0]}
                  alt="Listing image"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Sparkles className="w-16 h-16 mx-auto text-brand/20 mb-3" />
                  <p>No preview screenshot supplied by seller</p>
                </div>
              )}
            </div>

            {/* Game metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-background border border-borderBg rounded-2xl p-6 text-sm">
              <div>
                <p className="text-gray-500">Rank</p>
                <p className="text-white font-bold mt-0.5">{listing.rank || 'Unranked'}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Level</p>
                <p className="text-white font-bold mt-0.5">{listing.level || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Login Method</p>
                <p className="text-white font-bold mt-0.5">{listing.loginMethod || 'Escrow Transferred'}</p>
              </div>
              <div>
                <p className="text-gray-500">Delivery Time</p>
                <p className="text-white font-bold mt-0.5">{listing.deliveryTime ? `${listing.deliveryTime} mins` : 'Instant'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Item Description</h3>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Seller Ratings / Reviews list */}
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Seller Feedbacks</h3>
            {listing.listingReviews && listing.listingReviews.length > 0 ? (
              <div className="space-y-4">
                {listing.listingReviews.map((review) => (
                  <div key={review.id} className="border-b border-borderBg pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-200">
                        {review.buyer?.firstName} {review.buyer?.lastName}
                      </span>
                      <span className="text-brand-light font-bold">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="text-sm text-gray-400">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews yet for this seller listing.</p>
            )}
          </div>
        </div>

        {/* Pricing / Checkout card */}
        <div className="space-y-6">
          <div className="bg-cardBg border border-borderBg rounded-3xl p-6 md:p-8 space-y-6 sticky top-24">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Checkout Price</p>
              <h2 className="text-4xl font-black text-white mt-1">
                ${Number(listing.price).toFixed(2)}
              </h2>
            </div>

            <div className="space-y-4 border-t border-borderBg pt-6 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-brand" />
                <span>Secure Escrow Protection</span>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-brand" />
                <span>Verified Gaming Merchant</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/checkout/${listing.id}`}
                className="block text-center w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold transition shadow-lg shadow-brand/20 text-white text-base"
              >
                Buy Now
              </Link>
              
              {user && user.id !== listing.seller?.userId && (
                <Link
                  href={`/messages?userId=${listing.seller?.userId}`}
                  className="flex items-center justify-center gap-2 w-full bg-background border border-borderBg hover:border-brand/40 py-4 rounded-xl font-bold transition text-gray-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with Seller
                </Link>
              )}
            </div>

            {/* Seller profile overview inside card */}
            <div className="border-t border-borderBg pt-6 space-y-3 text-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">About Merchant</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">{listing.seller?.storeName}</span>
                {listing.seller?.isVerified && (
                  <span className="text-xs bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Rating: {listing.seller?.averageRating?.toFixed(1) || '0.0'} ★</span>
                <span>Sales: {listing.seller?.totalSales || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
