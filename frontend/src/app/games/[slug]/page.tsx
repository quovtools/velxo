import React from 'react';
import GameCatalogContent from './game-catalog-content';

export const dynamic = 'force-dynamic';

export default function GameCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  return <GameCatalogContent params={params} />;
}
