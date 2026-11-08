import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaceStore } from '../context/workspace'
import { STAT_KEYS, canHaveStats, refreshStats, sumStats, fmtNum, statsLine } from '../utils/publishing'
import { isRouteConnected } from '../utils/connections'

// Influencer profile → Overview: what her sent posts did over the last 30 days.
// Real numbers only, read from Ayrshare; posts sent through webhooks have none.
const card = { background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }
const label = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }
const LABELS = { views: 'Views', reach: 'Reach', likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Saves' }
const DAY = 864e5
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

export default function InfluencerInsights({ influencer }) {
  const [posts, setPosts] = useWorkspaceStore('muse_posts')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const since = Date.now() - 30 * DAY
  const sent = (posts || []).filter(p => p.influencerId === influencer.id && (p.status === 'posted' || (p.status === 'scheduled' && new Date(p.scheduledAt) <= Date.now())) && new Date(p.postedAt || p.scheduledAt).getTime() >= since)
  const measurable = sent.filter(canHaveStats)
  const withStats = measurable.filter(p => p.stats?.totals && Object.keys(p.stats.totals).length)
  const totals = sumStats(Object.fromEntries(withStats.map(p => [p.id, p.stats.totals])))
  const rankBy = ['views', 'reach', 'likes'].find(k => withStats.some(p => typeof p.stats.totals[k] === 'number')) || 'likes'
  const top = [...withStats].sort((a, b) => (b.stats.totals[rankBy] || 0) - (a.stats.totals[rankBy] || 0)).slice(0, 3)
  const last = Math.max(0, ...withStats.map(p => p.stats.at || 0))
  const name = influencer.name || 'This influencer'

  async function refresh() {
    setBusy(true); setError('')
    try {
      const byId = await refreshStats(measurable)
      setPosts(l => l.map(x => byId[x.id] ? { ...x, stats: byId[x.id] } : x))
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <section style={card} aria-labelledby={`ins-${influencer.id}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span id={`ins-${influencer.id}`} style={label}>Insights · last 30 days</span>
        {measurable.length > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {last > 0 && <small className="muse-muted">Updated {new Date(last).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>}
            <button type="button" className="muse-btn muse-btn-tonal" disabled={busy || !isRouteConnected('ayrshare')} onClick={refresh}>{busy ? 'Reading stats…' : 'Refresh stats'}</button>
          </span>
        )}
      </div>

      {error && <p className="muse-error" role="alert" style={{ fontSize: 13 }}>{error}</p>}

      {!sent.length ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{name} hasn’t posted in the last 30 days. Stats show up here once posts go out through Ayrshare.</p>
      ) : !measurable.length ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {sent.length} post{sent.length > 1 ? 's' : ''} sent, none through Ayrshare. Zapier, Make, n8n and webhooks can’t report stats back. <Link to="/settings?section=connections&c=ayrshare">Connect Ayrshare</Link> to see reach and engagement.
        </p>
      ) : !withStats.length ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{measurable.length} post{measurable.length > 1 ? 's' : ''} can report stats. Press Refresh stats to read them. New posts can take 24–48 hours to show numbers.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            {STAT_KEYS.filter(k => typeof totals[k] === 'number').map(k => (
              <div key={k}>
                <div className="muse-muted" style={{ fontSize: 12 }}>{LABELS[k]}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>{fmtNum(totals[k])}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="muse-muted" style={{ fontSize: 12, marginBottom: 'var(--space-2)' }}>Top posts by {LABELS[rankBy].toLowerCase()} · {withStats.length} of {sent.length} sent post{sent.length > 1 ? 's' : ''} measured</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {top.map(p => (
                <li key={p.id}>
                  <Link to={`/content?view=queue&open=${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--text-primary)', textDecoration: 'none' }}>
                    <span className="muse-thumb" style={{ width: 36, height: 44, flexShrink: 0, backgroundImage: p.mediaUrls?.[0] && !isVideo(p.mediaUrls[0]) ? `url(${p.mediaUrls[0]})` : undefined }}>{isVideo(p.mediaUrls?.[0]) && <em>Video</em>}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <strong style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption?.split('\n')[0]?.slice(0, 80) || 'No caption'}</strong>
                      <small className="muse-muted">{statsLine(p.stats.totals)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
