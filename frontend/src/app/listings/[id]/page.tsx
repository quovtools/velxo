import ListingDetailsContent from './listing-details-content';

export const dynamic = 'force-dynamic';

export default async function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetailsContent id={id} />;
}
