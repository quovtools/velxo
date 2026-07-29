'use client';

import React from 'react';
import { getGameConfig } from '@/lib/games';

export default function GameListingTemplate({ listing }: { listing: any }) {
  const cfg = getGameConfig(listing.gameName || '')
  if (!cfg) return null

  return (
    <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
      <h3 className="font-bold">About this {listing.gameName} listing</h3>
      <div className="text-sm text-gray-300">
        <p>Game: <strong className="text-white">{cfg.name}</strong> • Genre: {cfg.genre}</p>
        {cfg.currency && <p>Currency: <strong className="text-white">{cfg.currency.plural}</strong></p>}
        {cfg.accountFields?.battlePass && <p>Pass: <strong className="text-white">{cfg.accountFields.battlePass}</strong></p>}
        {cfg.accountFields?.extras?.length > 0 && (
          <div>
            <p className="mt-2">Common extras sellers list for this game:</p>
            <ul className="list-disc ml-5 text-gray-400 mt-1">
              {cfg.accountFields.extras.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}
        {cfg.ranks?.length > 0 && (
          <p className="mt-2">Ranks: <span className="text-gray-400">{cfg.ranks.slice(0,6).join(', ')}{cfg.ranks.length > 6 ? ', ...' : ''}</span></p>
        )}
      </div>
    </div>
  )
}
