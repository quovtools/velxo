'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Flame, Search, Star, StarOff, Cpu, RotateCcw, RefreshCw,
  CheckCircle, AlertTriangle, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Badge, statusColor, Pagination, EmptyState, ErrorBanner,
  ActionButton, Modal, formatDate, formatMoney, FilterRow,
  Table, Tr, Td, PageHeader, RefreshButton, AdminInput,
  AdminSelect, Card,
} from '@/components/admin/ui';
import { LoadingArea } from '@/components/LoadingLogo';

interface FeaturedListing {
  id: string;
  title: string;
  gameName: string;
  price: number;
  currency: string;
  status: string;
  isFeatured: boolean;
  featuredByAlgo: boolean;
  featuredAt?: string;
  createdAt: string;
  images?: string[];
  seller?: { storeName: string; averageRating: number; isVerified: boolean };
}

interface AlgoResult {
  selected: number;
  cleared: number;
  ids: string[];
}

export default function AdminFeaturedListingsPage() {
  const [items, setItems]           = useState<FeaturedListing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [search, setSearch]         = useState('');
  const [game, setGame]             = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [busy, setBusy]             = useState<string | null>(null);
  const [algoRunning, setAlgoRunning] = useState(false);
  const [algoResult, setAlgoResult]   = useState<AlgoResult | null>(null);
  const [algoModal, setAlgoModal]     = useState(false);
  const [algoLimit, setAlgoLimit]     = useState(8);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: any = { page, limit: LIMIT };
      if (search) params.search = search;
      if (game)   params.game   = game;
      if (featuredOnly) params.featuredOnly = 'true';
      const res: any = await api.get('/admin/featured-listings', { params });
      setItems(res.data || []);
      const meta = res.meta ?? {};
      setTotal(meta.total ?? (res.data?.length ?? 0));
      setTotalPages(meta.totalPages ?? 1);
    } catch (e: any) { setError(e.message || 'Failed to load listings'); }
    finally { setLoading(false); }
  }, [search, game, featuredOnly, page]);

  useEffect(() => { load(); }, [load]);

  const toggleFeatured = async (id: string, current: boolean) => {
    setBusy(id); setError(''); setSuccess('');
    try {
      await api.patch(`/admin/featured-listings/${id}/toggle`, { featured: !current });
      setItems(prev => prev.map(l => l.id === id ? { ...l, isFeatured: !current, featuredByAlgo: false } : l));
      setSuccess(`Listing ${!current ? 'featured' : 'unfeatured'} successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message || 'Action failed'); }
    finally { setBusy(null); }
  };

  const runAlgo = async () => {
    setAlgoRunning(true); setError(''); setSuccess('');
    try {
      const res: any = await api.post('/admin/featured-listings/run-algo', { limit: algoLimit });
      setAlgoResult(res.data ?? res);
      setAlgoModal(false);
      await load();
      setSuccess(`Algorithm complete: ${res.data?.selected ?? 0} listings featured, ${res.data?.cleared ?? 0} cleared.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) { setError(e.message || 'Algorithm failed'); }
    finally { setAlgoRunning(false); }
  };

  const featuredCount = items.filter(l => l.isFeatured).length;
  const algoCount     = items.filter(l => l.featuredByAlgo).length;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Flame}
        title="Featured Listings"
        subtitle="Manually feature listings or run the algorithmic selection."
        action={
          <div className="flex gap-2">
            <ActionButton variant="brand" onClick={() => setAlgoModal(true)}>
              <Cpu className="w-3.5 h-3.5" /> Run Algorithm
            </ActionButton>
            <RefreshButton onClick={load} loading={loading} />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total active',   value: total,        color: 'text-white' },
          { label: 'Featured',       value: featuredCount, color: 'text-orange-400' },
          { label: 'Algo-selected',  value: algoCount,     color: 'text-violet-400' },
          { label: 'Manual',         value: featuredCount - algoCount, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Success / error */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}
      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Filters */}
      <FilterRow>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <AdminInput value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title or game…" className="pl-8" />
        </div>
        <AdminInput value={game} onChange={e => { setGame(e.target.value); setPage(1); }}
          placeholder="Game filter…" className="w-36" />
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none whitespace-nowrap">
          <input type="checkbox" checked={featuredOnly} onChange={e => { setFeaturedOnly(e.target.checked); setPage(1); }}
            className="rounded border-white/20 bg-white/5 accent-violet-500 w-4 h-4" />
          Featured only
        </label>
      </FilterRow>

      {loading ? <LoadingArea label="Loading listings…" /> : items.length === 0 ? (
        <EmptyState icon={Flame} title="No listings found" />
      ) : (
        <Table headers={['Listing', 'Game', 'Price', 'Seller', 'Featured', 'Method', 'Actions']}>
          {items.map(l => (
            <Tr key={l.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  {l.images?.[0]
                    ? <img src={l.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-gray-600">
                        <Flame className="w-4 h-4" />
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate max-w-[180px]">{l.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(l.createdAt)}</p>
                  </div>
                </div>
              </Td>
              <Td><span className="text-xs">{l.gameName}</span></Td>
              <Td><span className="text-white text-sm font-medium">{formatMoney(l.price, l.currency)}</span></Td>
              <Td>
                <p className="text-xs text-gray-300 truncate max-w-[120px]">{l.seller?.storeName || '—'}</p>
                {l.seller?.averageRating > 0 && (
                  <p className="text-[10px] text-yellow-400 mt-0.5">★ {l.seller.averageRating.toFixed(1)}</p>
                )}
              </Td>
              <Td>
                {l.isFeatured
                  ? <Badge color="orange">
                      <Star className="w-2.5 h-2.5 mr-0.5 inline" /> Featured
                    </Badge>
                  : <Badge color="gray">—</Badge>
                }
              </Td>
              <Td>
                {l.isFeatured
                  ? <Badge color={l.featuredByAlgo ? 'violet' : 'green'}>
                      {l.featuredByAlgo ? 'Algorithm' : 'Manual'}
                    </Badge>
                  : <span className="text-gray-600 text-xs">—</span>
                }
                {l.featuredAt && <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(l.featuredAt)}</p>}
              </Td>
              <Td right>
                <ActionButton
                  variant={l.isFeatured ? 'warning' : 'default'}
                  loading={busy === l.id}
                  onClick={() => toggleFeatured(l.id, l.isFeatured)}
                  title={l.isFeatured ? 'Remove from featured' : 'Add to featured'}
                >
                  {l.isFeatured
                    ? <><StarOff className="w-3 h-3" /> Unfeature</>
                    : <><Star className="w-3 h-3" /> Feature</>
                  }
                </ActionButton>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Algorithm modal */}
      <Modal open={algoModal} onClose={() => setAlgoModal(false)} title="Run Algorithmic Featured Selection">
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3.5 py-3">
            <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-violet-200 space-y-1">
              <p className="font-semibold">How it works</p>
              <p>Scores all ACTIVE listings using seller rating (40%), delivery success rate (20%), recent sales (20%), and competitive pricing (20%).</p>
              <p className="text-violet-400">Previously algo-featured listings are cleared, then the top N are selected. Manually featured listings are unaffected.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Number of listings to feature
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={4} max={16} step={2}
                value={algoLimit}
                onChange={e => setAlgoLimit(parseInt(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="text-white font-bold text-lg w-8 text-center">{algoLimit}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Recommended: 8 listings for desktop 4-column grid.</p>
          </div>

          {algoResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5">
              <p className="text-xs text-emerald-400 font-semibold">Last run result</p>
              <p className="text-xs text-emerald-300 mt-0.5">{algoResult.selected} selected · {algoResult.cleared} cleared</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <ActionButton variant="brand" loading={algoRunning} onClick={runAlgo}>
              <Cpu className="w-3.5 h-3.5" /> {algoRunning ? 'Running…' : 'Run Now'}
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setAlgoModal(false)}>Cancel</ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
