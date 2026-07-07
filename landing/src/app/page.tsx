import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import HowItWorks from '@/components/HowItWorks';
import Games from '@/components/Games';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import About from '@/components/About';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0b0f19]">
      <Navbar />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Games />
      <Features />
      <Pricing />
      <Testimonials />
      <About />
      <CTA />
      <Footer />
    </main>
  );
}
