import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Page, Seg, Field, Empty, Dialog, InfluencerSelect, SkillAssist } from '../components/ui'
import Library from './Library'
import { collectLibrary } from '../utils/library'
import { PLATFORMS, POST_STATUSES, platformName, validatePost, publishPost } from '../utils/publishing'
import { isPublishingConnected } from '../utils/connections'
import { influencerContext } from '../utils/claudeAssist'
import { newId } from '../utils/localJson'

// Content: one list of posts with three views (Calendar · List · Media).
// Status and account are filters. Social accounts live in Settings.

const VIEWS = [{ id: 'calendar', label: 'Calendar' }, { id: 'list', label: 'List' }, { id: 'media', label: 'Media' }]
const STATUS_FILTERS = [{ id: 'all', label: 'All posts' }, ...Object.entries(POST_STATUSES).map(([id, label]) => ({ id, label }))]
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')
const toLocalInput = iso => {
  if (!iso) return ''
  const d = new Date(iso); const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const when = iso => new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const narrow = () => typeof window !== 'undefined' && window.innerWidth < 720

export default function Content() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const view = VIEWS.some(v => v.id === params.get('view')) ? params.get('view') : (narrow() ? 'list' : 'calendar')
  const [posts, setPosts] = useWorkspaceStore('muse_posts')
  const [accounts] = useWorkspaceStore('muse_accounts')
  const [status, setStatus] = useState('all')
  const [account, setAccount] = useState('all')
  const [composing, setComposing] = useState(null)

  useEffect(() => {
    const openId = params.get('open')
    if (params.get('compose') === '1') {
      setComposing({ caption: location.state?.prefillCaption || '', mediaUrls: location.state?.prefillMedia ? [location.state.prefillMedia] : [], influencerId: location.state?.influencerId || null })
      setParams(p => { p.delete('compose'); return p }, { replace: true })
      if (location.state?.prefillCaption || location.state?.prefillMedia) navigate(location.pathname + location.search, { replace: true, state: {} })
    } else if (openId) {
      const p = posts.find(x => x.id === openId)
      if (p) setComposing(p)
      setParams(q => { q.delete('open'); return q }, { replace: true })
    }
  }, [params]) // eslint-disable-line

  const setView = v => setParams(q => { q.set('view', v); return q }, { replace: true })
  const save = p => setPosts(l => l.some(x => x.id === p.id) ? l.map(x => x.id === p.id ? p : x) : [p, ...l])
  const shown = posts.filter(p => (status === 'all' || (p.status || 'draft') === status) && (account === 'all' || p.accountIds?.includes(account)))

  return (
    <Page
      title="Content"
      wide
      actions={<>
        <Seg options={VIEWS} value={view} onChange={setView} label="View" />
        {view !== 'media' && <>
          <select className="muse-input muse-input-sm" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
            {STATUS_FILTERS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {accounts.length > 0 && (
            <select className="muse-input muse-input-sm" value={account} onChange={e => setAccount(e.target.value)} aria-label="Filter by account">
              <option value="all">All accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{platformName(a.platform)} {a.handle}</option>)}
            </select>
          )}
        </>}
        <button type="button" className="muse-btn muse-btn-filled" onClick={() => setComposing({})}>New post</button>
      </>}
    >
      {view === 'calendar' && <Calendar posts={shown} onOpen={setComposing} onNewOn={d => setComposing({ scheduledAt: d.toISOString() })} />}
      {view === 'list' && <List posts={shown} accounts={accounts} onOpen={setComposing} onNew={() => setComposing({})} filtered={shown.length !== posts.length} />}
      {view === 'media' && <Library embedded />}

      {composing && (
        <Composer
          initial={composing}
          accounts={accounts}
          onClose={() => setComposing(null)}
          onSave={p => { save(p); setComposing(null) }}
          onDelete={id => { setPosts(l => l.filter(x => x.id !== id)); setComposing(null) }}
        />
      )}
    </Page>
  )
}

