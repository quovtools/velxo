import OrderCheckoutContent from './order-checkout-content';

export const dynamic = 'force-dynamic';

export default async function OrderCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderCheckoutContent orderId={id} />;
}
