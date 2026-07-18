/**
 * upload.ts — File upload helpers for Velxo.
 *
 * Bucket is PRIVATE on Backblaze B2.
 * - Uploads always require auth (POST /upload?folder=...).
 * - Public images (listings, avatars, gigs, slides) are signed with long-lived
 *   presigned URLs. Visitors can view them without logging in via GET /upload/sign.
 * - KYC documents are signed with short-lived URLs and require auth via
 *   GET /upload/sign/private.
 *
 * What you store in the DB: the `key` (e.g. "listings/abc123.jpg").
 * What you display in <img src>: a presigned `url` from signUrl(key).
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '')

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('velxo_token') : null
}

export interface UploadResult {
  key: string  // store this in the DB
  url: string  // presigned URL — valid until B2_URL_TTL_SECONDS (default 24 h)
}

// ─── Core upload ─────────────────────────────────────────────────────────────

async function uploadFile(file: File, folder: string): Promise<UploadResult> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/upload?folder=${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message || `Upload failed (${res.status})`)
  }

  const json = await res.json()
  const { key, url } = json?.data || {}
  if (!key || !url) throw new Error('Upload succeeded but no key/url was returned')
  return { key, url }
}

// ─── URL signing ─────────────────────────────────────────────────────────────

/**
 * Get a fresh presigned URL for a public-folder key (listings, avatars, gigs, slides).
 * No login required — safe to call for visitor-facing image display.
 *
 * @param key  e.g. "listings/abc123.jpg"
 */
export async function signUrl(key: string): Promise<string> {
  if (!key) return ''
  const res = await fetch(`${API_BASE}/upload/sign?key=${encodeURIComponent(key)}`)
  if (!res.ok) throw new Error(`Failed to sign URL for key: ${key}`)
  const json = await res.json()
  return json?.data?.url || ''
}

/**
 * Get a fresh presigned URL for a KYC document key.
 * Requires the user to be logged in.
 *
 * @param key  e.g. "kyc/abc123.jpg"
 */
export async function signPrivateUrl(key: string): Promise<string> {
  if (!key) return ''
  const token = getToken()
  const res = await fetch(`${API_BASE}/upload/sign/private?key=${encodeURIComponent(key)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Failed to sign private URL for key: ${key}`)
  const json = await res.json()
  return json?.data?.url || ''
}

// ─── Typed upload helpers ─────────────────────────────────────────────────────
// Each returns the presigned URL directly so you can put it in <img src> straight away.
// Persist the `key` in the DB so you can call signUrl(key) when the URL expires.

/** Upload a listing product image */
export async function uploadListingImage(file: File, _path?: string): Promise<string> {
  const { url } = await uploadFile(file, 'listings')
  return url
}

/** Upload a KYC identity document or selfie */
export async function uploadKycImage(file: File, _path?: string): Promise<string> {
  const { url } = await uploadFile(file, 'kyc')
  return url
}

/** Upload a profile avatar */
export async function uploadAvatar(file: File): Promise<string> {
  const { url } = await uploadFile(file, 'avatars')
  return url
}

/** Upload a gig cover image */
export async function uploadGigImage(file: File): Promise<string> {
  const { url } = await uploadFile(file, 'gigs')
  return url
}

/** Full upload — returns both key and presigned URL */
export async function uploadFileWithKey(file: File, folder: string): Promise<UploadResult> {
  return uploadFile(file, folder)
}
