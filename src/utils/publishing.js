// Publishing goes through the posting service you connect in Settings → Connections
// (bring your own key). Muse Studio keeps the queue and the calendar; the provider
// does the actual posting, including scheduled times.
import { getPublishing, isPublishingConnected, isRouteConnected, routeForAccount, routeName, POSTING_ROUTES } from './connections'

// limit: caption characters each network accepts (YouTube: the description).
export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', needsMedia: true, limit: 2200 },
  { id: 'tiktok', name: 'TikTok', needsMedia: true, videoOnly: true, limit: 2200 },
  { id: 'youtube', name: 'YouTube Shorts', needsMedia: true, videoOnly: true, limit: 5000 },
  { id: 'threads', name: 'Threads', limit: 500 },
  { id: 'twitter', name: 'X', limit: 280 },
  { id: 'facebook', name: 'Facebook', limit: 63206 },
  { id: 'linkedin', name: 'LinkedIn', limit: 3000 },
  { id: 'pinterest', name: 'Pinterest', needsMedia: true, limit: 500 },
  { id: 'bluesky', name: 'Bluesky', limit: 300 },
]
export const platformName = id => PLATFORMS.find(p => p.id === id)?.name || id
export const IG_FORMATS = [{ id: 'post', label: 'Post' }, { id: 'reel', label: 'Reel' }, { id: 'story', label: 'Story' }]

// The caption a platform gets: its own version if it has one, else the shared caption.
export const hasOwnCaption = (post, platform) => typeof post.captions?.[platform] === 'string'
export const captionFor = (post, platform) => (hasOwnCaption(post, platform) ? post.captions[platform] : post.caption || '')

export const POST_STATUSES = {
  draft: 'Draft',
  planned: 'Planned',       // has a date, but not sent to a provider
  approved: 'Approved',     // signed off; saving an edit moves it back to Draft/Planned
  scheduled: 'Scheduled',   // accepted by the provider for a future time
  posted: 'Posted',
  failed: 'Failed',
}

const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

