/**
 * upload.ts — File upload helpers for Piyrox.
 *
 * Storage is Cloudinary — all uploaded assets get a permanent public HTTPS URL.
 * - Uploads always require auth (POST /upload?folder=...).
 * - The returned `url` is a permanent Cloudinary CDN URL; store it directly in the DB.
 * - No presigned URLs or signing steps needed.
 *
 * What you store in the DB: the `url` (permanent Cloudinary URL) or the `key` for reference.
 * What you display in <img src>: the `url` directly — no need to call signUrl().
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '')

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('piyrox_token') : null
}

export interface UploadResult {
  key: string  // logical key, e.g. "listings/abc123.jpg"
  url: string  // permanent Cloudinary CDN URL — use directly in <img src>
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

// ─── Typed upload helpers ─────────────────────────────────────────────────────

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

/** Full upload — returns both key and URL */
export async function uploadFileWithKey(file: File, folder: string): Promise<UploadResult> {
  return uploadFile(file, folder)
}

/**
 * @deprecated Cloudinary URLs are permanent — no signing needed.
 * Returns the URL as-is. Kept for backwards compatibility.
 */
export async function signUrl(key: string): Promise<string> {
  return key
}

/**
 * @deprecated Cloudinary URLs are permanent — no signing needed.
 * Returns the URL as-is. Kept for backwards compatibility.
 */
export async function signPrivateUrl(key: string): Promise<string> {
  return key
}
