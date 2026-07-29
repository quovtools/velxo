'use client';
import React, { useState } from 'react';
import { Calculator, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const GAMES = [
  { id: 'free-fire', name: 'Free Fire', tag: 'Battle Royale', baseValue: 25 },
  { id: 'cod-mobile', name: 'COD Mobile', tag: 'FPS Shooter', baseValue: 30 },
  { id: 'pubg-mobile', name: 'PUBG Mobile', tag: 'Battle Royale', baseValue: 35 },
  { id: 'blood-strike', name: 'Blood Strike', tag: 'FPS Shooter', baseValue: 20 },
  { id: 'delta-force', name: 'Delta Force', tag: 'Tactical', baseValue: 25 },
  { id: 'valorant', name: 'Valorant', tag: 'Tactical FPS', baseValue: 40 },
  { id: 'roblox', name: 'Roblox', tag: 'Sandbox', baseValue: 15 },
  { id: 'mobile-legends', name: 'Mobile Legends', tag: 'MOBA', baseValue: 20 },
  { id: 'efootball', name: 'eFootball', tag: 'Sports', baseValue: 20 },
];

const RANKS: Record<string, number> = {
  'Bronze': 0.5,
  'Silver': 0.7,
  'Gold': 1.0,
  'Platinum': 1.5,
  'Diamond': 2.0,
  'Heroic': 2.5,
  'Mythic': 3.0,
  'Grandmaster': 3.5,
  'Challenger': 4.0,
  'Immortal': 4.5,
  'Radiant': 5.0,
};

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.velxo.shop/api/v1';

export default function AccountValueCheck() {
  const [game, setGame] = useState('');
  const [rank, setRank] = useState('');
  const [level, setLevel] = useState('');
  const [skins, setSkins] = useState('');
  const [platform, setPlatform] = useState('mobile');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ estimated: number; range: [number, number] } | null>(null);
  const [error, setError] = useState('');

  const estimateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API}/listings/estimate-value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game,
          rank: rank || 'Gold',
          level: parseInt(level) || 50,
          skins: parseInt(skins) || 0,
          platform,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
      } else {
        setError('Could not estimate value. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedGame = GAMES.find((g) => g.id === game);

  return (
    <section id="account-value" aria-labelledby="value-heading" className="section container-x">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <span className="eyebrow">Free Tool</span>
        <h2 id="value-heading" className="heading-xl">
          Check your account&apos;s{' '}
          <span className="text-gradient">market value</span>
        </h2>
        <p className="text-lg text-gray-400">
          Get an instant estimate for your game account. No sign-up required.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <form onSubmit={estimateValue} className="card-surface space-y-6 p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="game" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Game
              </label>
              <select
                id="game"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
              >
                <option value="">Select a game</option>
                {GAMES.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} — {g.tag}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rank" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Rank
              </label>
              <select
                id="rank"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
              >
                <option value="">Select rank</option>
                {Object.keys(RANKS).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="level" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Level
              </label>
              <input
                id="level"
                type="number"
                min="1"
                max="500"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="skins" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Rare Skins / Items
              </label>
              <input
                id="skins"
                type="number"
                min="0"
                value={skins}
                onChange={(e) => setSkins(e.target.value)}
                placeholder="e.g. 15"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="platform" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
              >
                <option value="mobile">Mobile</option>
                <option value="pc">PC</option>
                <option value="console">Console</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Estimate Value
              </>
            )}
          </button>

          {result && (
            <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-accent-emerald">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Estimated Value</span>
              </div>
              <p className="mt-2 text-4xl font-black text-white">${result.estimated.toFixed(2)}</p>
              <p className="mt-1 text-xs text-gray-400">
                Range: ${result.range[0].toFixed(2)} — ${result.range[1].toFixed(2)}
              </p>
              {selectedGame && (
                <p className="mt-2 text-xs text-gray-500">
                  Based on {selectedGame.name} · {rank || 'Gold'} · Level {level || '50'} · {skins || '0'} rare items
                </p>
              )}
              <a
                href="https://market.velxo.shop/auth/register"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-light transition hover:text-white"
              >
                Sell on Velxo <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
