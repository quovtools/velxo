import React from 'react';

interface GameIconProps {
  game: string;
  className?: string;
}

// Real SVG-based game icons using brand colours and shapes
const icons: Record<string, React.ReactNode> = {
  'free-fire': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#FF4500" opacity="0.15" />
      <path d="M24 6C24 6 14 16 14 26C14 31.523 18.477 36 24 36C29.523 36 34 31.523 34 26C34 16 24 6Z" fill="#FF6B2B" />
      <path d="M24 14C24 14 18 21 18 26C18 29.314 20.686 32 24 32C27.314 32 30 29.314 30 26C30 21 24 14Z" fill="#FF9F43" />
      <path d="M24 22C24 22 21 25 21 27.5C21 29.157 22.343 30.5 24 30.5C25.657 30.5 27 29.157 27 27.5C27 25 24 22Z" fill="#FFF3CD" />
      <path d="M16 28L14 38L22 34L24 42L26 34L34 38L32 28" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'cod-mobile': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#1A1A2E" opacity="0.4" />
      <rect x="10" y="20" width="28" height="8" rx="2" fill="#4ECDC4" />
      <rect x="8" y="22" width="6" height="4" rx="1" fill="#2ECC71" />
      <rect x="34" y="22" width="6" height="4" rx="1" fill="#2ECC71" />
      <circle cx="24" cy="24" r="3" fill="#1A1A2E" />
      <circle cx="24" cy="24" r="1.5" fill="#4ECDC4" />
      <path d="M24 14L26 18H22L24 14Z" fill="#E74C3C" />
      <path d="M24 34L26 30H22L24 34Z" fill="#E74C3C" />
      <path d="M14 24L18 22V26L14 24Z" fill="#E74C3C" />
      <path d="M34 24L30 22V26L34 24Z" fill="#E74C3C" />
    </svg>
  ),
  'blood-strike': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#8B0000" opacity="0.2" />
      <path d="M24 8L28 18H38L30 24L33 34L24 28L15 34L18 24L10 18H20L24 8Z" fill="#DC143C" />
      <path d="M24 14L26.5 21H34L28 25L30.5 32L24 28L17.5 32L20 25L14 21H21.5L24 14Z" fill="#FF4444" />
      <circle cx="24" cy="24" r="3" fill="#FFE4E1" />
    </svg>
  ),
  'delta-force': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#2C3E50" opacity="0.3" />
      <path d="M24 10L38 34H10L24 10Z" fill="#3498DB" />
      <path d="M24 16L34 32H14L24 16Z" fill="#2980B9" />
      <path d="M24 22L28 30H20L24 22Z" fill="#ECF0F1" />
      <path d="M18 38L24 34L30 38" stroke="#F39C12" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'pubg-mobile': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#F5A623" opacity="0.15" />
      <circle cx="24" cy="24" r="14" stroke="#F5A623" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="6" fill="#F5A623" opacity="0.5" />
      <circle cx="24" cy="24" r="2" fill="#F5A623" />
      <line x1="24" y1="8" x2="24" y2="14" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="34" x2="24" y2="40" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="24" x2="14" y2="24" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="24" x2="40" y2="24" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  'valorant': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#FF4655" opacity="0.15" />
      <path d="M10 14H26L38 24L26 34H10L22 24L10 14Z" fill="#FF4655" />
      <path d="M16 18H24L32 24L24 30H16L24 24L16 18Z" fill="#ECE8E1" />
      <path d="M20 22H23L26 24L23 26H20L23 24L20 22Z" fill="#FF4655" />
    </svg>
  ),
  'roblox': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#CC0000" opacity="0.15" />
      <rect x="12" y="12" width="24" height="24" rx="3" fill="#CC0000" transform="rotate(15 24 24)" />
      <rect x="15" y="15" width="18" height="18" rx="2" fill="#FFFFFF" transform="rotate(15 24 24)" />
      <rect x="19" y="19" width="4" height="4" rx="1" fill="#CC0000" transform="rotate(15 24 24)" />
      <rect x="25" y="25" width="4" height="4" rx="1" fill="#CC0000" transform="rotate(15 24 24)" />
    </svg>
  ),
  'mobile-legends': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#4A0080" opacity="0.2" />
      <path d="M24 10C24 10 12 20 12 28C12 34 17.5 38 24 38C30.5 38 36 34 36 28C36 20 24 10Z" fill="#9B59B6" />
      <path d="M24 16C24 16 16 23 16 28C16 31.5 19.5 34 24 34C28.5 34 32 31.5 32 28C32 23 24 16Z" fill="#D8A4FF" />
      <path d="M20 28L24 20L28 28H20Z" fill="#FFFFFF" />
      <circle cx="24" cy="28" r="3" fill="#4A0080" />
      <circle cx="24" cy="28" r="1.5" fill="#D8A4FF" />
    </svg>
  ),
  'fortnite': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#00D4FF" opacity="0.15" />
      <path d="M16 10H32V16H24V20H30V26H24V38H16V10Z" fill="#00D4FF" />
      <rect x="16" y="10" width="16" height="6" rx="1" fill="#0099BB" />
      <rect x="16" y="20" width="14" height="6" rx="1" fill="#0099BB" />
    </svg>
  ),
  'clash-of-clans': (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#8B6914" opacity="0.2" />
      <rect x="14" y="18" width="20" height="16" rx="2" fill="#C8962C" />
      <rect x="12" y="16" width="24" height="4" rx="1" fill="#A67C1A" />
      <path d="M20 14V18M24 12V18M28 14V18" stroke="#A67C1A" strokeWidth="2" strokeLinecap="round" />
      <rect x="20" y="26" width="8" height="8" rx="1" fill="#8B6914" />
      <circle cx="18" cy="22" r="2" fill="#FFD700" />
      <circle cx="30" cy="22" r="2" fill="#FFD700" />
    </svg>
  ),
};

const defaultIcon = (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#7C3AED" opacity="0.2" />
    <rect x="12" y="18" width="10" height="8" rx="2" fill="#7C3AED" />
    <rect x="26" y="18" width="10" height="8" rx="2" fill="#7C3AED" />
    <circle cx="24" cy="28" r="4" fill="#A855F7" />
    <circle cx="24" cy="28" r="2" fill="#7C3AED" />
    <path d="M18 22H20M28 22H30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function GameIcon({ game, className = 'w-10 h-10' }: GameIconProps) {
  const icon = icons[game] ?? defaultIcon;
  return (
    <div className={className}>
      {icon}
    </div>
  );
}
