import { useState } from 'react'
import { useWorkspaceStore } from '../context/workspace'
import { Field, Empty, Dialog } from '../components/ui'
import { PLATFORMS, platformName } from '../utils/publishing'
import { newId } from '../utils/localJson'

// Track influencers and creators you benchmark against. You log a snapshot
// (followers, average views, posts per week) whenever you check them; growth is
// worked out from the snapshots. Stored per workspace.

// Outlier score: a post's views ÷ the creator's own average views (from their
// latest snapshot). Ranks what over-performed for that creator, not raw views.
export const outlierOf = (views, avg) => (views > 0 && avg > 0 ? views / avg : null)
const fmtX = x => (x == null ? '—' : `${x >= 10 ? Math.round(x) : x.toFixed(1)}×`)
function OutlierBadge({ x }) {
  if (x == null) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  const style = x >= 10
    ? { background: 'var(--accent)', color: 'var(--on-accent)' }
    : x >= 3 ? { background: 'var(--tonal)', color: 'var(--on-tonal)' } : { color: 'var(--text-secondary)' }
  return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', ...style }}>{fmtX(x)}</span>
}
const latestAvg = c => [...(c.snapshots || [])].sort((a, b) => a.at - b.at).reverse().find(sn => sn.avgViews > 0)?.avgViews ?? null

const fmt = n => n == null || n === '' ? '—' : Intl.NumberFormat([], { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n))
const RELATIONS = [
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'collab', label: 'Collab prospect' },
  { id: 'mine', label: 'Our account' },
]

function profileUrl(c) {
  if (c.url) return c.url
  const h = (c.handle || '').replace(/^@/, '')
  if (!h) return ''
  return ({
    instagram: `https://instagram.com/${h}`, tiktok: `https://www.tiktok.com/@${h}`, youtube: `https://www.youtube.com/@${h}`,
    threads: `https://www.threads.net/@${h}`, twitter: `https://x.com/${h}`, pinterest: `https://pinterest.com/${h}`,
  })[c.platform] || ''
}

