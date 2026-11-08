// Allowlisted domains — only proxy images from known trusted sources
const ALLOWED_HOSTS = [
  'cdn.higgsfield.ai',
  'media.higgsfield.ai',
  'storage.higgsfield.ai',
  'files.higgsfield.ai',
  // Higgsfield's generation CDN (results are named hf_<date>_<id>); exact host only.
  'd8j0ntlcm91z4.cloudfront.net',
  'oaidalleapiprodscus.blob.core.windows.net',
  'oaidallexprodscus.blob.core.windows.net',
]

function isSafeUrl(raw) {
  try {
    const u = new URL(decodeURIComponent(raw))
    if (u.protocol !== 'https:') return false
    return ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h))
  } catch { return false }
}

// Import mode (?mode=import) — used by /import for the Chrome extension, where the
// image can come from any public site. It is NOT an open proxy:
//   https only · no IP literals, localhost or internal names · no redirects
//   · image content types only · 15 MB cap.
const IMPORT_MAX_BYTES = 15 * 1024 * 1024
export function isSafeImportUrl(raw) {
  try {
    const u = new URL(decodeURIComponent(raw))
    if (u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    if (u.port && u.port !== '443') return false
    const h = u.hostname.toLowerCase()
    if (!h.includes('.')) return false                       // bare/internal names
    if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[')) return false // IPv4/IPv6 literals
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false
    return true
  } catch { return false }
}

function safeFilename(name) {
  return (name || 'image.jpg')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 128)
}

import { rateLimit, clientIp } from '../lib/rateLimit.js'
import { lookup } from 'node:dns/promises'

// Reject hosts that resolve to loopback, private, link-local or CGNAT ranges.
export function isPrivateAddress(ip) {
  if (ip.includes(':')) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true
    const m = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return m ? isPrivateAddress(m[1]) : false
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}
async function resolvesPublic(raw) {
  try {
    const addrs = await lookup(new URL(decodeURIComponent(raw)).hostname, { all: true })
    return addrs.length > 0 && addrs.every(a => !isPrivateAddress(a.address))
  } catch { return false }
}

export default async function handler(req, res) {
  const rl = rateLimit(clientIp(req.headers))
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    res.status(429).send('Too many requests — slow down a moment and try again.'); return
  }

  const { url, name, mode } = req.query
  const importMode = mode === 'import'
  if (!url) { res.status(400).send('Missing url'); return }
  if (importMode ? !isSafeImportUrl(url) : !isSafeUrl(url)) { res.status(403).send('URL not allowed'); return }
  if (importMode && !(await resolvesPublic(url))) { res.status(403).send('URL not allowed'); return }

  try {
    const upstream = await fetch(decodeURIComponent(url), importMode ? { redirect: 'manual' } : undefined)
    if (importMode && upstream.status >= 300 && upstream.status < 400) { res.status(400).send('Redirects not allowed'); return }
    if (!upstream.ok) { res.status(upstream.status).send('Upstream error'); return }

    const ct = upstream.headers.get('content-type') || 'image/jpeg'
    if (importMode ? !ct.startsWith('image/') || ct.includes('svg') : (!ct.startsWith('image/') && !ct.startsWith('video/'))) {
      res.status(400).send(importMode ? 'Not an image' : 'Not an image or video'); return
    }
    if (importMode && Number(upstream.headers.get('content-length') || 0) > IMPORT_MAX_BYTES) {
      res.status(413).send('Image too large'); return
    }

    const buf = await upstream.arrayBuffer()
    if (importMode && buf.byteLength > IMPORT_MAX_BYTES) { res.status(413).send('Image too large'); return }
    res.setHeader('Content-Type', ct)
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(name)}"`)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.end(Buffer.from(buf))
  } catch (e) {
    res.status(500).send('Proxy error')
  }
}
