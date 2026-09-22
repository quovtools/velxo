'use client';

import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Dependency-free markdown renderer for AI chat output.
// Supports: headings, bullets, numbered lists, fenced code, `code`, **bold**,
// *italic*, and [label](https://…). Everything renders as React text nodes —
// no HTML injection, so model output can never smuggle markup into the admin.
// ─────────────────────────────────────────────────────────────────────────────

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let buf = '';
  let i = 0;
  let k = 0;

  const flush = () => {
    if (buf) {
      nodes.push(<React.Fragment key={`${keyPrefix}-t${k++}`}>{buf}</React.Fragment>);
      buf = '';
    }
  };

  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        nodes.push(
          <code
            key={`${keyPrefix}-c${k++}`}
            className="bg-[#0a0a0f] border border-white/10 rounded px-1.5 py-0.5 text-[12px] font-mono text-violet-300"
          >
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }

    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        nodes.push(
          <strong key={`${keyPrefix}-b${k++}`} className="font-semibold text-white">
            {text.slice(i + 2, end)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }

    if (text[i] === '*' && !text.startsWith('**', i)) {
      const end = text.indexOf('*', i + 1);
      if (end !== -1 && end > i + 1) {
        flush();
        nodes.push(
          <em key={`${keyPrefix}-i${k++}`} className="italic text-gray-200">
            {text.slice(i + 1, end)}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '[') {
      const closeLabel = text.indexOf(']', i + 1);
      if (closeLabel !== -1 && text[closeLabel + 1] === '(') {
        const closeUrl = text.indexOf(')', closeLabel + 2);
        if (closeUrl !== -1) {
          const url = text.slice(closeLabel + 2, closeUrl);
          if (/^https?:\/\//i.test(url)) {
            flush();
            nodes.push(
              <a
                key={`${keyPrefix}-a${k++}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 underline decoration-violet-500/40 hover:text-violet-300"
              >
                {text.slice(i + 1, closeLabel)}
              </a>,
            );
            i = closeUrl + 1;
            continue;
          }
        }
      }
    }

    buf += text[i];
    i++;
  }
  flush();
  return nodes;
}

const BULLET_RE = /^\s*[-•*]\s+/;
const NUMBERED_RE = /^\s*\d+[.)]\s+/;

export function MarkdownLite({ content, className }: { content: string; className?: string }) {
  const lines = (content || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push(
        <pre
          key={key++}
          className="bg-[#0a0a0f] border border-white/8 rounded-xl p-3 overflow-x-auto text-[12px] leading-relaxed font-mono text-gray-300"
        >
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Heading
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const size =
        level === 1 ? 'text-[15px]' : level === 2 ? 'text-[14px]' : 'text-[13px]';
      blocks.push(
        <div key={key++} className={`${size} font-bold text-white pt-1`}>
          {renderInline(heading[2], `h${key}`)}
        </div>,
      );
      i++;
      continue;
    }

    // Bullet list
    if (BULLET_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET_RE.test(lines[i])) {
        items.push(lines[i].replace(BULLET_RE, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 marker:text-violet-500/70">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (NUMBERED_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && NUMBERED_RE.test(lines[i])) {
        items.push(lines[i].replace(NUMBERED_RE, ''));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 space-y-1 marker:text-violet-500/70">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ol${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph — merge single line breaks with a space
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !BULLET_RE.test(lines[i]) &&
      !NUMBERED_RE.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(para.join(' '), `p${key}`)}
      </p>,
    );
  }

  return <div className={className ?? 'space-y-2.5 text-[13px] text-gray-300'}>{blocks}</div>;
}
