'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    // TODO: Send to backend
    setTimeout(() => {
      setIsSending(false)
      alert('Message sent! We&apos;ll get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 1000)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl font-black mb-6">Contact Us</h1>
            <p className="text-xl text-zinc-300">
              Have questions? We&apos;re here to help! Reach out to our support team.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              {[
                {
                  icon: Mail,
                  title: 'Email',
                  value: 'support@velxo.com',
                  desc: 'We reply within 24 hours',
                },
                {
                  icon: Phone,
                  title: 'Phone',
                  value: '+1 (555) 123-4567',
                  desc: 'Mon-Fri, 9AM-9PM EST',
                },
                {
                  icon: MapPin,
                  title: 'Address',
                  value: 'San Francisco, CA',
                  desc: 'Gaming Hub, Tech City',
                },
              ].map((contact, i) => {
                const Icon = contact.icon
                return (
                  <Card key={i} className="border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-start gap-4">
                      <Icon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold mb-1">{contact.title}</h3>
                        <p className="font-semibold text-blue-400">{contact.value}</p>
                        <p className="text-sm text-zinc-400 mt-1">{contact.desc}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-zinc-800 bg-zinc-900/50 p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="What is this about?"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us what you think..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
