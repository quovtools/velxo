'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, RefreshCw, Eye, EyeOff, Save, Globe, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, ErrorBanner, formatDate } from '@/components/admin/ui';

const PAGE_TYPES = [
  { value: 'terms',   label: 'Terms of Service',  url: '/terms' },
  { value: 'privacy', label: 'Privacy Policy',    url: '/privacy' },
  { value: 'refund',  label: 'Refund Policy',     url: '/refund' },
  { value: 'cookies', label: 'Cookie Policy',     url: '/cookies' },
];

interface LegalPage {
  id?: string;
  pageType: string;
  title: string;
  content: string;
  version: string;
  isPublished: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

const DEFAULT_PAGES: Record<string, LegalPage> = {
  terms: {
    pageType: 'terms', title: 'Terms of Service', version: '1.0', isPublished: false,
    content: `<h2>1. Acceptance of Terms</h2>\n<p>By accessing piyrox market you agree to these Terms of Service.</p>\n\n<h2>2. Use of the Platform</h2>\n<p>piyrox market is a peer-to-peer gaming marketplace. You must be 13 or older to use this platform.</p>\n\n<h2>3. Escrow & Payments</h2>\n<p>All transactions are processed through piyrox escrow. Funds are held securely until both parties confirm delivery.</p>\n\n<h2>4. Prohibited Items</h2>\n<p>Accounts obtained through cheating, hacking or TOS violations of the originating game are strictly forbidden.</p>\n\n<h2>5. Dispute Resolution</h2>\n<p>In the event of a dispute, piyrox admin will investigate and make a final binding decision.</p>\n\n<h2>6. Termination</h2>\n<p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>`,
  },
  privacy: {
    pageType: 'privacy', title: 'Privacy Policy', version: '1.0', isPublished: false,
    content: `<h2>1. Information We Collect</h2>\n<p>We collect your email address, name, and payment information when you create an account or make a purchase.</p>\n\n<h2>2. How We Use Your Information</h2>\n<p>Your data is used to process transactions, verify identity, and improve the platform.</p>\n\n<h2>3. Data Sharing</h2>\n<p>We do not sell your personal data. We share data only with payment processors required to complete transactions.</p>\n\n<h2>4. Cookies</h2>\n<p>We use cookies to keep you logged in and to remember your preferences.</p>\n\n<h2>5. Your Rights</h2>\n<p>You may request deletion of your account and associated data at any time by contacting support.</p>`,
  },
  refund: {
    pageType: 'refund', title: 'Refund Policy', version: '1.0', isPublished: false,
    content: `<h2>Refund Eligibility</h2>\n<p>Refunds are handled through the piyrox escrow dispute process. Once a buyer confirms delivery, funds are released and no refund is possible.</p>\n\n<h2>Dispute Window</h2>\n<p>Buyers have 72 hours after delivery to raise a dispute before funds are automatically released to the seller.</p>`,
  },
  cookies: {
    pageType: 'cookies', title: 'Cookie Policy', version: '1.0', isPublished: false,
    content: `<h2>What Are Cookies?</h2>\n<p>Cookies are small text files stored on your device. We use them to keep you logged in and remember your preferences.</p>\n\n<h2>Essential Cookies</h2>\n<p>Session tokens and authentication cookies are required for the platform to function.</p>`,
  },
};

export default function AdminLegalPage() {
  const [pages,     setPages]     = useState<Record<string, LegalPage>>({});
  const [active,    setActive]    = useState('terms');
  const [saving,    setSaving]    = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [error,     setError]     = useState('');
  const [saved,     setSaved]     = useState(false);

  const current: LegalPage = pages[active] ?? DEFAULT_PAGES[active];

  const setField = (field: keyof LegalPage, value: any) =>
    setPages(prev => ({ ...prev, [active]: { ...current, [field]: value } }));

  const fetchPages = useCallback(async () => {
    try {
      const res: any = await api.get('/legal/admin/all');
      const map: Record<string, LegalPage> = {};
      (res.data || []).forEach((p: LegalPage) => { map[p.pageType] = p; });
      setPages(map);
    } catch { /* first load may be empty */ }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.post('/legal/admin', {
        pageType:    current.pageType,
        title:       current.title,
        content:     current.content,
        version:     current.version || '1.0',
        isPublished: current.isPublished,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchPages();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    setToggling(true); setError('');
    try {
      await api.patch(`/legal/admin/${active}/publish`, { publish: !current.isPublished });
      await fetchPages();
    } catch (e: any) {
      setError(e.message || 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const pageInfo = PAGE_TYPES.find(p => p.value === active)!;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-violet-400" /> Legal Pages
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage Terms of Service, Privacy Policy, and other legal content.</p>
        </div>
        <button onClick={fetchPages} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {PAGE_TYPES.map(pt => {
          const page = pages[pt.value];
          return (
            <button
              key={pt.value}
              onClick={() => setActive(pt.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                active === pt.value
                  ? 'bg-violet-600/20 border-violet-500/50 text-white'
                  : 'bg-[#111118] border-white/8 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {pt.label}
              {page?.isPublished
                ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                : <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              }
            </button>
          );
        })}
      </div>

      {/* Editor card */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-white">{pageInfo.label}</h2>
            <Badge color={current.isPublished ? 'green' : 'gray'}>
              {current.isPublished ? 'Published' : 'Draft'}
            </Badge>
            {current.updatedAt && (
              <span className="text-xs text-gray-600">Last saved {formatDate(current.updatedAt)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {current.isPublished && (
              <a
                href={pageInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-light transition"
              >
                <Globe className="w-3.5 h-3.5" /> View live
              </a>
            )}
            <button
              onClick={handleTogglePublish}
              disabled={toggling || !current.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition disabled:opacity-40 ${
                current.isPublished
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {current.isPublished ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Page Title</label>
              <input
                value={current.title}
                onChange={e => setField('title', e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Version</label>
              <input
                value={current.version || '1.0'}
                onChange={e => setField('version', e.target.value)}
                placeholder="1.0"
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Content <span className="text-gray-700 font-normal normal-case">(HTML supported)</span>
            </label>
            <textarea
              rows={22}
              value={current.content}
              onChange={e => setField('content', e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none focus:border-violet-500 transition resize-y"
              placeholder="<h2>Section</h2>\n<p>Content…</p>"
            />
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/8 bg-white/2">
          <p className="text-xs text-gray-600">
            {current.publishedAt ? `Published ${formatDate(current.publishedAt)}` : 'Not yet published — save first, then publish.'}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 shadow-lg shadow-violet-500/20"
          >
            {saved
              ? <><CheckCircle className="w-4 h-4" /> Saved!</>
              : saving
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save Draft</>
            }
          </button>
        </div>
      </div>

      {/* Preview */}
      {current.content && (
        <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Live Preview</p>
          <div
            className="prose prose-invert prose-sm max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: current.content }}
          />
        </div>
      )}
    </div>
  );
}
