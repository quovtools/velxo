import { ImageResponse } from 'next/og';

export const alt = 'Velxo — The Safe Marketplace for Gaming Accounts, Items & Top-Ups';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          backgroundColor: '#0f172a',
          backgroundImage:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #1d4ed8 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar: logo + trust pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#2563eb',
                fontSize: '40px',
                fontWeight: 800,
                color: '#ffffff',
                marginRight: '20px',
              }}
            >
              V
            </div>
            <div style={{ display: 'flex', fontSize: '44px', fontWeight: 800, letterSpacing: '-1px' }}>
              Velxo
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 22px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)',
              color: '#6ee7b7',
              fontSize: '22px',
              fontWeight: 700,
            }}
          >
            Escrow Protected
          </div>
        </div>

        {/* Center: tagline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: '60px', fontWeight: 800, lineHeight: 1.1 }}>
            The Safe Marketplace
          </div>
          <div style={{ display: 'flex', fontSize: '60px', fontWeight: 800, lineHeight: 1.1, color: '#60a5fa' }}>
            for Gaming Accounts, Items
          </div>
          <div style={{ display: 'flex', fontSize: '60px', fontWeight: 800, lineHeight: 1.1, color: '#60a5fa' }}>
            &amp; Top-Ups
          </div>
        </div>

        {/* Bottom: category pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {['Buy & Sell', 'Game Accounts', 'Top-Ups', 'Coins', 'Boosting'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 26px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                fontSize: '24px',
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
