'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Check, X, AlertCircle, Trash2, Star, Eye, Filter, Download, Upload, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  isFeatured: boolean;
  isSponsored: boolean;
  seller?: { user?: { name: string } };
  images?: string[];
  gameName?: string;
  region?: string;
  platform?: string;
  createdAt: string;
}

interface FilterOptions {
  status?: string;
  gameName?: string;
  categoryId?: string;
  sellerId?: string;
  isFeatured?: boolean;
}

export default function ListingsManagerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Filter & Search
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk action inputs
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Load listings
  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.gameName) params.append('game', filters.gameName);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await api.get<{ data: Listing[]; message?: string }>(`/admin/listings?${params.toString()}`);
      setListings(res.data || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
      alert('Error loading listings');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  // Select all
  const toggleSelectAll = useCallback(() => {
    if (selected.size === listings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listings.map(l => l.id)));
    }
  }, [listings, selected.size]);

  // Execute bulk action
  const executeBulkAction = async (action: string) => {
    if (selected.size === 0) {
      alert('Please select at least one listing');
      return;
    }

    // Actions that require reason
    if (['reject', 'suspend'].includes(action) && !reason) {
      setShowReasonInput(true);
      setPendingAction(action);
      return;
    }

    setActionInProgress(true);
    try {
      const listingIds = Array.from(selected);
      let res: { message?: string } | undefined;

      switch (action) {
        case 'approve':
          res = await api.post<{ message?: string }>('/admin/bulk/listings/approve', { listingIds, reason });
          break;
        case 'reject':
          res = await api.post<{ message?: string }>('/admin/bulk/listings/reject', { listingIds, reason });
          break;
        case 'suspend':
          res = await api.patch<{ message?: string }>('/admin/bulk/listings/suspend', { listingIds, reason });
          break;
        case 'unsuspend':
          res = await api.patch<{ message?: string }>('/admin/bulk/listings/unsuspend', { listingIds });
          break;
        case 'feature':
          res = await api.patch<{ message?: string }>('/admin/bulk/listings/feature', { listingIds, isFeatured: true });
          break;
        case 'unfeature':
          res = await api.patch<{ message?: string }>('/admin/bulk/listings/feature', { listingIds, isFeatured: false });
          break;
        case 'sponsor':
          res = await api.patch<{ message?: string }>('/admin/bulk/listings/sponsor', { listingIds, isSponsored: true });
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${listingIds.length} listings? This cannot be undone.`)) {
            setActionInProgress(false);
            return;
          }
          res = await api.delete<{ message?: string }>('/admin/bulk/listings/delete', { data: { listingIds } } as any);
          break;
        default:
          alert('Unknown action');
          setActionInProgress(false);
          return;
      }

      alert(res?.message || 'Action completed successfully');
      setSelected(new Set());
      setReason('');
      setShowReasonInput(false);
      setPendingAction(null);
      loadListings(); // Refresh
    } catch (err: any) {
      console.error('Bulk action error:', err);
      alert(err?.response?.data?.message || 'Error performing bulk action');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle reason submission
  const submitWithReason = () => {
    if (!reason.trim()) {
      alert('Please enter a reason');
      return;
    }
    if (pendingAction) {
      executeBulkAction(pendingAction);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-600/30 text-green-300',
      PENDING_APPROVAL: 'bg-yellow-600/30 text-yellow-300',
      DRAFT: 'bg-gray-600/30 text-gray-300',
      REJECTED: 'bg-red-600/30 text-red-300',
      SUSPENDED: 'bg-orange-600/30 text-orange-300',
      SOLD: 'bg-blue-600/30 text-blue-300',
    };
    return colors[status] || 'bg-gray-600/30 text-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Listings Manager</h1>
          <p className="text-gray-400">Bulk manage, edit, and update listings with ease</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-cardBg border border-borderBg rounded-lg text-white hover:bg-background"
          >
            <Filter size={18} /> Filters
          </button>
          <button
            onClick={loadListings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-cardBg border border-borderBg rounded-lg text-white hover:bg-background disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-cardBg border border-borderBg rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="w-full bg-background border border-borderBg rounded-lg px-3 py-2 text-white"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
                <option value="DRAFT">Draft</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, seller..."
                className="w-full bg-background border border-borderBg rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Game</label>
              <input
                type="text"
                value={filters.gameName || ''}
                onChange={(e) => setFilters({ ...filters, gameName: e.target.value || undefined })}
                placeholder="e.g., Free Fire"
                className="w-full bg-background border border-borderBg rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadListings}
              className="px-4 py-2 bg-brand hover:bg-brand-dark rounded-lg text-white font-semibold"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({});
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selected.size > 0 && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold">
              {selected.size} listing{selected.size !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear Selection
            </button>
          </div>

          {showReasonInput && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Reason (required for reject/suspend)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={3}
                className="w-full bg-background border border-borderBg rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitWithReason}
                  disabled={!reason.trim() || actionInProgress}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setPendingAction(null);
                    setReason('');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showReasonInput && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => executeBulkAction('approve')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <Check size={18} /> Approve
              </button>
              
              <button
                onClick={() => executeBulkAction('reject')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <X size={18} /> Reject
              </button>
              
              <button
                onClick={() => executeBulkAction('suspend')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <AlertCircle size={18} /> Suspend
              </button>

              <button
                onClick={() => executeBulkAction('unsuspend')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <RefreshCw size={18} /> Unsuspend
              </button>
              
              <button
                onClick={() => executeBulkAction('feature')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <Star size={18} /> Feature
              </button>

              <button
                onClick={() => executeBulkAction('unfeature')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <Star size={18} /> Unfeature
              </button>
              
              <button
                onClick={() => executeBulkAction('delete')}
                disabled={actionInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 rounded-lg disabled:opacity-50 text-white font-semibold"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-cardBg border border-borderBg rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No listings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-borderBg">
                <tr>
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selected.size === listings.length && listings.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded cursor-pointer"
                    />
                  </th>
                  <th className="p-4 text-left text-white font-semibold">Image</th>
                  <th className="p-4 text-left text-white font-semibold">Title</th>
                  <th className="p-4 text-left text-white font-semibold">Game</th>
                  <th className="p-4 text-left text-white font-semibold">Price</th>
                  <th className="p-4 text-left text-white font-semibold">Status</th>
                  <th className="p-4 text-left text-white font-semibold">Seller</th>
                  <th className="p-4 text-left text-white font-semibold">Badges</th>
                  <th className="p-4 text-left text-white font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderBg">
                {listings.map(listing => (
                  <tr key={listing.id} className="hover:bg-background/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.has(listing.id)}
                        onChange={() => toggleSelection(listing.id)}
                        className="rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                          <Eye size={20} className="text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-white max-w-xs truncate">{listing.title}</td>
                    <td className="p-4 text-gray-300">{listing.gameName || '—'}</td>
                    <td className="p-4 text-gray-300">${listing.price}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(listing.status)}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{listing.seller?.user?.name || '—'}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {listing.isFeatured && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-600/30 text-purple-300">
                            Featured
                          </span>
                        )}
                        {listing.isSponsored && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-pink-600/30 text-pink-300">
                            Sponsored
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-center text-gray-400 text-sm">
        Showing {listings.length} listing{listings.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
