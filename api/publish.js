// Posting proxy for the posting service the user connects in Settings → Connections.
// The browser sends the user's own credentials with each request; nothing is stored here.
//   provider "ayrshare": https://api.ayrshare.com/api/post (Bearer API key, optional Profile-Key)
//   provider "webhook":  POSTs the post as JSON to the user's https automation URL
//                        (Zapier / Make / n8n). Public hosts only, no redirects.
import { createHmac } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { rateLimit, clientIp } from '../lib/rateLimit.js'
import { isSafeImportUrl, isPrivateAddress } from './img-proxy.js'

const AYRSHARE = 'https://api.ayrshare.com/api'
const AYRSHARE_PLATFORMS = new Set(['instagram', 'tiktok', 'youtube', 'threads', 'twitter', 'facebook', 'linkedin', 'pinterest', 'bluesky', 'reddit', 'telegram', 'gmb'])
const MAX_CAPTION = 5000

async function resolvesPublic(raw) {
  try {
    const addrs = await lookup(new URL(raw).hostname, { all: true })
    return addrs.length > 0 && addrs.every(a => !isPrivateAddress(a.address))
  } catch { return false }
}

function cleanPost(p = {}) {
  const platforms = [...new Set((p.platforms || []).filter(x => AYRSHARE_PLATFORMS.has(x)))]
  const mediaUrls = (p.mediaUrls || []).filter(u => typeof u === 'string' && /^https:\/\//i.test(u)).slice(0, 10)
  const scheduledAt = p.scheduledAt && !Number.isNaN(Date.parse(p.scheduledAt)) ? new Date(p.scheduledAt).toISOString() : undefined
  return {
    caption: String(p.caption || '').slice(0, MAX_CAPTION),
    mediaUrls, platforms, scheduledAt,
    title: p.title ? String(p.title).slice(0, 100) : undefined,
    via: ['zapier', 'make', 'n8n', 'webhook', 'ayrshare'].includes(p.via) ? p.via : undefined,
    postId: p.postId ? String(p.postId).slice(0, 80) : undefined,
    instagramFormat: ['post', 'reel', 'story'].includes(p.instagramFormat) ? p.instagramFormat : undefined,
    firstComment: p.firstComment ? String(p.firstComment).slice(0, 2200) : undefined,
    accounts: Array.isArray(p.accounts) ? p.accounts.slice(0, 20).map(a => ({ platform: String(a.platform || ''), handle: String(a.handle || '').slice(0, 100) })) : [],
  }
}

const cleanIds = ids => (Array.isArray(ids) ? ids : []).map(String).filter(x => /^[A-Za-z0-9_-]{4,80}$/.test(x)).slice(0, 20)

async function ayrshare(creds, post, test, cancel) {
  if (!creds?.apiKey) return { status: 400, json: { ok: false, error: 'Missing Ayrshare API key.' } }
  const headers = { Authorization: `Bearer ${creds.apiKey}`, 'Content-Type': 'application/json' }
  if (creds.profileKey) headers['Profile-Key'] = String(creds.profileKey)
  if (test) {
    const r = await fetch(`${AYRSHARE}/user`, { headers })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { ok: false, error: d.message || 'Ayrshare rejected the key.' } }
    return { status: 200, json: { ok: true, accounts: d.activeSocialAccounts || [] } }
  }
  if (cancel) {
    // Scheduled posts are deleted before they go out (docs: DELETE /api/post).
    const ids = cleanIds(cancel.ids)
    if (!ids.length) return { status: 400, json: { ok: false, error: 'No Ayrshare post id to cancel.' } }
    const r = await fetch(`${AYRSHARE}/post`, { method: 'DELETE', headers, body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { bulk: ids }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || d.status === 'error') return { status: r.ok ? 502 : r.status, json: { ok: false, error: d.message || 'Ayrshare could not cancel this post.' } }
    return { status: 200, json: { ok: true } }
  }
  if (!post.platforms.length) return { status: 400, json: { ok: false, error: 'No supported platforms selected.' } }
  const body = { post: post.caption, platforms: post.platforms }
  if (post.platforms.includes('instagram') && post.instagramFormat === 'story') body.instagramOptions = { stories: true }
  if (post.platforms.includes('instagram') && post.instagramFormat === 'reel') body.instagramOptions = { reels: true, shareReelsFeed: true }
  if (post.firstComment) body.firstComment = { comment: post.firstComment }
  if (post.mediaUrls.length) body.mediaUrls = post.mediaUrls
  if (post.scheduledAt) body.scheduleDate = post.scheduledAt
  if (post.platforms.includes('youtube')) body.youTubeOptions = { title: post.title || post.caption.slice(0, 90) || 'New video', shorts: true }
  const r = await fetch(`${AYRSHARE}/post`, { method: 'POST', headers, body: JSON.stringify(body) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || d.status === 'error') {
    const detail = (d.posts?.[0]?.errors || d.errors || []).map(e => e.message).filter(Boolean).join(' · ')
    return { status: r.ok ? 502 : r.status, json: { ok: false, error: detail || d.message || 'Ayrshare could not post this.' } }
  }
  const p0 = d.posts?.[0] || d
  return { status: 200, json: { ok: true, id: p0.id || d.id, links: (p0.postIds || []).map(x => x.postUrl).filter(Boolean) } }
}

async function webhook(creds, post, test, cancel) {
  const url = creds?.webhookUrl
  if (!url || !isSafeImportUrl(url)) return { status: 400, json: { ok: false, error: 'The webhook URL must be a public https address.' } }
  if (!(await resolvesPublic(url))) return { status: 400, json: { ok: false, error: 'The webhook URL must point to a public host.' } }
  const sentAt = new Date().toISOString()
  const payload = JSON.stringify(test
    ? { type: 'muse.test', sentAt }
    : cancel
      ? { type: 'muse.post.cancelled', sentAt, postId: cancel.postId ? String(cancel.postId).slice(0, 80) : undefined }
      : { type: 'muse.post', sentAt, ...post })
  const headers = { 'Content-Type': 'application/json', 'User-Agent': 'MuseStudio-Publisher/1.0' }
  if (creds.webhookSecret) headers['X-Muse-Signature'] = 'sha256=' + createHmac('sha256', String(creds.webhookSecret)).update(payload).digest('hex')
  const r = await fetch(url, { method: 'POST', headers, body: payload, redirect: 'manual' })
  if (r.status >= 300 && r.status < 400) return { status: 400, json: { ok: false, error: 'The webhook redirected; use the final URL.' } }
  if (!r.ok) return { status: 502, json: { ok: false, error: `The webhook answered ${r.status}.` } }
  return { status: 200, json: { ok: true } }
}

export async function handlePublish(body = {}) {
  const { provider, credentials, test } = body
  const cancel = body.cancel && typeof body.cancel === 'object' ? body.cancel : null
  const post = cleanPost(body.post)
  try {
    if (provider === 'ayrshare') return await ayrshare(credentials, post, !!test, cancel)
    if (provider === 'webhook') return await webhook(credentials, post, !!test, cancel)
    return { status: 400, json: { ok: false, error: 'Unknown posting provider.' } }
  } catch (e) {
    return { status: 502, json: { ok: false, error: 'Could not reach the posting service.' } }
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })
  const rl = rateLimit(clientIp(req.headers))
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    return res.status(429).json({ ok: false, error: 'Too many requests. Try again in a moment.' })
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { status, json } = await handlePublish(body)
  return res.status(status).json(json)
}
