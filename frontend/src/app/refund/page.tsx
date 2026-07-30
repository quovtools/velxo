import type { Metadata } from 'next';
import LegalPageContent from '@/components/LegalPageContent';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'piyrox market refund and dispute resolution policy.',
};

export default function RefundPage() {
  return <LegalPageContent pageType="refund" fallbackTitle="Refund Policy" />;
}
