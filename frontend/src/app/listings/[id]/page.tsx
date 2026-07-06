import React from 'react';
import ListingDetailsContent from './listing-details-content';

export const dynamic = 'force-dynamic';

export default function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetailsContent params={params} />;
}
