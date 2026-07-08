const REF_KEY = 'velxo_ref';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function storeReferralCode(code: string | null) {
  if (typeof window === 'undefined' || !code) return;
  try {
    sessionStorage.setItem(REF_KEY, code);
  } catch {}
}

export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export async function trackReferralClick(code: string) {
  if (!code) return;
  try {
    await fetch(`${API_BASE}/affiliate/click/${encodeURIComponent(code)}`, {
      method: 'POST',
    });
  } catch {
    // Non-fatal — click tracking is best-effort
  }
}
