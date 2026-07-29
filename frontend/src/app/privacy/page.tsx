import type { Metadata } from 'next';
import LegalPageContent from '@/components/LegalPageContent';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Velxo Market collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  return <LegalPageContent pageType="privacy" fallbackTitle="Privacy Policy" />;
}
