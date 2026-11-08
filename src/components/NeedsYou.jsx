import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInfluencers, useBrandDeals } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { useLocalJSON } from '../utils/localJson'
import { RUNS_KEY, normalizeRuns } from '../utils/workflowRun'
import { CHECK_KEY } from '../utils/systemCheck'
import { freeSlots, fmtSlot } from '../utils/schedule'
import { postFor, isPosted, kindLabel } from '../utils/deals'
import { routeName } from '../utils/connections'

// Home → Needs you: everything waiting on a decision, across the app, in one list.
// Each row opens the exact place to fix it. Built from data already in this browser.
const DAY = 864e5
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')
const CHECK_NAMES = { higgsfield: 'Higgsfield', claude: 'Claude', elevenlabs: 'ElevenLabs', ayrshare: 'Ayrshare', zapier: 'Zapier', make: 'Make', n8n: 'n8n', webhook: 'Custom webhook' }

export function useNeedsYou() {
  const [influencers] = useInfluencers()
  const [deals] = useBrandDeals()
  const [posts] = useWorkspaceStore('muse_posts')
  const [rawRuns] = useLocalJSON(RUNS_KEY, [])
  const [checks] = useLocalJSON(CHECK_KEY, {})
  return useMemo(() => {
    const now = Date.now()
    const rows = []
    // 1. Posts that failed to send.
    for (const p of posts || []) {
      if (p.status !== 'failed') continue
      rows.push({ key: `post-${p.id}`, rank: 0, to: `/content?view=queue&open=${p.id}`, thumb: p.mediaUrls?.find(u => !isVideo(u)),
        title: p.caption?.split('\n')[0]?.slice(0, 80) || 'Post', sub: `Didn’t send${p.error ? `: ${p.error}` : ''}`, badge: 'Failed', tone: 'failed' })
    }
    // 2. Workflow runs waiting for review, or that stopped recently.
    for (const r of normalizeRuns(rawRuns)) {
      const recent = now - (r.updatedAt || r.createdAt || 0) < 3 * DAY
      if (r.status === 'review') rows.push({ key: `run-${r.id}`, rank: 1, to: `/workflows/${r.templateId}?run=${r.id}`, thumb: r.media && !isVideo(r.media) ? r.media : null, title: r.title, sub: `${r.influencerName || 'Workflow'} · ready for your review`, badge: 'Review', tone: 'approved' })
      else if ((r.status === 'failed' || r.status === 'stopped') && recent) rows.push({ key: `run-${r.id}`, rank: 2, to: `/workflows/${r.templateId}?run=${r.id}`, title: r.title, sub: r.error || 'Stopped before it finished', badge: r.status === 'failed' ? 'Failed' : 'Stopped', tone: 'failed' })
    }
    // 3. Brand deliverables: changes requested, or due within 3 days with nothing posted.
    for (const d of deals || []) {
      for (const dl of d.deliverables || []) {
        const post = postFor(dl, posts || [])
        if (isPosted(post)) continue
        const to = `/content?view=deals&deal=${d.id}`
        if (dl.approval === 'changes') rows.push({ key: `dl-${dl.id}`, rank: 1, to, thumb: d.image, title: `${d.brand} · ${kindLabel(dl.kind)}`, sub: `Changes requested${dl.note ? `: “${dl.note}”` : ''}`, badge: 'Changes', tone: 'failed' })
        else if (dl.due) {
          const due = new Date(`${dl.due}T23:59:59`).getTime()
          if (due - now < 3 * DAY) rows.push({ key: `dl-${dl.id}`, rank: due < now ? 0 : 2, to, thumb: d.image, title: `${d.brand} · ${kindLabel(dl.kind)}`, sub: `${due < now ? 'Overdue' : 'Due'} ${new Date(dl.due).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}${post ? '' : ' · no post yet'}`, badge: due < now ? 'Overdue' : 'Due soon', tone: due < now ? 'failed' : 'planned' })
        }
      }
    }
    // 4. Empty posting slots in the next 48 hours, one row per influencer.
    for (const inf of influencers || []) {
      if (!inf.postingSchedule) continue
      const free = freeSlots(inf.postingSchedule, posts || [], inf.id, { days: 3 }).filter(s => s.at.getTime() - now < 2 * DAY)
      if (free.length) rows.push({ key: `slots-${inf.id}`, rank: 3, to: '/content?view=queue', thumb: inf.mainImage || inf.image, title: `${inf.name || 'Influencer'} has ${free.length} empty slot${free.length > 1 ? 's' : ''}`, sub: `Next: ${fmtSlot(free[0].at)}`, badge: 'Empty', tone: 'draft' })
    }
    // 5. Connections that failed their last system check.
    const failed = Object.entries(checks || {}).filter(([, r]) => r?.state === 'fail').map(([id]) => CHECK_NAMES[id] || routeName(id))
    if (failed.length) rows.push({ key: 'checks', rank: 1, to: '/settings?section=check', title: `${failed.join(', ')} failed the system check`, sub: 'Fix it before your next post goes out', badge: 'Check', tone: 'failed' })
    return rows.sort((a, b) => a.rank - b.rank)
  }, [influencers, deals, posts, rawRuns, checks])
}

export default function NeedsYou() {
  const rows = useNeedsYou()
  if (!rows.length) return null
  const shown = rows.slice(0, 6)
  return (
    <section className="muse-recent muse-needs" aria-labelledby="needs-you">
      <div className="muse-section-head">
        <h2 id="needs-you">Needs you <span className="muse-checklist-count">{rows.length}</span></h2>
      </div>
      <ul className="muse-list muse-panel">
        {shown.map(r => (
          <li key={r.key}>
            <Link to={r.to} className="muse-list-row">
              <span className="muse-thumb" style={{ backgroundImage: r.thumb ? `url(${r.thumb})` : undefined }} />
              <span className="muse-list-main"><strong>{r.title}</strong><small>{r.sub}</small></span>
              <span className={`muse-badge ${r.tone || ''}`}>{r.badge}</span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length > shown.length && <p className="muse-field-hint">{rows.length - shown.length} more after you clear these.</p>}
    </section>
  )
}
