'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { Send, User, Gamepad } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  messages?: Message[];
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadChats() {
      try {
        const response = await api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations');
        if (response.success) {
          const list = response.data || [];
          setConversations(list);

          // If starting chat with a user
          if (targetUserId) {
            const match = list.find(c => c.buyerId === targetUserId || c.sellerId === targetUserId);
            if (match) {
              setActiveConv(match);
            } else {
              // Create new conversation
              const newRes = await api.post<{ success: boolean; data: Conversation }>('/messages/conversations', {
                recipientId: targetUserId,
              });
              if (newRes.success) {
                setConversations(prev => [newRes.data, ...prev]);
                setActiveConv(newRes.data);
              }
            }
          } else if (list.length > 0) {
            setActiveConv(list[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load conversations', e);
      } finally {
        setLoading(false);
      }
    }
    loadChats();
  }, [user, targetUserId, router]);

  // Handle active conversation updates & WebSocket subscriptions
  useEffect(() => {
    if (!activeConv || !user) return;

    // Load message logs
    async function loadLogs() {
      try {
        const response = await api.get<{ success: boolean; data: Message[] }>(`/messages/conversations/${activeConv!.id}/messages`);
        if (response.success) {
          setMessages(response.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadLogs();

    // Establish socket connection
    const socket = io('http://localhost:3001', {
      auth: async (cb) => {
        const session = await api.get<any>('/auth/session'); // Get session token if needed
        cb({ token: session?.access_token });
      },
    });
    socketRef.current = socket;

    socket.emit('joinConversation', { conversationId: activeConv.id });

    socket.on('message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeConv, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    try {
      const response = await api.post<{ success: boolean; data: Message }>(`/messages/conversations/${activeConv.id}/messages`, {
        content: newMessage,
      });

      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Opening secure chat connection...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-cardBg border border-borderBg rounded-3xl h-[600px] overflow-hidden my-6">
      {/* Sidebar chats list */}
      <div className="md:col-span-1 border-r border-borderBg p-6 space-y-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Conversations</h2>
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-500">No active discussions. Open a product to message a merchant.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => {
              const active = activeConv?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    active ? 'border-brand bg-brand/5' : 'border-transparent hover:bg-background'
                  }`}
                >
                  <User className="w-8 h-8 text-gray-400 bg-background p-1.5 rounded-full border border-borderBg" />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-gray-200 truncate">Room #{c.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500 truncate">Last active: {new Date(c.lastMessageAt).toLocaleTimeString()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Messaging console */}
      <div className="md:col-span-3 flex flex-col h-full bg-background/20">
        {activeConv ? (
          <>
            {/* Header info */}
            <div className="border-b border-borderBg p-4 flex items-center gap-3 bg-cardBg">
              <User className="w-10 h-10 text-brand bg-background p-2 rounded-full border border-borderBg" />
              <div>
                <p className="font-bold text-white">Conversation Room #{activeConv.id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-emerald-400">Online encrypted line</p>
              </div>
            </div>

            {/* Message logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => {
                const selfMsg = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${selfMsg ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm shadow-md ${
                      selfMsg
                        ? 'bg-brand text-white rounded-tr-none'
                        : 'bg-cardBg border border-borderBg text-gray-200 rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed">{m.content}</p>
                      <span className="block text-[8px] text-right mt-1 opacity-60">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="border-t border-borderBg p-4 flex gap-3 bg-cardBg">
              <input
                type="text"
                placeholder="Compose secure escrow message..."
                className="flex-1 bg-background border border-borderBg rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-dark p-3.5 rounded-xl transition shadow-lg shadow-brand/20 text-white"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Gamepad className="w-16 h-16 text-brand/20 mb-3" />
            <p className="text-gray-500 text-sm">Select an active conversation room from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RealTimeMessagingPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Initializing messenger interface...</div>}>
      <ChatContent />
    </Suspense>
  );
}
