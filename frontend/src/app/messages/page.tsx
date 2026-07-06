'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Search as SearchIcon } from 'lucide-react'

interface Conversation {
  id: string
  participantIds: string[]
  participants: Array<{ id: string; firstName?: string; lastName?: string; email: string }>
  lastMessage?: { content: string; createdAt: string }
  unreadCount: number
  updatedAt: string
}

export default function MessagesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: conversationsData, loading: conversationsLoading } = useApi<{
    conversations: Conversation[]
  }>('/messages/conversations')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || conversationsLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin">Loading...</div>
        </div>
        <Footer />
      </>
    )
  }

  const conversations = conversationsData?.conversations || []
  const filtered = conversations.filter((conv) =>
    conv.participants.some((p) =>
      `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <h1 className="text-4xl font-black mb-8">Messages</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              {/* Search */}
              <div className="mb-6 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Conversations */}
              <div className="space-y-2">
                {filtered.length > 0 ? (
                  filtered.map((conv) => (
                    <Link key={conv.id} href={`/messages/${conv.id}`}>
                      <Card className="border-zinc-800 bg-zinc-900/50 p-4 hover:border-blue-500 transition cursor-pointer group">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold group-hover:text-blue-400 transition truncate">
                            {conv.participants.map((p) => p.firstName || p.email).join(', ')}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {conv.lastMessage?.createdAt
                            ? new Date(conv.lastMessage.createdAt).toLocaleDateString()
                            : 'Just now'}
                        </p>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card className="border-zinc-800 bg-zinc-900/50 p-8 text-center">
                    <SearchIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-400">No conversations found</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Chat Area - Placeholder */}
            <div className="lg:col-span-2">
              <Card className="border-zinc-800 bg-zinc-900/50 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Send className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Select a conversation</h3>
                  <p className="text-zinc-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
