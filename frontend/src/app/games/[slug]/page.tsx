import GameCatalogContent from './game-catalog-content';

export const dynamic = 'force-dynamic';

export default async function GameCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GameCatalogContent slug={slug} />;
}
