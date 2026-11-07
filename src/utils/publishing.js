// Publishing goes through the posting service you connect in Settings → Connections
// (bring your own key). Muse Studio keeps the queue and the calendar; the provider
// does the actual posting, including scheduled times.
import { getPublishing, isPublishingConnected, isRouteConnected, routeForAccount, routeName, POSTING_ROUTES } from './connections'

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', needsMedia: true },
  { id: 'tiktok', name: 'TikTok', needsMedia: true, videoOnly: true },
  { id: 'youtube', name: 'YouTube Shorts', needsMedia: true, videoOnly: true },
  { id: 'threads', name: 'Threads' },
  { id: 'twitter', name: 'X' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'pinterest', name: 'Pinterest', needsMedia: true },
  { id: 'bluesky', name: 'Bluesky' },
]
export const platformName = id => PLATFORMS.find(p => p.id === id)?.name || id

export const POST_STATUSES = {
  draft: 'Draft',
  planned: 'Planned',       // has a date, but not sent to a provider
  approved: 'Approved',     // signed off; saving an edit moves it back to Draft/Planned
  scheduled: 'Scheduled',   // accepted by the provider for a future time
  posted: 'Posted',
  failed: 'Failed',
}

const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

// Checks a post can be sent; returns a list of plain-language problems.
export function validatePost(post, accounts) {
  const problems = []
  const targets = accounts.filter(a => post.accountIds?.includes(a.id))
  if (!targets.length) problems.push('Pick at least one account.')
  if (!post.caption?.trim() && !post.mediaUrls?.length) problems.push('Add a caption or media.')
  const publicMedia = (post.mediaUrls || []).filter(u => /^https:\/\//i.test(u))
  if ((post.mediaUrls || []).length !== publicMedia.length) problems.push('Some media is stored only in this browser. Posting needs public https links (generated media from Higgsfield works).')
  for (const a of targets) {
    const p = PLATFORMS.find(x => x.id === a.platform)
    if (p?.needsMedia && !publicMedia.length) problems.push(`${p.name} needs a photo or video.`)
    if (p?.videoOnly && publicMedia.length && !publicMedia.some(isVideo)) problems.push(`${p.name} needs a video.`)
  }
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

// Sends a post now, or for a future time when post.scheduledAt is set. Accounts are
// grouped by their posting route, one request per route. `opts.routes` limits the
// send to those routes (Retry re-sends only the routes that failed).
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
    try {
      const data = await callPublish({
        ...routeRequest(route, cfg),
        post: {
          caption: post.caption || '',
          mediaUrls: (post.mediaUrls || []).filter(u => /^https:\/\//i.test(u)),
          platforms: [...new Set(list.map(a => a.platform))],
          accounts: list.map(a => ({ platform: a.platform, handle: a.handle, profileKey: a.profileKey || undefined })),
          scheduledAt: future ? new Date(post.scheduledAt).toISOString() : undefined,
          title: post.title || undefined,
          via: route,
        },
      })
      return { route, ok: true, providerId: data.id, links: data.links || [], accountIds: list.map(a => a.id), at }
    } catch (e) {
      return { route, ok: false, error: e.message || 'Failed', accountIds: list.map(a => a.id), at }
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

// Checks one route's credentials (Ayrshare: lists linked accounts; webhook: sends a test event).
export async function testPublishing(routeId) {
  const cfg = getPublishing()
  if (!isRouteConnected(routeId, cfg)) throw new Error('Add the details first.')
  return callPublish({ ...routeRequest(routeId, cfg), test: true })
}
