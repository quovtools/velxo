"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/v1/messages/conversations', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(res => { setConversations(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="w-80 border-r border-zinc-800 hidden md:flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {loading ? <p className="text-zinc-400 text-sm p-2">Loading...</p> : conversations.map((c: any) => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left p-3 rounded hover:bg-zinc-900 ${selected === c.id ? 'bg-zinc-900' : ''}`}>
              <p className="font-medium text-sm">Conversation {c.id.slice(-6)}</p>
              <p className="text-xs text-zinc-400">{new Date(c.lastMessageAt).toLocaleString()}</p>
            </button>
          ))}
          {!loading && !conversations.length && <p className="text-zinc-500 text-sm p-2">No conversations yet.</p>}
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          {selected ? 'Conversation view (connect backend gateway)' : 'Select a conversation'}
        </div>
      </main>
    </div>
  )
}
