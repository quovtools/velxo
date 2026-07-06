"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: string
  isOwn: boolean
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setConversations(data.data || [])
          if (data.data && data.data.length > 0) {
            setSelectedConversation(data.data[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [router])

  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/messages/conversation/${selectedConversation}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (res.ok) {
          const data = await res.json()
          setMessages(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSending(true)
      const token = localStorage.getItem('token')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/messages/conversation/${selectedConversation}/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newMessage }),
        }
      )

      if (res.ok) {
        setNewMessage('')
        // Refresh messages
        const msgRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/messages/conversation/${selectedConversation}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (msgRes.ok) {
          const data = await msgRes.json()
          setMessages(data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 h-screen max-w-6xl flex flex-col">
        <h1 className="text-4xl font-bold mb-6">Messages</h1>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Conversations List */}
          <div className="w-80 flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="font-semibold">Conversations</h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                ))}
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 text-left border-b border-zinc-800 transition ${
                      selectedConversation === conv.id
                        ? 'bg-blue-900/30 border-l-2 border-l-blue-500'
                        : 'hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {conv.participantAvatar && (
                        <img src={conv.participantAvatar} alt={conv.participantName} className="w-10 h-10 rounded-full" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.participantName}</p>
                        <p className="text-xs text-zinc-400 truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            {selectedConversation && conversations.find(c => c.id === selectedConversation) ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-zinc-800">
                  {(() => {
                    const conv = conversations.find(c => c.id === selectedConversation)
                    return conv ? (
                      <div className="flex items-center gap-3">
                        {conv.participantAvatar && (
                          <img src={conv.participantAvatar} alt={conv.participantName} className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                          <p className="font-semibold">{conv.participantName}</p>
                          <p className="text-xs text-zinc-400">Active now</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-100'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-200' : 'text-zinc-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-zinc-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
