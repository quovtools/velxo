import React from 'react';

interface GameIconProps {
  game: string;
  className?: string;
}

export default function GameIcon({ game, className = 'w-10 h-10' }: GameIconProps) {
  const extOrder = ['png', 'jpg', 'svg'];
  return (
    <div className={`${className} relative rounded-xl overflow-hidden flex-shrink-0`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/games/${game}.png`}
        alt={game}
        className="w-full h-full object-cover"
        draggable={false}
        onError={(e) => {
          const target = e.currentTarget;
          const tried = target.src;
          const base = `/games/${game}`;
          if (!tried.includes('.jpg')) {
            target.src = `${base}.jpg`;
            return;
          }
          if (!tried.includes('.svg')) {
            target.src = `${base}.svg`;
            return;
          }
          const el = target.parentElement;
          if (el) {
            el.innerHTML = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
              <rect width="64" height="64" rx="14" fill="#1a1a2e"/>
              <rect x="12" y="22" width="40" height="22" rx="6" fill="#2563EB"/>
              <rect x="8" y="26" width="8" height="14" rx="4" fill="#2563EB"/>
              <rect x="48" y="26" width="8" height="14" rx="4" fill="#2563EB"/>
              <rect x="20" y="30" width="3" height="8" rx="1.5" fill="white"/>
              <rect x="17" y="33" width="9" height="3" rx="1.5" fill="white"/>
              <circle cx="40" cy="30" r="2" fill="white"/>
              <circle cx="46" cy="34" r="2" fill="white"/>
              <circle cx="40" cy="38" r="2" fill="white"/>
              <circle cx="34" cy="34" r="2" fill="white"/>
            </svg>`;
          }
        }}
      />
    </div>
  );
}
