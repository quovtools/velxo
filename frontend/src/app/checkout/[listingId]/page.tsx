import React from 'react';
import CheckoutContent from './checkout-content';

export const dynamic = 'force-dynamic';

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  return <CheckoutContent params={params} />;
}
