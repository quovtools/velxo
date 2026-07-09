'use client'

import { useEffect, useState } from 'react'
import { Smartphone, X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua)
  const standalone = !!(window.navigator as any).standalone
  return ios && !standalone
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.matchMedia('(display-mode: standalone)').matches) return

    setIos(isIos())

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    if (ios && !dismissed) setShow(true)
  }, [ios, dismissed])

  if (!show || dismissed) return null

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setShow(false)
      setDeferred(null)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm sm:left-auto sm:right-6 sm:translate-x-0">
      <div className="flex items-start gap-3 bg-cardBg border border-borderBg rounded-2xl p-4 shadow-2xl shadow-black/40 fade-in">
        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Get the Velxo App</p>
          {ios ? (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Tap <span className="font-semibold text-gray-200">Share</span> →{' '}
              <span className="font-semibold text-gray-200">Add to Home Screen</span> to install.
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Install Velxo for faster access &amp; offline browsing.
            </p>
          )}
          {!ios && (
            <button
              onClick={install}
              className="mt-3 flex items-center gap-2 bg-brand hover:bg-brand-dark px-3.5 py-2 rounded-xl text-xs font-bold text-white transition"
            >
              <Download className="w-4 h-4" /> Install App
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setDismissed(true)
            setShow(false)
          }}
          aria-label="Dismiss install prompt"
          className="p-1.5 -mr-1 text-gray-500 hover:text-white hover:bg-hoverBg rounded-lg transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