export function TrackingView() {
  const [creators, setCreators] = useWorkspaceStore('muse_tracked')
  const [editing, setEditing] = useState(null)
  const [logging, setLogging] = useState(null)
  const [posting, setPosting] = useState(null)
  const [, setIdeas] = useWorkspaceStore('muse_ideas')
  const [q, setQ] = useState('')
  const [rel, setRel] = useState('all')
  const shown = creators
    .filter(c => rel === 'all' || c.relation === rel)
    .filter(c => !q || `${c.name} ${c.handle} ${c.niche}`.toLowerCase().includes(q.toLowerCase()))

  const save = c => setCreators(l => l.some(x => x.id === c.id) ? l.map(x => x.id === c.id ? c : x) : [c, ...l])

  const outliers = shown
    .flatMap(c => (c.posts || []).map(post => ({ c, post, avg: latestAvg(c), x: outlierOf(post.views, latestAvg(c)) })))
    .sort((a, b) => (b.x ?? -1) - (a.x ?? -1) || (b.post.views || 0) - (a.post.views || 0))
  const addToPlan = ({ c, post, x }) => {
    const id = newId('idea')
    const who = c.name || c.handle
    setIdeas(l => [{ id, title: `Remix ${who}: ${post.title || 'post'}`.slice(0, 300), notes: [x != null && `${fmtX(x)} their average views.`, post.url].filter(Boolean).join('\n'), source: { type: 'creator-post', creatorId: c.id, postId: post.id }, status: 'inbox', createdAt: Date.now() }, ...l])
    save({ ...c, posts: (c.posts || []).map(p => p.id === post.id ? { ...p, ideaId: id } : p) })
  }

  return (
    <div className="muse-stack">
      <div className="muse-filter-row">
        <button type="button" className="muse-btn muse-btn-filled" onClick={() => setEditing({})}>Track a creator</button>
        <input className="muse-input muse-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, handle, niche" aria-label="Search tracked creators" />
        {[{ id: 'all', label: 'All' }, ...RELATIONS].map(r => (
          <button key={r.id} type="button" className={`muse-chip${rel === r.id ? ' on' : ''}`} onClick={() => setRel(r.id)}>{r.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty title={creators.length ? 'No matches' : 'No one tracked yet'} action={!creators.length && <button type="button" className="muse-btn muse-btn-filled" onClick={() => setEditing({})}>Track a creator</button>}>
          Add the creators you learn from or compete with: handle, platform, niche and their numbers.
        </Empty>
      ) : (
        <div className="muse-table-wrap">
          <table className="muse-table">
            <thead>
              <tr><th>Creator</th><th>Platform</th><th>Niche</th><th className="num">Followers</th><th className="num">30-day change</th><th className="num">Avg views</th><th className="num">Posts / wk</th><th>Last checked</th><th /></tr>
            </thead>
            <tbody>
              {shown.map(c => {
                const snaps = [...(c.snapshots || [])].sort((a, b) => a.at - b.at)
                const last = snaps[snaps.length - 1]
                const monthAgo = Date.now() - 30 * 864e5
                const base = [...snaps].reverse().find(s => s.at <= monthAgo) || snaps[0]
                const delta = last && base && last !== base && last.followers != null && base.followers ? ((last.followers - base.followers) / base.followers) * 100 : null
                const url = profileUrl(c)
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name || c.handle}</strong>
                      <small>{url ? <a href={url} target="_blank" rel="noopener noreferrer">{c.handle || url}</a> : c.handle} · {RELATIONS.find(r => r.id === c.relation)?.label || 'Benchmark'}</small>
                    </td>
                    <td>{platformName(c.platform)}</td>
                    <td>{c.niche || '—'}</td>
                    <td className="num">{fmt(last?.followers)}</td>
                    <td className={`num ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>{delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}</td>
                    <td className="num">{fmt(last?.avgViews)}</td>
                    <td className="num">{last?.postsPerWeek ?? '—'}</td>
                    <td>{last ? new Date(last.at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}</td>
                    <td className="muse-row-actions">
                      <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setLogging(c)}>Log</button>
                      <button type="button" className="muse-btn muse-btn-text" onClick={() => setPosting(c)}>Add post</button>
                      <button type="button" className="muse-btn muse-btn-text" onClick={() => setEditing(c)}>Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {creators.length > 0 && (
        <section aria-labelledby="outliers-h" className="muse-stack">
          <div>
            <h3 id="outliers-h" style={{ fontSize: 'var(--font-size-title)', fontWeight: 'var(--font-weight-medium)' }}>Outlier posts</h3>
            <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-secondary)', marginTop: 2 }}>Views ÷ that creator's average, so you see what over-performed for them, not just what's big.</p>
          </div>
          {outliers.length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-tertiary)' }}>Use <strong>Add post</strong> on a creator to log a post's views. Log their average views too so it can be scored.</p>
          ) : (
            <div className="muse-table-wrap">
              <table className="muse-table">
                <thead>
                  <tr><th>Post</th><th className="num" aria-sort="descending">Outlier ▼</th><th className="num">Views</th><th className="num">Creator avg</th><th /></tr>
                </thead>
                <tbody>
                  {outliers.map(o => (
                    <tr key={o.post.id}>
                      <td>
                        <strong>{o.post.title || 'Untitled post'}</strong>
                        <small>{o.c.name || o.c.handle}{o.post.url && <> · <a href={o.post.url} target="_blank" rel="noopener noreferrer">Open</a></>}</small>
                      </td>
                      <td className="num"><OutlierBadge x={o.x} /></td>
                      <td className="num">{fmt(o.post.views)}</td>
                      <td className="num">{o.avg ? fmt(o.avg) : <span title="Log their average views to score this post">—</span>}</td>
                      <td className="muse-row-actions">
                        {o.post.ideaId
                          ? <span style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-secondary)' }}>In Plan ✓</span>
                          : <button type="button" className="muse-btn muse-btn-text" onClick={() => addToPlan(o)}>Add to Plan</button>}
                        <button type="button" className="muse-btn muse-btn-text" aria-label={`Remove ${o.post.title || 'post'}`} onClick={() => save({ ...o.c, posts: (o.c.posts || []).filter(p => p.id !== o.post.id) })}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {posting && <PostDialog creator={posting} onClose={() => setPosting(null)} onSave={post => { save({ ...posting, posts: [post, ...(posting.posts || [])] }); setPosting(null) }} />}
      {editing && <CreatorDialog creator={editing} onClose={() => setEditing(null)} onSave={c => { save(c); setEditing(null) }} onDelete={id => { setCreators(l => l.filter(x => x.id !== id)); setEditing(null) }} />}
      {logging && <SnapshotDialog creator={logging} onClose={() => setLogging(null)} onSave={s => { save({ ...logging, snapshots: [...(logging.snapshots || []), s] }); setLogging(null) }} />}
    </div>
  )
}

function CreatorDialog({ creator, onClose, onSave, onDelete }) {
  const [c, setC] = useState({ platform: 'instagram', relation: 'benchmark', ...creator })
  const set = patch => setC(x => ({ ...x, ...patch }))
  const isNew = !creator.id
  return (
    <Dialog title={isNew ? 'Track a creator' : 'Edit creator'} onClose={onClose} actions={<>
      {!isNew && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => onDelete(c.id)}>Stop tracking</button>}
      <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Cancel</button>
      <button type="button" className="muse-btn muse-btn-filled" disabled={!(c.name || c.handle)} onClick={() => onSave({ ...c, id: c.id || newId('trk'), createdAt: c.createdAt || Date.now() })}>Save</button>
    </>}>
      <div className="muse-form-grid">
        <Field label="Name"><input className="muse-input" autoFocus value={c.name || ''} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Handle"><input className="muse-input" value={c.handle || ''} onChange={e => set({ handle: e.target.value })} placeholder="@handle" /></Field>
        <Field label="Platform">
          <select className="muse-input" value={c.platform} onChange={e => set({ platform: e.target.value })}>
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Relation">
          <select className="muse-input" value={c.relation} onChange={e => set({ relation: e.target.value })}>
            {RELATIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Niche"><input className="muse-input" value={c.niche || ''} onChange={e => set({ niche: e.target.value })} placeholder="e.g. Fitness, clean girl" /></Field>
      <Field label="Profile link" hint="Optional. Built from the handle when empty."><input className="muse-input" value={c.url || ''} onChange={e => set({ url: e.target.value })} placeholder="https://" /></Field>
      <Field label="What to learn from them"><textarea className="muse-input" rows={3} value={c.notes || ''} onChange={e => set({ notes: e.target.value })} placeholder="Hooks, formats, posting times, brand partners…" /></Field>
    </Dialog>
  )
}

function SnapshotDialog({ creator, onClose, onSave }) {
  const last = [...(creator.snapshots || [])].sort((a, b) => a.at - b.at).pop() || {}
  const [s, setS] = useState({ followers: last.followers ?? '', avgViews: last.avgViews ?? '', postsPerWeek: last.postsPerWeek ?? '', note: '' })
  const num = v => (v === '' || v == null ? null : Number(String(v).replace(/[, ]/g, '')))
  return (
    <Dialog title={`Log ${creator.name || creator.handle}`} sub="Enter what you see on their profile today." onClose={onClose} actions={<>
      <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Cancel</button>
      <button type="button" className="muse-btn muse-btn-filled" onClick={() => onSave({ at: Date.now(), followers: num(s.followers), avgViews: num(s.avgViews), postsPerWeek: num(s.postsPerWeek), note: s.note })}>Save snapshot</button>
    </>}>
      <div className="muse-form-grid">
        <Field label="Followers"><input className="muse-input" inputMode="numeric" autoFocus value={s.followers} onChange={e => setS({ ...s, followers: e.target.value })} /></Field>
        <Field label="Avg views (last 10 posts)"><input className="muse-input" inputMode="numeric" value={s.avgViews} onChange={e => setS({ ...s, avgViews: e.target.value })} /></Field>
        <Field label="Posts per week"><input className="muse-input" inputMode="decimal" value={s.postsPerWeek} onChange={e => setS({ ...s, postsPerWeek: e.target.value })} /></Field>
      </div>
      <Field label="Note"><input className="muse-input" value={s.note} onChange={e => setS({ ...s, note: e.target.value })} placeholder="e.g. new series, viral post" /></Field>
    </Dialog>
  )
}

function PostDialog({ creator, onClose, onSave }) {
  const [p, setP] = useState({ title: '', url: '', views: '' })
  const num = v => (v === '' || v == null ? null : Number(String(v).replace(/[, ]/g, '')))
  const avg = latestAvg(creator)
  const views = num(p.views)
  const x = outlierOf(views, avg)
  const valid = views > 0 && (p.title.trim() || p.url.trim())
  return (
    <Dialog title={`Add a post from ${creator.name || creator.handle}`} sub={avg ? `Their logged average: ${fmt(avg)} views.` : 'No average views logged yet — use Log to add one so this post gets a score.'} onClose={onClose} actions={<>
      <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Cancel</button>
      <button type="button" className="muse-btn muse-btn-filled" disabled={!valid} onClick={() => onSave({ id: newId('post'), at: Date.now(), title: p.title.trim(), url: p.url.trim(), views })}>Save post</button>
    </>}>
      <Field label="What it is"><input className="muse-input" autoFocus value={p.title} onChange={e => setP({ ...p, title: e.target.value })} placeholder="e.g. 3 outfits under $50" /></Field>
      <Field label="Link" hint="Optional."><input className="muse-input" value={p.url} onChange={e => setP({ ...p, url: e.target.value })} placeholder="https://" /></Field>
      <Field label="Views" hint={x != null ? `Outlier score: ${fmtX(x)}` : undefined}><input className="muse-input" inputMode="numeric" value={p.views} onChange={e => setP({ ...p, views: e.target.value })} /></Field>
    </Dialog>
  )
}
