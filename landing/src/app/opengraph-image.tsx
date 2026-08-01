import { ImageResponse } from 'next/og';

export const alt = "Piyrox — Africa's No.1 Gaming Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  const games = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Blood Strike', 'eFootball'];
  const pills = ['Buy Accounts', 'Sell Accounts', 'Top-Ups', 'Rank Boosting', 'Escrow Protected'];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          background: 'linear-gradient(135deg, #020617 0%, #0f0a2e 50%, #1e0a3c 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative glow blob */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top bar: wordmark + trust badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                fontSize: '36px',
                fontWeight: 900,
                color: '#ffffff',
              }}
            >
              P
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '42px',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                color: '#f8fafc',
              }}
            >
              Piyrox
            </div>
          </div>

          {/* Trust badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '999px',
              background: 'rgba(16,185,129,0.12)',
              border: '1.5px solid rgba(16,185,129,0.45)',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
              }}
            />
            <div style={{ display: 'flex', fontSize: '20px', fontWeight: 700, color: '#6ee7b7' }}>
              Trust-Trade Escrow
            </div>
          </div>
        </div>

        {/* Centre: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              fontWeight: 600,
              color: '#a78bfa',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Africa&apos;s No.1 Gaming Marketplace
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '62px',
              fontWeight: 900,
              lineHeight: 1.08,
              color: '#f8fafc',
            }}
          >
            Buy &amp; Sell Game
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '62px',
              fontWeight: 900,
              lineHeight: 1.08,
              background: 'linear-gradient(90deg, #a78bfa 0%, #60a5fa 100%)',
              // inline style gradient text trick for ImageResponse
              color: '#a78bfa',
            }}
          >
            Accounts Safely
          </div>
          {/* Supported games row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px' }}>
            {games.map((game) => (
              <div
                key={game}
                style={{
                  display: 'flex',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.35)',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#c4b5fd',
                }}
              >
                {game}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: feature pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {pills.map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '12px 22px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '20px',
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
