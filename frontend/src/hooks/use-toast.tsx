'use client'
import { useState, createContext, useContext, ReactNode } from 'react'

type Toast = { title: string; description?: string; variant?: 'default' | 'destructive' }

const ToastContext = createContext<{ toast: (t: Toast) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = (t: Toast) => { setToasts(p => [...p, t]); setTimeout(() => setToasts(p => p.slice(1)), 3000) }
  return (
    <ToastContext.Provider value={{ toast: add }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t, i) => (
          <div key={i} className={`rounded border p-3 text-sm ${t.variant === 'destructive' ? 'border-red-600 bg-red-900' : 'border-zinc-700 bg-zinc-900'}`}>
            <p className="font-medium">{t.title}</p>
            {t.description && <p className="text-zinc-400 text-xs mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
