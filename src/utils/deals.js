// Brand deal deliverables and the approval pack. Deals live in localStorage
// ('brand_deals', see store.jsx); a deliverable links to a Content post through
// post.deliverableId, so editing the post in Content is what the brand reviews.
import { newId } from './localJson'

export const DEAL_STATUSES = [
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'paid', label: 'Paid' },
]
export const DELIVERABLE_KINDS = [
  { id: 'reel', label: 'Reel' },
  { id: 'photo', label: 'Photo' },
  { id: 'story', label: 'Story' },
  { id: 'post', label: 'Post' },
]
export const APPROVAL = {
  none: 'Not sent',
  sent: 'Sent for approval',
  approved: 'Approved',
  changes: 'Changes requested',
}

export const newDeliverable = (kind = 'reel') => ({ id: newId('dlv'), kind, due: '', approval: 'none', note: '' })
export const postFor = (d, posts = []) => posts.find(p => p.deliverableId === d.id)
export const isPosted = post => post?.status === 'posted' || (post?.status === 'scheduled' && new Date(post.scheduledAt) <= Date.now())
export const kindLabel = id => DELIVERABLE_KINDS.find(k => k.id === id)?.label || id

// "2 of 3 posted · 1 approved"
export function dealProgress(deal, posts) {
  const list = deal.deliverables || []
  if (!list.length) return ''
  const posted = list.filter(d => isPosted(postFor(d, posts))).length
  const approved = list.filter(d => d.approval === 'approved').length
  return `${posted} of ${list.length} posted${approved ? ` · ${approved} approved` : ''}`
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')
// Only media the brand's browser can load: public https links and embedded data URLs.
const shareable = u => /^https:\/\//i.test(u || '') || /^data:image\//i.test(u || '')

// A single self-contained HTML file to send to the brand (email, Slack, Drive).
// No server is involved; the brand replies the way you sent it.
export function approvalPackHtml({ deal, influencer, items, from }) {
  const when = iso => (iso ? new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Date to be agreed')
  const rows = items.map(({ d, post }, i) => {
    const media = (post?.mediaUrls || []).filter(shareable)
    const hidden = (post?.mediaUrls || []).length - media.length
    return `
    <section class="item">
      <div class="num">${i + 1}</div>
      <div class="body">
        <h2>${esc(kindLabel(d.kind))}${d.due ? ` <small>· due ${esc(new Date(d.due).toLocaleDateString())}</small>` : ''}</h2>
        <div class="media">${media.map(u => isVideo(u) ? `<video src="${esc(u)}" controls playsinline></video>` : `<img src="${esc(u)}" alt="">`).join('') || '<p class="muted">Media not attached yet.</p>'}</div>
        ${hidden > 0 ? `<p class="muted">${hidden} file${hidden > 1 ? 's are' : ' is'} stored only in the creator’s browser and not included.</p>` : ''}
        <h3>Caption</h3>
        <p class="cap">${esc(post?.caption || 'Caption to follow.').replace(/\n/g, '<br>')}</p>
        ${post?.firstComment ? `<h3>First comment</h3><p class="cap">${esc(post.firstComment)}</p>` : ''}
        <h3>Goes live</h3>
        <p>${esc(when(post?.scheduledAt))}</p>
      </div>
    </section>`
  }).join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(deal.brand)} · content for approval</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#17171c;--muted:#6b6b76;--line:#e6e6ec;--acc:#5b4ff5}
@media (prefers-color-scheme:dark){:root{--bg:#121216;--fg:#f2f2f5;--muted:#a0a0ab;--line:#2a2a31;--acc:#a99fff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:32px 16px 64px}h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:0 0 12px}h2 small{color:var(--muted);font-weight:400}
h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:16px 0 4px}.muted{color:var(--muted)}
.how{border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:20px 0 8px}
.item{display:flex;gap:16px;border-top:1px solid var(--line);padding:24px 0}.num{flex:none;width:32px;height:32px;border-radius:50%;background:var(--acc);color:#fff;display:grid;place-items:center;font-weight:600}
.body{flex:1;min-width:0}.media{display:flex;gap:10px;flex-wrap:wrap}.media img,.media video{width:220px;max-width:100%;border-radius:12px;background:var(--line)}
.cap{white-space:normal;margin:0}
</style></head><body><main>
<h1>${esc(deal.brand)} · content for approval</h1>
<p class="muted">${esc(influencer?.name || 'Creator')}${from ? ` · from ${esc(from)}` : ''} · ${items.length} item${items.length > 1 ? 's' : ''} · prepared ${esc(new Date().toLocaleDateString())}</p>
<div class="how"><strong>How to reply</strong><br>Reply to the message this came with. For each numbered item, say <strong>Approved</strong> or describe the change you’d like.</div>
${rows}
</main></body></html>`
}
