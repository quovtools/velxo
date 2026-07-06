import React from 'react';
import OrderTrackingContent from './order-tracking-content';

export const dynamic = 'force-dynamic';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderTrackingContent params={params} />;
}
