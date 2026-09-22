/**
 * GET /admin/ai/icons/192 → 192×192 SVG-as-PNG (served as image/png)
 * GET /admin/ai/icons/512 → 512×512 SVG-as-PNG
 *
 * These are referenced by /copilot-manifest.json.
 * We return the SVG with the correct Content-Type; browsers accept SVG for
 * Web App Manifest icons when served as image/svg+xml, but for maximum
 * compatibility we also serve image/png declared in the manifest — the browser
 * renders the SVG fine as long as the sizes attribute matches.
 *
 * For a fully rasterised PNG you would run a build-time script; this route
 * covers both dev and prod without a native dependency.
 */

import { NextRequest, NextResponse } from 'next/server'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="110" fill="#0a0a0f"/>
  <rect x="4" y="4" width="504" height="504" rx="108" fill="none" stroke="#7c3aed" stroke-width="6" opacity="0.4"/>
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0a0a0f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="50%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="504" height="504" rx="108" fill="url(#bg)"/>
  <path d="M256 136 L271 221 L356 236 L271 251 L256 336 L241 251 L156 236 L241 221 Z" fill="url(#sg)" opacity="0.95"/>
  <path d="M338 160 L344 188 L372 194 L344 200 L338 228 L332 200 L304 194 L332 188 Z" fill="#a78bfa" opacity="0.75" transform="scale(0.68) translate(140, 58)"/>
  <path d="M178 284 L182 302 L200 306 L182 310 L178 328 L174 310 L156 306 L174 302 Z" fill="#c4b5fd" opacity="0.65"/>
</svg>`

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params
  const px = size === '192' ? 192 : 512

  // Embed the requested pixel size into the SVG width/height attributes
  const sized = SVG.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 512 512">`,
  )

  return new NextResponse(sized, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
