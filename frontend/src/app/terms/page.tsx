import type { Metadata } from 'next';
import LegalPageContent from '@/components/LegalPageContent';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Velxo Market Terms of Service — your rights and responsibilities when using the platform.',
};

export default function TermsPage() {
  return <LegalPageContent pageType="terms" fallbackTitle="Terms of Service" />;
}
