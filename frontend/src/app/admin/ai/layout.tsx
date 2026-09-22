'use client';

/**
 * Standalone layout for the Piyrox Copilot PWA.
 *
 * What this does beyond auth:
 *  1. Injects <link rel="manifest"> pointing at /copilot-manifest.json so the
 *     browser sees a *different* manifest from the main marketplace and offers
 *     "Piyrox Copilot" as a separate installable app.
 *  2. Registers /copilot-sw.js scoped to /admin/ai (separate from main SW).
 *  3. Listens for beforeinstallprompt, stores it, and shows a polished
 *     install banner — with an iOS / Safari fallback (Add to Home Screen tip).
 *  4. When already running in standalone mode the banner is never shown.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Slash, Download, Share, X, Smartphone, CheckCircle2,
} from 'lucide-react';

const SESSION_KEY  = 'piyrox_admin_auth';
const PASSWORD_KEY = 'piyrox_admin_password';
const INSTALL_DISMISSED_KEY = 'copilot_install_dismissed';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// ─── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw,      setPw]      = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/dashboard`,
        { headers: { 'x-admin-password': pw } },
      );
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(PASSWORD_KEY, pw);
        onUnlock();
      } else {
        setError('Incorrect password.');
        setPw('');
      }
    } catch {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30
            flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Sparkles className="w-7 h-7 text-violet-400" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black text-white">Piyrox Copilot</h1>
            <p className="text-sm text-gray-500 mt-0.5">Admin access required</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20
            text-red-400 text-xs px-3 py-2.5 rounded-xl">
            <Slash className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password" required autoFocus value={pw}
            onChange={e => { setPw(e.target.value); setError(''); }}
            placeholder="Admin password"
            className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3.5
              text-white text-sm placeholder-gray-600 focus:outline-none
              focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/15 transition"
          />
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700
              text-white text-sm font-bold transition disabled:opacity-50
              shadow-lg shadow-violet-500/15 touch-manipulation">
            {loading ? 'Checking…' : 'Enter Copilot'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Install banner ───────────────────────────────────────────────────────────

type InstallState = 'hidden' | 'prompt' | 'ios' | 'installed';

function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>('hidden');
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Already installed — never show
    if (isInStandaloneMode()) return;

    // Already dismissed this session
    if (sessionStorage.getItem(INSTALL_DISMISSED_KEY)) return;

    if (isIos()) {
      setState('ios');
      return;
    }

    // Chrome / Edge / Samsung: listen for the native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState('prompt');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If the user installs from outside our banner, hide it
    window.addEventListener('appinstalled', () => {
      setState('installed');
      setTimeout(onDismiss, 2000);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [onDismiss]);

  const dismiss = () => {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    setState('hidden');
    onDismiss();
  };

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setSuccess(true);
        setTimeout(() => { setState('installed'); onDismiss(); }, 1500);
      } else {
        dismiss();
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  if (state === 'hidden') return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200]
      w-[calc(100%-2rem)] max-w-sm sm:left-auto sm:right-5 sm:translate-x-0
      animate-[slideInUp_0.25s_ease-out]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-[#111118] border border-violet-500/25 rounded-2xl p-4
        shadow-2xl shadow-black/60 shadow-violet-500/8">

        {/* Dismiss */}
        <button onClick={dismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center
            text-gray-600 hover:text-white hover:bg-white/8 rounded-lg transition touch-manipulation">
          <X className="w-3.5 h-3.5" />
        </button>

        {state === 'installed' || success ? (
          /* Success state */
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25
              flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Installed!</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Piyrox Copilot is now on your home screen.
              </p>
            </div>
          </div>
        ) : state === 'ios' ? (
          /* iOS Safari: manual Add to Home Screen */
          <div className="pr-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25
                flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Install Copilot</p>
                <p className="text-xs text-gray-500">Add to your home screen for instant access</p>
              </div>
            </div>
            <div className="bg-[#0a0a0f] border border-white/8 rounded-xl px-3.5 py-3
              space-y-1.5">
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="inline-flex items-center gap-1 font-semibold text-white">
                  <Share className="w-3 h-3 inline" /> Tap Share
                </span>{' '}
                in Safari's toolbar
              </p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Then tap{' '}
                <span className="font-semibold text-white">"Add to Home Screen"</span>
              </p>
            </div>
          </div>
        ) : (
          /* Chrome / Edge: native install button */
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25
              flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Install Copilot</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                Run as a standalone app — always one tap away
              </p>
              <button
                onClick={install}
                disabled={installing}
                className="mt-2.5 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500
                  active:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold
                  px-3.5 py-2 rounded-xl transition touch-manipulation shadow-sm shadow-violet-500/20">
                {installing
                  ? 'Installing…'
                  : <><Download className="w-3.5 h-3.5" /> Install App</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function AiCopilotLayout({ children }: { children: React.ReactNode }) {
  const [checked,       setChecked]       = useState(false);
  const [unlocked,      setUnlocked]      = useState(false);
  const [showInstall,   setShowInstall]   = useState(true);
  const swRegistered = useRef(false);

  useEffect(() => {
    // ── Auth check ─────────────────────────────────────────────────────────
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setUnlocked(true);
    setChecked(true);

    // ── Inject Copilot manifest ────────────────────────────────────────────
    // Remove the root manifest so Chrome picks up the Copilot one instead
    const existing = document.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]');
    existing.forEach(el => el.remove());

    const link = document.createElement('link');
    link.rel   = 'manifest';
    link.href  = '/copilot-manifest.json';
    document.head.appendChild(link);

    // Update theme-color for the Copilot brand (violet)
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = '#7c3aed';

    // ── Register Copilot service worker ────────────────────────────────────
    if ('serviceWorker' in navigator && !swRegistered.current) {
      swRegistered.current = true;
      navigator.serviceWorker
        .register('/copilot-sw.js', {
          scope: '/admin/ai',
          // updateViaCache: 'none' so the browser always checks for a new SW
          updateViaCache: 'none',
        })
        .then(reg => {
          // Check for updates immediately then every 30 min
          reg.update().catch(() => {});
          const id = setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
          return () => clearInterval(id);
        })
        .catch(() => {
          // SW registration failing is non-fatal — offline support just won't work
        });
    }

    // ── Restore manifest + theme-color on unmount ──────────────────────────
    return () => {
      link.remove();
      // Restore root manifest
      const root = document.createElement('link');
      root.rel  = 'manifest';
      root.href = '/manifest.json';
      document.head.appendChild(root);
      // Restore original theme color
      const themeTag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeTag) themeTag.content = '#0f172a';
    };
  }, []);

  if (!checked) return null;

  if (!unlocked) {
    return (
      <>
        {/* Manifest is injected via useEffect above — head tags work in client components */}
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </>
    );
  }

  return (
    <>
      {/* Full-screen shell — no inherited admin chrome */}
      <div
        className="h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white antialiased flex flex-col"
        style={{
          paddingTop:    'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft:   'env(safe-area-inset-left)',
          paddingRight:  'env(safe-area-inset-right)',
        }}
      >
        {children}
      </div>

      {/* Install banner — rendered outside the main flex container so it floats */}
      {showInstall && (
        <InstallBanner onDismiss={() => setShowInstall(false)} />
      )}
    </>
  );
}
