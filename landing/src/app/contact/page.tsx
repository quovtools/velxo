import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, MessageCircle, Twitter, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Velxo — general enquiries, live chat support, safety reporting, press, and partnerships. We reply within 24 hours, 7 days a week.",
  keywords: ["contact velxo", "velxo support", "gaming marketplace support", "report scam"],
  alternates: { canonical: "https://velxo.shop/contact" },
  openGraph: {
    title: "Contact Us — Velxo",
    description: "Reach the right Velxo team for fast help.",
    url: "https://velxo.shop/contact",
    siteName: "Velxo",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Contact Velxo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us — Velxo",
    description: "Reach the right Velxo team for fast help.",
    images: ["/og.png"],
  },
};

const CONTACT_OPTIONS = [
  {
    icon: <Mail className="w-6 h-6 text-brand" />,
    title: 'General Enquiries',
    desc: 'For general questions about Velxo, partnerships, or anything else.',
    value: 'hello@velxo.shop',
    href: 'mailto:hello@velxo.shop',
    cta: 'Send Email',
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-[#5865F2]" />,
    title: 'Live Chat Support',
    desc: 'For marketplace support, order issues, and dispute help — fastest response.',
    value: 'market.velxo.shop/support',
    href: 'https://market.velxo.shop/support',
    cta: 'Open Chat',
  },
  {
    icon: <Mail className="w-6 h-6 text-red-400" />,
    title: 'Safety & Trust',
    desc: 'Report fraud, scams, policy violations, or safety concerns.',
    value: 'safety@velxo.shop',
    href: 'mailto:safety@velxo.shop',
    cta: 'Report Issue',
  },
  {
    icon: <Mail className="w-6 h-6 text-yellow-400" />,
    title: 'Press & Media',
    desc: 'For interviews, coverage, and media requests.',
    value: 'press@velxo.shop',
    href: 'mailto:press@velxo.shop',
    cta: 'Send Press Enquiry',
  },
  {
    icon: <Mail className="w-6 h-6 text-emerald-400" />,
    title: 'Partnerships',
    desc: 'Esports sponsorships, brand deals, and platform integrations.',
    value: 'partners@velxo.shop',
    href: 'mailto:partners@velxo.shop',
    cta: 'Partner with Us',
  },
  {
    icon: <Mail className="w-6 h-6 text-brand-light" />,
    title: 'Affiliate Program',
    desc: 'Join our affiliate program or get help with your referral account.',
    value: 'affiliates@velxo.shop',
    href: 'mailto:affiliates@velxo.shop',
    cta: 'Join Affiliates',
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          {/* Header */}
          <div className="text-center space-y-4">
            <span className="inline-block text-xs font-bold text-brand-light uppercase tracking-widest bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
              Contact Us
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              We&apos;re here to{' '}
              <span className="text-gradient">help</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Whether you&apos;re a buyer, seller, partner, or journalist — reach out through the right channel below for the fastest response.
            </p>
          </div>

          {/* Response time notice */}
          <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-5 py-3.5 max-w-xl mx-auto">
            <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">We aim to respond to all enquiries within <strong>24 hours</strong>, 7 days a week.</p>
          </div>

          {/* Contact grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CONTACT_OPTIONS.map((opt) => (
              <div key={opt.title} className="bg-surface border border-border hover:border-brand/30 rounded-2xl p-6 space-y-4 transition card-glow">
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                  {opt.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{opt.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-2">{opt.desc}</p>
                  <p className="text-xs text-brand-light font-mono">{opt.value}</p>
                </div>
                <a href={opt.href} className="inline-block text-xs font-bold bg-background border border-border hover:border-brand/40 hover:text-white text-gray-300 px-4 py-2 rounded-lg transition">
                  {opt.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Social quick links */}
          <div className="bg-surface border border-border rounded-2xl p-8 space-y-5">
            <h3 className="font-black text-white text-lg text-center">Find us on social media</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: <Twitter className="w-4 h-4" />, label: 'Twitter / X', href: 'https://twitter.com/velxoshop' },
                { icon: <MessageCircle className="w-4 h-4" />, label: 'Discord', href: 'https://discord.gg/velxo' },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-background border border-border hover:border-brand/40 text-gray-400 hover:text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* HQ note */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>Velxo is a remote-first company operating across Africa</span>
            </div>
            <p className="text-xs text-gray-500">Registered in Nigeria · Serving 20+ African countries</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
