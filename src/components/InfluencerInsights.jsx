import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaceStore } from '../context/workspace'
import { STAT_KEYS, canHaveStats, refreshStats, sumStats, fmtNum, statsLine } from '../utils/publishing'
import { isRouteConnected } from '../utils/connections'
import { weekProgress, bestTimes, engagementOf, fmtBest } from '../utils/goals'
import GoalBar from './GoalBar'

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
  // Takeaways: up to three actions drawn from the numbers above. Nothing shows without data.
  const sched = influencer.postingSchedule
  const week = sched ? weekProgress(sched, posts, influencer.id) : null
  const best = sched ? bestTimes(sched, posts, influencer.id) : null
  const rateOf = p => { const v = p.stats.totals.views || p.stats.totals.reach; return v ? engagementOf(p.stats.totals) / v : null }
  const table = [...withStats].map(p => ({ p, eng: engagementOf(p.stats.totals), rate: rateOf(p) }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || b.eng - a.eng)
  const takeaways = []
  if (top[0]) takeaways.push({ key: 'repost', title: 'Repost your top post', sub: `${statsLine(top[0].stats.totals)}. Reuse its media and caption in a new post.`, to: '/content?compose=1', state: { influencerId: influencer.id, prefillCaption: top[0].caption || '', prefillMediaList: top[0].mediaUrls || [] } })
  if (week && !week.met) takeaways.push({ key: 'goal', title: `${week.short} more post${week.short === 1 ? '' : 's'} to hit the goal`, sub: `${week.total} of ${week.goal} this week · ${week.daysLeft} day${week.daysLeft === 1 ? '' : 's'} left`, to: '/content?view=queue' })
  if (best?.ready && best.slots.length) takeaways.push({ key: 'best', title: `Best time: ${fmtBest(best.slots[0])}`, sub: `${Math.round((best.slots[0].lift - 1) * 100)}% more engagement than her average, from ${best.have} measured posts.`, to: '/settings?section=accounts' })

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
      {sched && <GoalBar influencer={influencer} posts={posts} />}

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
          {takeaways.length > 0 && (
            <div className="muse-takeaways" aria-label="Takeaways">
              {takeaways.slice(0, 3).map(t => <Link key={t.key} to={t.to} state={t.state} className="muse-takeaway"><strong>{t.title}</strong><small>{t.sub}</small></Link>)}
            </div>
          )}
          {table.length > 1 && (
            <details>
              <summary className="muse-muted" style={{ fontSize: 13, cursor: 'pointer' }}>All measured posts by engagement rate</summary>
              <table className="muse-ins-table">
                <thead><tr><th>Post</th><th className="num">Engagement</th><th className="num">Rate</th></tr></thead>
                <tbody>
                  {table.map(({ p, eng, rate }) => (
                    <tr key={p.id}>
                      <td><Link to={`/content?view=queue&open=${p.id}`}>{p.caption?.split('\n')[0]?.slice(0, 60) || 'No caption'}</Link></td>
                      <td className="num">{fmtNum(eng)}</td>
                      <td className="num">{rate == null ? '—' : `${(rate * 100).toFixed(1)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </>
      )}
    </section>
  )
}
