// Publishing goes through the posting service you connect in Settings → Connections
// (bring your own key). Muse Studio keeps the queue and the calendar; the provider
// does the actual posting, including scheduled times.
import { getPublishing, isPublishingConnected } from './connections'

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', needsMedia: true },
  { id: 'tiktok', name: 'TikTok', needsMedia: true, videoOnly: true },
  { id: 'youtube', name: 'YouTube Shorts', needsMedia: true, videoOnly: true },
  { id: 'threads', name: 'Threads' },
  { id: 'twitter', name: 'X' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'pinterest', name: 'Pinterest', needsMedia: true },
]
export const platformName = id => PLATFORMS.find(p => p.id === id)?.name || id

export const POST_STATUSES = {
  draft: 'Draft',
  planned: 'Planned',       // has a date, but not sent to a provider
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

// Sends a post now, or for a future time when post.scheduledAt is set.
// Resolves { status: 'posted'|'scheduled', providerId?, links? }; throws on failure.
export async function publishPost(post, accounts) {
  const cfg = getPublishing()
  if (!isPublishingConnected(cfg)) throw new Error('Connect a posting service in Settings → Connections first.')
  const targets = accounts.filter(a => post.accountIds?.includes(a.id))
  const future = post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now() + 60_000
  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      provider: cfg.provider,
      credentials: cfg.provider === 'ayrshare'
        ? { apiKey: cfg.apiKey, profileKey: cfg.profileKey || undefined }
        : { webhookUrl: cfg.webhookUrl, webhookSecret: cfg.webhookSecret || undefined },
      post: {
        caption: post.caption || '',
        mediaUrls: (post.mediaUrls || []).filter(u => /^https:\/\//i.test(u)),
        platforms: [...new Set(targets.map(a => a.platform))],
        accounts: targets.map(a => ({ platform: a.platform, handle: a.handle, profileKey: a.profileKey || undefined })),
        scheduledAt: future ? new Date(post.scheduledAt).toISOString() : undefined,
        title: post.title || undefined,
      },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || `Posting failed (${res.status})`)
  return { status: future ? 'scheduled' : 'posted', providerId: data.id, links: data.links || [] }
}

export async function testPublishing() {
  const cfg = getPublishing()
  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      provider: cfg.provider, test: true,
      credentials: cfg.provider === 'ayrshare'
        ? { apiKey: cfg.apiKey, profileKey: cfg.profileKey || undefined }
        : { webhookUrl: cfg.webhookUrl, webhookSecret: cfg.webhookSecret || undefined },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || `Test failed (${res.status})`)
  return data
}
