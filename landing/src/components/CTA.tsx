import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative bg-gradient-to-br from-[#8B5CF6]/20 via-[#111827] to-[#06B6D4]/10 border border-[#8B5CF6]/30 rounded-3xl p-12 md:p-20 text-center overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full px-4 py-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">Join 10,000+ traders</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Ready to trade{' '}
            <span className="text-gradient">without fear?</span>
          </h2>

          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Create your free account today. Browse listings, sell your assets, and experience trading the way it should be — safe, fast, and fair.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://market.velxo.shop/auth/register"
              className="group flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#6D28D9] text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-[#8B5CF6]/30 text-base hover:scale-105"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://market.velxo.shop"
              className="flex items-center gap-2 bg-transparent border border-[#1F2937] hover:border-[#8B5CF6]/40 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-2xl transition text-base"
            >
              Browse Marketplace
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-xs text-gray-600">
            {[
              'No credit card required',
              'Free to browse',
              '10% fee on sales only',
              'Cancel anytime',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
