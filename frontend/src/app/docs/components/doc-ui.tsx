import React from 'react';
import Link from 'next/link';
import { Info, AlertTriangle, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';

type CalloutType = 'info' | 'warning' | 'tip' | 'success';

const CALLOUT_STYLES: Record<CalloutType, { wrap: string; icon: React.ReactNode; label: string }> = {
  info: {
    wrap: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    icon: <Info className="w-5 h-5 text-blue-400" />,
    label: 'Note',
  },
  warning: {
    wrap: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    label: 'Warning',
  },
  tip: {
    wrap: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    icon: <Lightbulb className="w-5 h-5 text-emerald-400" />,
    label: 'Tip',
  },
  success: {
    wrap: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    label: 'Good to know',
  },
};

export function DocHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-borderBg pb-8 mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
          {icon}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
      </div>
      <p className="text-gray-400 text-base leading-relaxed max-w-2xl">{description}</p>
    </div>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 mb-10">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        {title}
      </h2>
      <div className="text-gray-400 leading-relaxed text-sm space-y-3">{children}</div>
    </section>
  );
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <span className="shrink-0 w-8 h-8 rounded-full bg-brand/15 border border-brand/30 text-brand font-bold flex items-center justify-center text-sm">
            {i + 1}
          </span>
          <div className="space-y-1">
            <p className="text-white font-semibold text-sm">{item.title}</p>
            <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  const c = CALLOUT_STYLES[type];
  return (
    <div className={`rounded-xl border px-5 py-4 flex gap-3 ${c.wrap}`}>
      <div className="shrink-0 mt-0.5">{c.icon}</div>
      <div className="space-y-1 text-sm leading-relaxed">
        <p className="font-bold">{title ?? c.label}</p>
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}

export function FeatureGrid({ items }: { items: { icon: React.ReactNode; title: string; body: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-cardBg border border-borderBg rounded-xl p-5 space-y-2">
          <div className="text-brand">{item.icon}</div>
          <p className="text-white font-semibold text-sm">{item.title}</p>
          <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

export function RelatedLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="mt-12 border-t border-borderBg pt-8">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Related</p>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1.5 text-sm text-brand bg-brand/10 border border-brand/20 hover:bg-brand/20 transition rounded-lg px-4 py-2 font-semibold"
          >
            {l.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DocShell({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
