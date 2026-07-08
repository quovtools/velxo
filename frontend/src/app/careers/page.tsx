import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Zap, Globe, Users, Heart, Coffee, Award, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers at Velxo | Join the Team',
  description: 'We’re hiring remote engineers, community managers, moderators, and support specialists across Africa. Help build the future of African gaming commerce.',
  alternates: { canonical: 'https://market.velxo.shop/careers' },
  openGraph: {
    title: 'Careers at Velxo | Join the Team',
    description: 'Remote roles across Africa building safe gaming commerce.',
    url: 'https://market.velxo.shop/careers',
    type: 'website',
  },
};

const openRoles = [
  {
    title: 'Frontend Engineer',
    team: 'Engineering',
    type: 'Full-time · Remote',
    location: 'Africa',
    desc: 'Build and improve the Velxo marketplace UI using Next.js, TypeScript, and Tailwind CSS. You\'ll work on everything from listing pages to checkout and real-time messaging.',
  },
  {
    title: 'Backend Engineer',
    team: 'Engineering',
    type: 'Full-time · Remote',
    location: 'Africa',
    desc: 'Design and scale our NestJS API, Prisma database layer, and escrow engine. You\'ll own features like order management, payments, and dispute resolution.',
  },
  {
    title: 'Community Manager',
    team: 'Growth',
    type: 'Full-time · Remote',
    location: 'Nigeria / Ghana / Kenya',
    desc: 'Grow and engage Velxo\'s gamer community across WhatsApp, Discord, Twitter, and TikTok. Organize tournaments, referral campaigns, and seller onboarding drives.',
  },
  {
    title: 'Trust & Safety Moderator',
    team: 'Operations',
    type: 'Part-time · Remote',
    location: 'Africa',
    desc: 'Review disputes, investigate fraud cases, and make fair escrow release decisions. You\'ll be the last line of defense protecting buyers and sellers on the platform.',
  },
  {
    title: 'Growth & Partnerships Lead',
    team: 'Growth',
    type: 'Full-time · Remote',
    location: 'Nigeria',
    desc: 'Drive seller acquisition, influencer partnerships, and esports sponsorships. Own Velxo\'s affiliate and referral program strategy.',
  },
  {
    title: 'Customer Support Specialist',
    team: 'Support',
    type: 'Part-time · Remote',
    location: 'Africa',
    desc: 'Help buyers and sellers resolve issues quickly and professionally. You\'ll be the friendly voice of Velxo across email and live chat.',
  },
];

const perks = [
  { icon: <Globe className="w-5 h-5 text-brand" />, label: '100% Remote', desc: 'Work from anywhere in Africa' },
  { icon: <Zap className="w-5 h-5 text-brand" />, label: 'Fast-paced environment', desc: 'Ship features, not slides' },
  { icon: <Users className="w-5 h-5 text-brand" />, label: 'Small team, big impact', desc: 'Your work matters from day one' },
  { icon: <Heart className="w-5 h-5 text-brand" />, label: 'Gaming culture', desc: 'We actually play the games we serve' },
  { icon: <Coffee className="w-5 h-5 text-brand" />, label: 'Flexible hours', desc: 'Async-first work culture' },
  { icon: <Award className="w-5 h-5 text-brand" />, label: 'Equity opportunities', desc: 'Grow with the company' },
];

export default function CareersPage() {
  return (
    <div className="space-y-16 my-8">
      {/* Hero */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 text-brand-light text-xs font-bold">
          We&apos;re Hiring
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Build the future of <span className="text-brand">African gaming commerce</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Velxo is a small team solving a real problem for millions of African gamers. If you love gaming and want to build something that matters, we want to hear from you.
        </p>
      </div>

      {/* Perks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {perks.map((perk) => (
          <div key={perk.label} className="bg-cardBg border border-borderBg rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
              {perk.icon}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{perk.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{perk.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Open Roles */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-white">Open Positions</h2>
        <div className="space-y-4">
          {openRoles.map((role) => (
            <div
              key={role.title}
              className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-3 hover:border-brand/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{role.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs bg-brand/10 text-brand-light border border-brand/20 px-2.5 py-0.5 rounded-full font-semibold">
                      {role.team}
                    </span>
                    <span className="text-xs text-gray-500">{role.type}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {role.location}
                    </span>
                  </div>
                </div>
                <a
                  href={`mailto:careers@velxo.shop?subject=Application: ${role.title}`}
                  className="bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl font-bold transition text-white text-sm flex-shrink-0"
                >
                  Apply Now
                </a>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* General Application */}
      <div className="bg-cardBg border border-borderBg rounded-3xl p-10 text-center space-y-5">
        <h3 className="text-2xl font-extrabold text-white">Don&apos;t see your role?</h3>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          We&apos;re always looking for talented people who are passionate about gaming and building great products. Send us your profile and tell us how you&apos;d contribute.
        </p>
        <a
          href="mailto:careers@velxo.shop?subject=General Application"
          className="inline-block bg-brand hover:bg-brand-dark px-8 py-3.5 rounded-xl font-bold transition text-white"
        >
          Send Open Application
        </a>
        <p className="text-xs text-gray-600">careers@velxo.shop</p>
      </div>
    </div>
  );
}
