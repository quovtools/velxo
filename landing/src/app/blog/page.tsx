import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Clock, User } from 'lucide-react';

const POSTS = [
  {
    slug: 'how-escrow-protects-you',
    title: 'How Velxo Escrow Protects Every Gaming Trade',
    excerpt: 'Learn exactly how our escrow system works and why it makes Velxo the safest place to buy and sell gaming assets in Africa.',
    category: 'Platform',
    date: 'July 1, 2025',
    readTime: '5 min read',
    author: 'Velxo Team',
    featured: true,
  },
  {
    slug: 'top-5-games-to-sell-in-africa',
    title: 'Top 5 Games to Sell on Velxo Right Now',
    excerpt: 'Free Fire, PUBG Mobile, COD Mobile — these are the hottest games on the marketplace. Here\'s what sellers are making.',
    category: 'Sellers',
    date: 'June 25, 2025',
    readTime: '4 min read',
    author: 'Velxo Team',
    featured: true,
  },
  {
    slug: 'avoid-gaming-scams-africa',
    title: '7 Red Flags That Mean You\'re About to Get Scammed',
    excerpt: 'Telegram groups, Discord servers, WhatsApp traders — scammers are everywhere. Here\'s how to spot them before it\'s too late.',
    category: 'Safety',
    date: 'June 18, 2025',
    readTime: '6 min read',
    author: 'Velxo Team',
    featured: false,
  },
  {
    slug: 'how-to-sell-free-fire-account',
    title: 'How to Sell Your Free Fire Account Safely in 2025',
    excerpt: 'Step-by-step guide to listing, pricing, and completing a Free Fire account sale on Velxo with full escrow protection.',
    category: 'Guides',
    date: 'June 12, 2025',
    readTime: '7 min read',
    author: 'Velxo Team',
    featured: false,
  },
  {
    slug: 'velxo-payment-methods-africa',
    title: 'Every Payment Method Supported on Velxo',
    excerpt: 'Paystack, Flutterwave, mobile money, crypto — here\'s the full breakdown of how to pay and withdraw on Velxo.',
    category: 'Platform',
    date: 'June 5, 2025',
    readTime: '3 min read',
    author: 'Velxo Team',
    featured: false,
  },
  {
    slug: 'build-a-gaming-store-velxo',
    title: 'How to Build a Full-Time Income Selling Gaming Assets',
    excerpt: 'Some sellers on Velxo earn $500–$2,000 per month. Here\'s exactly how they do it and how you can too.',
    category: 'Sellers',
    date: 'May 28, 2025',
    readTime: '8 min read',
    author: 'Velxo Team',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Platform', 'Sellers', 'Safety', 'Guides'];

const CATEGORY_COLORS: Record<string, string> = {
  Platform: 'bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20',
  Sellers: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Safety: 'bg-red-500/10 text-red-400 border-red-500/20',
  Guides: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20',
};

export default function BlogPage() {
  const featured = POSTS.filter((p) => p.featured);
  const rest = POSTS.filter((p) => !p.featured);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0b0f19] pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          {/* Header */}
          <div className="text-center space-y-4">
            <span className="inline-block text-xs font-bold text-[#A78BFA] uppercase tracking-widest bg-[#8B5CF6]/10 px-4 py-2 rounded-full border border-[#8B5CF6]/20">
              Velxo Blog
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              Insights, guides &amp;{' '}
              <span className="text-gradient">gaming news</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Tips for buyers, guides for sellers, platform updates, and everything you need to trade smarter.
            </p>
          </div>

          {/* Featured posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((post) => (
              <article
                key={post.slug}
                className="bg-[#111827] border border-[#1F2937] hover:border-[#8B5CF6]/30 rounded-3xl p-8 transition-all duration-300 card-glow group cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-[#A78BFA] transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#1F2937]">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3" /> {post.author} · {post.date}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#A78BFA] group-hover:gap-2 transition-all">
                      Read more <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* All posts */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">All Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {rest.map((post) => (
                <article
                  key={post.slug}
                  className="bg-[#111827] border border-[#1F2937] hover:border-[#8B5CF6]/30 rounded-2xl p-6 transition-all duration-300 card-glow group cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-600">{post.readTime}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-[#A78BFA] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <p className="text-xs text-gray-700">{post.date}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="bg-[#111827] border border-[#8B5CF6]/20 rounded-3xl p-10 text-center space-y-5">
            <h3 className="text-2xl font-black text-white">Stay in the loop</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Get new posts, platform updates, and seller tips delivered to your inbox. No spam.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-[#0b0f19] border border-[#1F2937] focus:border-[#8B5CF6] rounded-xl px-4 py-3 text-white text-sm outline-none transition"
              />
              <button className="bg-[#8B5CF6] hover:bg-[#6D28D9] text-white font-bold px-6 py-3 rounded-xl text-sm transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
