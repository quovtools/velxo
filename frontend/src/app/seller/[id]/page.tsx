import SellerProfileContent from './seller-profile-content';

export const dynamic = 'force-dynamic';

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerProfileContent id={id} />;
}
