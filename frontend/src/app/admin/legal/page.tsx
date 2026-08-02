'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Eye, EyeOff, Save, Globe, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, ErrorBanner, PageHeader, AdminInput, AdminTextarea, formatDate } from '@/components/admin/ui';

const PAGE_TYPES = [
  { value: 'terms',   label: 'Terms of Service', url: '/terms' },
  { value: 'privacy', label: 'Privacy Policy',   url: '/privacy' },
  { value: 'refund',  label: 'Refund Policy',    url: '/refund' },
  { value: 'cookies', label: 'Cookie Policy',    url: '/cookies' },
];

interface LegalPage {
  id?: string; pageType: string; title: string; content: string;
  version: string; isPublished: boolean; publishedAt?: string; updatedAt?: string;
}

const DEFAULTS: Record<string, LegalPage> = {
  terms:   { pageType: 'terms',   title: 'Terms of Service', version: '1.0', isPublished: false, content: '<h2>1. Acceptance</h2>\n<p>By using Piyrox you agree to these terms.</p>' },
  privacy: { pageType: 'privacy', title: 'Privacy Policy',   version: '1.0', isPublished: false, content: '<h2>1. Data We Collect</h2>\n<p>We collect email and payment information.</p>' },
  refund:  { pageType: 'refund',  title: 'Refund Policy',    version: '1.0', isPublished: false, content: '<h2>Refund Eligibility</h2>\n<p>Refunds are processed via the dispute flow.</p>' },
  cookies: { pageType: 'cookies', title: 'Cookie Policy',    version: '1.0', isPublished: false, content: '<h2>Cookies</h2>\n<p>We use session cookies for authentication.</p>' },
};

export default function AdminLegalPage() {
  const [pages,    setPages]    = useState<Record<string, LegalPage>>({});
  const [active,   setActive]   = useState('terms');
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error,    setError]    = useState('');
  const [saved,    setSaved]    = useState(false);

  const current: LegalPage = pages[active] ?? DEFAULTS[active];
  const setField = (k: keyof LegalPage, v: any) =>
    setPages(prev => ({ ...prev, [active]: { ...current, [k]: v } }));

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
      await api.post('/legal/admin', { pageType: current.pageType, title: current.title, content: current.content, version: current.version || '1.0', isPublished: current.isPublished });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      await fetchPages();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    setToggling(true); setError('');
    try { await api.patch(`/legal/admin/${active}/publish`, { publish: !current.isPublished }); await fetchPages(); }
    catch (e: any) { setError(e.message || 'Toggle failed'); }
    finally { setToggling(false); }
  };

  const pageInfo = PAGE_TYPES.find(p => p.value === active)!;

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader icon={ScrollText} title="Legal Pages" subtitle="Manage Terms of Service, Privacy Policy and other legal content."
        action={
          <button onClick={fetchPages} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition"><RefreshCw className="w-4 h-4" /></button>
        } />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Tab selector */}
      <div className="flex flex-wrap gap-1.5">
        {PAGE_TYPES.map(pt => {
          const page = pages[pt.value];
          return (
            <button key={pt.value} onClick={() => setActive(pt.value)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                active === pt.value
                  ? 'bg-violet-600/15 border-violet-500/30 text-white'
                  : 'bg-[#111118] border-white/8 text-gray-500 hover:text-white hover:border-white/16'
              }`}>
              {pt.label}
              <span className={`w-1.5 h-1.5 rounded-full ${page?.isPublished ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white">{pageInfo.label}</h2>
            <Badge color={current.isPublished ? 'green' : 'gray'}>
              {current.isPublished ? 'Published' : 'Draft'}
            </Badge>
            {current.updatedAt && <span className="text-[11px] text-gray-600">Saved {formatDate(current.updatedAt)}</span>}
          </div>
          <div className="flex items-center gap-2">
            {current.isPublished && (
              <a href={pageInfo.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition">
                <Globe className="w-3 h-3" />View live
              </a>
            )}
            <button onClick={handleToggle} disabled={toggling || !current.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-40 ${
                current.isPublished
                  ? 'bg-red-500/8 border-red-500/20 text-red-400 hover:bg-red-500/15'
                  : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
              }`}>
              {current.isPublished ? <><EyeOff className="w-3 h-3" />Unpublish</> : <><Eye className="w-3 h-3" />Publish</>}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <AdminInput label="Page title" value={current.title} onChange={e => setField('title', e.target.value)} />
            </div>
            <AdminInput label="Version" value={current.version || '1.0'} onChange={e => setField('version', e.target.value)} placeholder="1.0" />
          </div>
          <AdminTextarea label="Content (HTML supported)" value={current.content}
            onChange={e => setField('content', e.target.value)} rows={20}
            placeholder="<h2>Section</h2>&#10;<p>Content…</p>" className="font-mono text-xs" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/8 bg-white/2">
          <p className="text-[11px] text-gray-600">
            {current.publishedAt ? `Published ${formatDate(current.publishedAt)}` : 'Not published — save first, then publish.'}
          </p>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50 shadow-sm shadow-violet-500/20">
            {saved ? <><CheckCircle2 className="w-3.5 h-3.5" />Saved!</>
              : saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Saving…</>
              : <><Save className="w-3.5 h-3.5" />Save Draft</>}
          </button>
        </div>
      </div>

      {/* Live preview */}
      {current.content && (
        <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Preview</p>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: current.content }} />
        </div>
      )}
    </div>
  );
}