// Per-platform readiness for the selected accounts: [{ platform, name, length, limit, problems }].
export function platformChecks(post, accounts) {
  const targets = accounts.filter(a => post.accountIds?.includes(a.id))
  const publicMedia = (post.mediaUrls || []).filter(u => /^https:\/\//i.test(u))
  return [...new Set(targets.map(a => a.platform))].map(id => {
    const p = PLATFORMS.find(x => x.id === id) || { id, name: id }
    const text = captionFor(post, id)
    const problems = []
    if (p.limit && text.length > p.limit) problems.push(`Caption is ${text.length - p.limit} over the ${p.limit.toLocaleString()}-character limit.`)
    if (p.needsMedia && !publicMedia.length) problems.push('Needs a photo or video.')
    if (p.videoOnly && publicMedia.length && !publicMedia.some(isVideo)) problems.push('Needs a video.')
    if (id === 'instagram' && post.igFormat === 'reel' && publicMedia.length && !publicMedia.some(isVideo)) problems.push('A Reel needs a video.')
    if (id === 'instagram' && post.igFormat === 'story' && publicMedia.length > 1) problems.push('A Story takes one photo or video.')
    if (!text.trim() && !publicMedia.length) problems.push('Add a caption or media.')
    return { platform: id, name: p.name, length: text.length, limit: p.limit, problems }
  })
}

// Checks a post can be sent; returns a list of plain-language problems.
export function validatePost(post, accounts) {
  const problems = []
  const targets = accounts.filter(a => post.accountIds?.includes(a.id))
  if (!targets.length) problems.push('Pick at least one account.')
  const hasText = post.caption?.trim() || Object.values(post.captions || {}).some(t => t?.trim())
  if (!hasText && !post.mediaUrls?.length) problems.push('Add a caption or media.')
  const publicMedia = (post.mediaUrls || []).filter(u => /^https:\/\//i.test(u))
  if ((post.mediaUrls || []).length !== publicMedia.length) problems.push('Some media is stored only in this browser. Posting needs public https links (generated media from Higgsfield works).')
  for (const c of platformChecks(post, accounts)) for (const pr of c.problems) problems.push(`${c.name}: ${pr}`)
  return [...new Set(problems)]
}

// What /api/publish needs for one route: Ayrshare or a webhook (Zapier, Make, n8n, custom).
function routeRequest(routeId, cfg) {
  const r = cfg.routes[routeId] || {}
  return POSTING_ROUTES.find(x => x.id === routeId)?.kind === 'ayrshare'
    ? { provider: 'ayrshare', credentials: { apiKey: r.apiKey, profileKey: r.profileKey || undefined } }
    : { provider: 'webhook', credentials: { webhookUrl: r.url, webhookSecret: r.secret || undefined } }
}

async function callPublish(body) {
  const res = await fetch('/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

// Accounts on one route, split by the caption each platform gets (the posting services
// take one text per request, so different captions mean separate requests).
function captionGroups(post, list) {
  const groups = new Map()
  for (const a of list) {
    const text = captionFor(post, a.platform)
    if (!groups.has(text)) groups.set(text, [])
    groups.get(text).push(a)
  }
  return [...groups.entries()]
}

// Sends a post now, or for a future time when post.scheduledAt is set. Accounts are
// grouped by their posting route (and by caption within a route). `opts.routes` limits
// the send to those routes (Retry re-sends only the routes that failed).
// Resolves { status, routeResults, error, providerId, links } and never throws for a
// route failure: status is 'failed' if any route failed, and routeResults say which.
export async function publishPost(post, accounts, opts = {}) {
  const cfg = getPublishing()
  if (!isPublishingConnected(cfg)) throw new Error('Connect a posting service in Settings → Connections first.')
  const targets = accounts.filter(a => post.accountIds?.includes(a.id))
  const future = post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now() + 60_000
  const groups = {}
  for (const a of targets) (groups[routeForAccount(a, cfg)] ||= []).push(a)
  if (opts.routes) for (const r of Object.keys(groups)) if (!opts.routes.includes(r)) delete groups[r]
  const at = new Date().toISOString()
  const fresh = await Promise.all(Object.entries(groups).map(async ([route, list]) => {
    const sent = []
    try {
      for (const [caption, sub] of captionGroups(post, list)) {
        const platforms = [...new Set(sub.map(a => a.platform))]
        const data = await callPublish({
          ...routeRequest(route, cfg),
          post: {
            postId: post.id,
            caption,
            mediaUrls: (post.mediaUrls || []).filter(u => /^https:\/\//i.test(u)),
            platforms,
            accounts: sub.map(a => ({ platform: a.platform, handle: a.handle, profileKey: a.profileKey || undefined })),
            scheduledAt: future ? new Date(post.scheduledAt).toISOString() : undefined,
            title: post.title || undefined,
            instagramFormat: platforms.includes('instagram') ? post.igFormat || 'post' : undefined,
            firstComment: post.firstComment?.trim() || undefined,
            via: route,
          },
        })
        sent.push(data)
      }
      return { route, ok: true, providerId: sent.map(d => d.id).filter(Boolean).join(',') || undefined, links: sent.flatMap(d => d.links || []), accountIds: list.map(a => a.id), at }
    } catch (e) {
      // A partial send (some captions went out) is reported so it can be cancelled.
      const providerId = sent.map(d => d.id).filter(Boolean).join(',') || undefined
      return { route, ok: false, error: e.message || 'Failed', providerId, partial: sent.length > 0, accountIds: list.map(a => a.id), at }
    }
  }))
  // Keep earlier successes for routes not re-sent this time.
  const routeResults = [...(post.routeResults || []).filter(r => !fresh.some(f => f.route === r.route)), ...fresh]
  const failed = routeResults.filter(r => !r.ok)
  const ok = routeResults.filter(r => r.ok)
  return {
    status: failed.length ? 'failed' : future ? 'scheduled' : 'posted',
    routeResults,
    error: failed.map(r => `${routeName(r.route)}: ${r.error}`).join(' · ') + (failed.length && ok.length ? ` (sent through ${ok.map(r => routeName(r.route)).join(', ')})` : ''),
    providerId: ok.map(r => r.providerId).filter(Boolean).join(',') || undefined,
    links: ok.flatMap(r => r.links || []),
  }
}

// Routes a failed post still needs (for Retry).
export const failedRoutes = post => (post.routeResults || []).filter(r => !r.ok).map(r => r.route)

// Pulls a scheduled post back from every route it was sent through: Ayrshare deletes it,
// webhook routes receive a muse.post.cancelled event with the same postId.
// Resolves [{ route, ok, error }]; never throws for a route failure.
export async function cancelPost(post) {
  const cfg = getPublishing()
  const sent = (post.routeResults || []).filter(r => r.ok || r.partial)
  return Promise.all(sent.map(async r => {
    if (!isRouteConnected(r.route, cfg)) return { route: r.route, ok: false, error: `${routeName(r.route)} is no longer connected. Cancel it in ${routeName(r.route)} directly.` }
    try {
      await callPublish({ ...routeRequest(r.route, cfg), cancel: { postId: post.id, ids: String(r.providerId || '').split(',').filter(Boolean) }, post: { via: r.route } })
      return { route: r.route, ok: true }
    } catch (e) { return { route: r.route, ok: false, error: e.message || 'Failed' } }
  }))
}

// Checks one route's credentials (Ayrshare: lists linked accounts; webhook: sends a test event).
export async function testPublishing(routeId) {
  const cfg = getPublishing()
  if (!isRouteConnected(routeId, cfg)) throw new Error('Add the details first.')
  return callPublish({ ...routeRequest(routeId, cfg), test: true })
}

// ---- Stats (Ayrshare only; webhook routes can't report back) ----
export const STAT_KEYS = ['views', 'reach', 'likes', 'comments', 'shares', 'saves']
export const statsIdsOf = post => (post.routeResults || []).filter(r => r.ok && r.route === 'ayrshare' && r.providerId).flatMap(r => String(r.providerId).split(',').filter(Boolean))
export const canHaveStats = post => statsIdsOf(post).length > 0

export function sumStats(byPlatform = {}) {
  const t = {}
  for (const s of Object.values(byPlatform)) for (const k of STAT_KEYS) if (typeof s[k] === 'number') t[k] = (t[k] || 0) + s[k]
  return t
}
export const fmtNum = n => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}k` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n))

// Reads current stats for sent posts. Resolves { [postId]: { at, byPlatform, totals, error } }.
export async function refreshStats(posts) {
  const cfg = getPublishing()
  if (!isRouteConnected('ayrshare', cfg)) throw new Error('Stats come from Ayrshare. Connect it in Settings → Connections.')
  const owner = {}
  for (const p of posts) for (const id of statsIdsOf(p)) owner[id] = p.id
  const ids = Object.keys(owner)
  const out = {}
  const at = Date.now()
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20)
    const data = await callPublish({ ...routeRequest('ayrshare', cfg), stats: { ids: chunk }, post: { via: 'ayrshare' } })
    for (const id of chunk) {
      const r = data.posts?.[id] || {}
      const cur = (out[owner[id]] ||= { at, byPlatform: {}, errors: [] })
      Object.assign(cur.byPlatform, r.platforms || {})
      if (r.error) cur.errors.push(r.error)
    }
  }
  for (const s of Object.values(out)) { s.totals = sumStats(s.byPlatform); s.error = s.errors.join(' · ') || undefined; delete s.errors }
  return out
}

// One line for a post: "12.4k views · 520 likes · 31 comments".
export function statsLine(totals = {}) {
  const parts = [['views', 'views'], ['likes', 'likes'], ['comments', 'comments'], ['saves', 'saves'], ['shares', 'shares']]
    .filter(([k]) => typeof totals[k] === 'number').map(([k, l]) => `${fmtNum(totals[k])} ${totals[k] === 1 ? l.slice(0, -1) : l}`)
  return parts.join(' · ')
}

// Comments inbox (Ayrshare): read the comments on a sent post, and reply to one.
export async function loadComments(post) {
  const cfg = getPublishing()
  if (!isRouteConnected('ayrshare', cfg)) throw new Error('Comments come from Ayrshare. Connect it in Settings → Connections.')
  const all = []
  for (const id of statsIdsOf(post)) {
    const data = await callPublish({ ...routeRequest('ayrshare', cfg), comments: { id }, post: { via: 'ayrshare' } })
    all.push(...(data.comments || []))
  }
  return all
}
export async function replyToComment(comment, text) {
  const cfg = getPublishing()
  return callPublish({ ...routeRequest('ayrshare', cfg), reply: { commentId: comment.id, platform: comment.platform, comment: text }, post: { via: 'ayrshare' } })
}
