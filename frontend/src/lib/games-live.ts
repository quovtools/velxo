'use client';

// Live game info bridge.
//
// The canonical game data lives on the backend (GET /games) and is mirrored
// statically in lib/games.ts so the UI can render before the network resolves.
// This hook fetches the live config once, merges it over the static defaults,
// and exposes it to forms (sell / boosting / gigs) so a user posting a listing
// always sees the current ranks, currency, login methods, platforms and
// playerId/rank requirements for the selected game.

import { useEffect, useState } from 'react';
import { api } from './api';
import { GAME_CONFIG, GameConfig } from './games';

export interface LiveGameConfig extends GameConfig {
  requiresPlayerId?: boolean;
  requiresRank?: boolean;
  baseValue?: number;
}

type LiveGameMap = Record<string, LiveGameConfig>;

// Module-level cache so every component shares one fetch per page load.
let cache: LiveGameMap | null = null;
let inflight: Promise<LiveGameMap> | null = null;

function seedFromStatic(): LiveGameMap {
  const map: LiveGameMap = {};
  for (const g of Object.values(GAME_CONFIG)) {
    map[g.name] = {
      ...g,
      requiresPlayerId: g.accountFields.playerId,
      requiresRank: g.hasRanked && g.accountFields.rank,
    };
    // Also index by slug so lookups by either key work.
    map[g.slug] = map[g.name];
  }
  return map;
}

async function loadLiveGames(): Promise<LiveGameMap> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const base = seedFromStatic();
    try {
      const res = await api.get<{ success: boolean; data: LiveGameConfig[] }>('/games');
      const list = (res as any)?.data;
      if (Array.isArray(list)) {
        for (const g of list) {
          if (!g?.name) continue;
          base[g.name] = g;
          if (g.slug) base[g.slug] = g;
        }
      }
    } catch {
      // Backend unreachable — keep the static seed so the UI still works.
    }
    cache = base;
    inflight = null;
    return base;
  })();
  return inflight;
}

/**
 * Returns the live game map (name/slug -> config) plus helpers. Falls back to
 * the static config immediately, then upgrades in place when /games resolves.
 */
export function useLiveGames() {
  const [games, setGames] = useState<LiveGameMap>(() => cache ?? seedFromStatic());
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;
    loadLiveGames().then((map) => {
      if (mounted) {
        setGames(map);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getGame = (nameOrSlug?: string | null): LiveGameConfig | undefined => {
    if (!nameOrSlug) return undefined;
    return games[nameOrSlug] ?? games[nameOrSlug.trim()];
  };

  return { games, getGame, loading };
}