function List({ posts, accounts, onOpen, onNew, filtered }) {
  const [influencers] = useInfluencers()
  if (!posts.length) {
    return filtered
      ? <Empty title="No posts match these filters" />
      : <Empty title="No posts yet" action={<button type="button" className="muse-btn muse-btn-filled" onClick={onNew}>New post</button>}>Compose a post from your media, or use Post on any photo in Media.</Empty>
  }
  const sorted = [...posts].sort((a, b) => (b.scheduledAt ? new Date(b.scheduledAt) : b.createdAt) - (a.scheduledAt ? new Date(a.scheduledAt) : a.createdAt))
  return (
    <ul className="muse-list muse-panel">
      {sorted.map(p => {
        const who = (influencers || []).find(i => i.id === p.influencerId)
        const targets = accounts.filter(a => p.accountIds?.includes(a.id))
        return (
          <li key={p.id}>
            <button type="button" className="muse-list-row" onClick={() => onOpen(p)}>
              <span className="muse-thumb" style={{ backgroundImage: p.mediaUrls?.[0] && !isVideo(p.mediaUrls[0]) ? `url(${p.mediaUrls[0]})` : undefined }}>{p.mediaUrls?.length > 1 && <em>{p.mediaUrls.length}</em>}</span>
              <span className="muse-list-main">
                <strong>{p.caption?.split('\n')[0]?.slice(0, 80) || 'No caption'}</strong>
                <small>{[p.scheduledAt && when(p.scheduledAt), targets.map(a => `${platformName(a.platform)} ${a.handle}`).join(', ') || 'No accounts', who?.name].filter(Boolean).join(' · ')}</small>
                {p.error && <small className="muse-error">{p.error}</small>}
              </span>
              <span className={`muse-badge ${p.status}`}>{POST_STATUSES[p.status || 'draft']}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Calendar({ posts, onOpen, onNewOn }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const days = useMemo(() => {
    const start = new Date(cursor); start.setDate(1 - ((start.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [cursor])
  const byDay = useMemo(() => {
    const m = {}
    for (const p of posts) {
      const at = p.scheduledAt || p.postedAt
      if (!at) continue
      ;(m[new Date(at).toDateString()] ||= []).push(p)
    }
    return m
  }, [posts])
  const today = new Date().toDateString()
  const shift = n => setCursor(c => { const d = new Date(c); d.setMonth(d.getMonth() + n); return d })

  return (
    <div className="muse-calendar">
      <div className="muse-cal-head">
        <button type="button" className="muse-btn muse-btn-text" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <h3>{cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h3>
        <button type="button" className="muse-btn muse-btn-text" onClick={() => shift(1)} aria-label="Next month">›</button>
        <button type="button" className="muse-btn muse-btn-tonal muse-cal-today" onClick={() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setCursor(d) }}>Today</button>
      </div>
      <div className="muse-cal-scroll">
        <div className="muse-cal-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d} className="muse-cal-dow">{d}</span>)}
          {days.map(d => {
            const items = byDay[d.toDateString()] || []
            const out = d.getMonth() !== cursor.getMonth()
            return (
              <div key={d.toISOString()} className={`muse-cal-day${out ? ' out' : ''}${d.toDateString() === today ? ' today' : ''}`}>
                <button type="button" className="muse-cal-num" onClick={() => { const x = new Date(d); x.setHours(18, 0, 0, 0); onNewOn(x) }} aria-label={`New post on ${d.toDateString()}`}>{d.getDate()}</button>
                {items.slice(0, 3).map(p => (
                  <button key={p.id} type="button" className={`muse-cal-item ${p.status}`} onClick={() => onOpen(p)} title={p.caption}>
                    {new Date(p.scheduledAt || p.postedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {p.caption?.slice(0, 24) || 'Post'}
                  </button>
                ))}
                {items.length > 3 && <small>+{items.length - 3} more</small>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Composer({ initial, accounts, onClose, onSave, onDelete }) {
  const [influencers] = useInfluencers()
  const library = useMemo(() => collectLibrary(influencers || []), [influencers])
  const [p, setP] = useState(() => ({ caption: '', mediaUrls: [], accountIds: [], status: 'draft', ...initial }))
  const [picking, setPicking] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState(false)
  const set = patch => setP(x => ({ ...x, ...patch }))
  const inf = (influencers || []).find(i => i.id === p.influencerId)
  const libFor = library.filter(it => !p.influencerId || it.influencerId === p.influencerId).slice(0, 60)
  const connected = isPublishingConnected()
  const problems = validatePost(p, accounts)
  const future = p.scheduledAt && new Date(p.scheduledAt).getTime() > Date.now() + 60_000
  const locked = p.status === 'posted' || p.status === 'scheduled'
  const targets = accounts.filter(a => p.accountIds.includes(a.id))
  const preview = p.mediaUrls[0]

  const finalize = patch => {
    const ids = patch.accountIds || p.accountIds
    const t = accounts.filter(a => ids?.includes(a.id))
    onSave({ ...p, ...patch, id: p.id || newId('post'), platforms: [...new Set(t.map(a => a.platform))], createdAt: p.createdAt || Date.now(), updatedAt: Date.now() })
  }
  async function send(now) {
    setBusy(true); setError(''); setMenu(false)
    const post = now ? { ...p, scheduledAt: '' } : p
    try {
      const r = await publishPost(post, accounts)
      finalize({ ...post, status: r.status, providerId: r.providerId, links: r.links, error: '', postedAt: r.status === 'posted' ? new Date().toISOString() : undefined })
    } catch (e) {
      setError(e.message)
      finalize({ ...post, status: 'failed', error: e.message })
    } finally { setBusy(false) }
  }
  const blocker = !connected ? 'connect' : problems[0]

  return (
    <div className="muse-sheet-backdrop" onClick={onClose}>
      <div className="muse-composer-sheet" role="dialog" aria-modal="true" aria-label={p.id ? 'Edit post' : 'New post'} onClick={e => e.stopPropagation()}>
        <div className="muse-cs-main">
          <div className="muse-cs-head">
            <h3>{p.id ? 'Edit post' : 'New post'}</h3>
            <button type="button" className="muse-btn muse-btn-text" onClick={onClose} aria-label="Close">✕</button>
          </div>
          {locked && <p className="muse-notice">This post is {POST_STATUSES[p.status].toLowerCase()} with your posting service{p.links?.length ? <>: {p.links.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer">{l}</a>)}</> : ''}. Change it in the provider’s dashboard.</p>}

          <div className="muse-chip-row" role="group" aria-label="Post to">
            {accounts.map(a => {
              const on = p.accountIds.includes(a.id)
              return <button key={a.id} type="button" className={`muse-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => set({ accountIds: on ? p.accountIds.filter(x => x !== a.id) : [...p.accountIds, a.id] })}>{platformName(a.platform)} {a.handle}</button>
            })}
            <Link to="/settings?section=accounts" className="muse-chip" title="Add a social account">＋ Account</Link>
          </div>

          <textarea className="muse-input muse-cs-caption" rows={6} value={p.caption} onChange={e => set({ caption: e.target.value })} placeholder="Hook line, story, call to action, hashtags…" aria-label="Caption" />
          <SkillAssist
            use="caption"
            label="Write caption"
            task={() => `Write the caption for this post.${p.caption ? ` Draft or brief: ${p.caption}` : ''} Platforms: ${targets.map(a => platformName(a.platform)).join(', ') || 'Instagram'}.`}
            context={() => influencerContext(inf)}
            onResult={r => set({ caption: r })}
          />

          <div className="muse-media-row">
            {p.mediaUrls.map(u => (
              <span key={u} className="muse-thumb lg" style={{ backgroundImage: isVideo(u) ? undefined : `url(${u})` }}>
                {isVideo(u) && <em>Video</em>}
                <button type="button" aria-label="Remove media" onClick={() => set({ mediaUrls: p.mediaUrls.filter(x => x !== u) })}>✕</button>
              </span>
            ))}
            <button type="button" className="muse-thumb lg muse-thumb-add" onClick={() => setPicking(v => !v)}>{picking ? 'Close' : 'From Media'}</button>
          </div>
          {picking && (
            <div className="muse-picker">
              {libFor.length === 0 ? <p className="muse-muted">No generated media{inf ? ` for ${inf.name}` : ''} yet.</p> : (
                <div className="muse-picker-grid">
                  {libFor.map(it => {
                    const on = p.mediaUrls.includes(it.url)
                    return (
                      <button key={it.id} type="button" className={`muse-thumb${on ? ' on' : ''}`} style={{ backgroundImage: it.kind === 'photo' ? `url(${it.url})` : undefined }} onClick={() => set({ mediaUrls: on ? p.mediaUrls.filter(x => x !== it.url) : [...p.mediaUrls, it.url].slice(0, 10) })} aria-pressed={on} title={`${it.influencerName} · ${it.label}`}>
                        {it.kind === 'video' && <em>Video</em>}
                      </button>
                    )
                  })}
                </div>
              )}
              <form className="muse-assist-row" onSubmit={e => { e.preventDefault(); const u = urlText.trim(); if (/^https:\/\//i.test(u)) { set({ mediaUrls: [...p.mediaUrls, u] }); setUrlText('') } }}>
                <input className="muse-input" value={urlText} onChange={e => setUrlText(e.target.value)} placeholder="Or paste a public https link" aria-label="Media URL" />
                <button type="submit" className="muse-btn muse-btn-tonal" disabled={!/^https:\/\//i.test(urlText.trim())}>Add</button>
              </form>
            </div>
          )}

          <div className="muse-form-grid">
            <Field label="Influencer"><InfluencerSelect value={p.influencerId} onChange={v => set({ influencerId: v })} /></Field>
            <Field label="Date and time"><input className="muse-input" type="datetime-local" value={toLocalInput(p.scheduledAt)} onChange={e => set({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} /></Field>
          </div>

          <div className="muse-cs-foot">
            {(blocker || error) && (
              <p className={`muse-cs-warn${error ? ' muse-error' : ''}`}>
                {error || (blocker === 'connect' ? <>Connect a posting service to post. <Link to="/settings?section=connections">Connect</Link></> : blocker)}
              </p>
            )}
            {p.id && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => onDelete(p.id)}>Delete</button>}
            <button type="button" className="muse-btn muse-btn-tonal" onClick={() => finalize({ status: p.scheduledAt ? 'planned' : 'draft' })} disabled={locked}>Save draft</button>
            <div className="muse-split">
              <button type="button" className="muse-btn muse-btn-filled" disabled={!!blocker || busy || locked} onClick={() => send(false)}>
                {busy ? 'Sending…' : future ? `Schedule · ${when(p.scheduledAt)}` : 'Post now'}
              </button>
              {future && <button type="button" className="muse-btn muse-btn-filled muse-split-more" disabled={!!blocker || busy || locked} aria-label="More options" aria-expanded={menu} onClick={() => setMenu(m => !m)}>▾</button>}
              {menu && <div className="muse-split-menu" role="menu"><button type="button" role="menuitem" onClick={() => send(true)}>Post now instead</button></div>}
            </div>
          </div>
        </div>

        <aside className="muse-cs-preview" aria-label="Preview">
          <span className="muse-field-label">Preview</span>
          <div className="muse-preview-card">
            <div className="muse-preview-head"><span className="muse-rail-avatar" style={{ backgroundImage: (inf?.mainImage || inf?.image) ? `url(${inf.mainImage || inf.image})` : undefined }} /><strong>{targets[0]?.handle?.replace(/^@/, '') || inf?.name || 'your account'}</strong></div>
            <div className="muse-preview-media" style={{ backgroundImage: preview && !isVideo(preview) ? `url(${preview})` : undefined }}>{!preview ? <span>No media yet</span> : isVideo(preview) ? <span>Video</span> : null}</div>
            <p className="muse-preview-cap"><strong>{targets[0]?.handle?.replace(/^@/, '') || ''}</strong> {p.caption || <em>Your caption shows here.</em>}</p>
          </div>
          {targets.some(a => PLATFORMS.find(x => x.id === a.platform)?.videoOnly) && <p className="muse-field-hint">TikTok and YouTube Shorts accept video only.</p>}
        </aside>
      </div>
    </div>
  )
}
