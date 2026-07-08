import CheckoutContent from './checkout-content';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return <CheckoutContent listingId={listingId} />;
}
