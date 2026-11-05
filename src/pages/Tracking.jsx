import { useState } from 'react'
import { useWorkspaceStore } from '../context/workspace'
import { Page, Field, Empty, Dialog } from '../components/ui'
import { PLATFORMS, platformName } from '../utils/publishing'
import { newId } from '../utils/localJson'

// Track influencers and creators you benchmark against. You log a snapshot
// (followers, average views, posts per week) whenever you check them; growth is
// worked out from the snapshots. Stored per workspace.

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

export default function Tracking() {
  const [creators, setCreators] = useWorkspaceStore('muse_tracked')
  const [editing, setEditing] = useState(null)
  const [logging, setLogging] = useState(null)
  const [q, setQ] = useState('')
  const [rel, setRel] = useState('all')
  const shown = creators
    .filter(c => rel === 'all' || c.relation === rel)
    .filter(c => !q || `${c.name} ${c.handle} ${c.niche}`.toLowerCase().includes(q.toLowerCase()))

  const save = c => setCreators(l => l.some(x => x.id === c.id) ? l.map(x => x.id === c.id ? c : x) : [c, ...l])

  return (
    <Page
      title="Tracked creators"
      sub="Benchmark influencers, competitors and collab prospects. Log a snapshot each time you check them."
      actions={<button type="button" className="muse-btn muse-btn-filled" onClick={() => setEditing({})}>Track a creator</button>}
      wide
    >
      <div className="muse-filter-row">
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
                      <button type="button" className="muse-btn muse-btn-text" onClick={() => setEditing(c)}>Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CreatorDialog creator={editing} onClose={() => setEditing(null)} onSave={c => { save(c); setEditing(null) }} onDelete={id => { setCreators(l => l.filter(x => x.id !== id)); setEditing(null) }} />}
      {logging && <SnapshotDialog creator={logging} onClose={() => setLogging(null)} onSave={s => { save({ ...logging, snapshots: [...(logging.snapshots || []), s] }); setLogging(null) }} />}
    </Page>
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
