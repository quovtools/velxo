'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shield, Users, Award, TrendingUp } from 'lucide-react'

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black">
        {/* Hero */}
        <section className="py-20 border-b border-zinc-800 bg-gradient-to-b from-blue-900/20 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl lg:text-6xl font-black mb-6">About Velxo</h1>
              <p className="text-xl text-zinc-300 mb-8">
                We're building the safest, most trusted gaming marketplace where gamers can confidently buy and sell products.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-black mb-6">Our Story</h2>
                <div className="space-y-4 text-zinc-300">
                  <p>
                    Velxo was born from a frustration we experienced as gamers ourselves. We spent countless hours searching for a trusted platform to buy and sell gaming products.
                  </p>
                  <p>
                    Most platforms were either untrustworthy, slow, or filled with scammers. We knew there had to be a better way.
                  </p>
                  <p>
                    So in 2024, we built Velxo with a mission: to create the safest gaming marketplace where every transaction is protected, every seller is verified, and every gamer can trade with confidence.
                  </p>
                  <p>
                    Today, Velxo has grown to 100,000+ verified users and $10M+ in trading volume. We're just getting started.
                  </p>
                </div>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                <div className="text-9xl opacity-20">🎮</div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 border-b border-zinc-800 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black mb-12 text-center">Our Core Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Trust & Security',
                  desc: 'Every transaction is protected. We verify every seller and protect every buyer.',
                },
                {
                  icon: Users,
                  title: 'Community First',
                  desc: 'We prioritize our community\'s needs above everything else. Your feedback shapes our product.',
                },
                {
                  icon: Award,
                  title: 'Excellence',
                  desc: 'We set high standards and continuously improve to deliver the best experience.',
                },
                {
                  icon: TrendingUp,
                  title: 'Growth',
                  desc: 'We\'re committed to growing responsibly while maintaining our core values.',
                },
              ].map((value, i) => {
                const Icon = value.icon
                return (
                  <Card key={i} className="border-zinc-800 bg-zinc-900/50 p-6">
                    <Icon className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="font-bold text-lg mb-3">{value.title}</h3>
                    <p className="text-zinc-400">{value.desc}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black mb-12 text-center">Our Team</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { name: 'Alex Johnson', role: 'Founder & CEO', specialty: 'Gaming & Business' },
                { name: 'Sarah Tech', role: 'Co-founder & CTO', specialty: 'Security & Infrastructure' },
                { name: 'Mike Support', role: 'VP Community', specialty: 'Customer Success' },
              ].map((member, i) => (
                <Card key={i} className="border-zinc-800 bg-zinc-900/50 p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mx-auto mb-4 flex items-center justify-center text-4xl">
                    👤
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-blue-400 mb-2">{member.role}</p>
                  <p className="text-sm text-zinc-400">{member.specialty}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 border-b border-zinc-800 bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black mb-12 text-center">By The Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { stat: '100K+', label: 'Verified Users' },
                { stat: '$10M+', label: 'Trading Volume' },
                { stat: '50K+', label: 'Products Listed' },
                { stat: '4.8★', label: 'Avg Rating' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {item.stat}
                  </div>
                  <p className="text-zinc-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-black mb-6">Join Our Community</h2>
            <p className="text-xl text-zinc-400 mb-8">
              Be part of the fastest-growing gaming marketplace. Start trading today.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
