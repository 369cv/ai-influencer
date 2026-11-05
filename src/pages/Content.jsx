import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Page, Tabs, Field, Empty, Dialog, InfluencerSelect, SkillAssist } from '../components/ui'
import { collectLibrary } from '../utils/library'
import { PLATFORMS, POST_STATUSES, platformName, validatePost, publishPost } from '../utils/publishing'
import { getPublishing, isPublishingConnected, PUBLISHING_PROVIDERS } from '../utils/connections'
import { influencerContext } from '../utils/claudeAssist'
import { newId } from '../utils/localJson'

// Manage content: the post queue, a calendar, and the social accounts you post to.
// Posting goes through the posting service connected in Settings (bring your own key).

const toLocalInput = iso => {
  if (!iso) return ''
  const d = new Date(iso); const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const when = iso => new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Content() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tab = ['calendar', 'accounts'].includes(params.get('tab')) ? params.get('tab') : 'queue'
  const [posts, setPosts] = useWorkspaceStore('muse_posts')
  const [accounts, setAccounts] = useWorkspaceStore('muse_accounts')
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

  const setTab = t => setParams(t === 'queue' ? {} : { tab: t })
  const save = p => setPosts(l => l.some(x => x.id === p.id) ? l.map(x => x.id === p.id ? p : x) : [p, ...l])
  const connected = isPublishingConnected()

  return (
    <Page
      title="Content"
      sub="Compose, schedule and post to every account from one queue."
      actions={<button type="button" className="muse-btn muse-btn-filled" onClick={() => setComposing({})}>Compose post</button>}
      wide
    >
      {!connected && (
        <div className="muse-notice">
          <span><strong>Posting isn’t connected yet.</strong> Posts stay in your queue and calendar until you add a posting service.</span>
          <Link to="/settings?section=connections" className="muse-btn muse-btn-tonal">Connect posting</Link>
        </div>
      )}
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'queue', label: 'Queue', count: posts.filter(p => p.status !== 'posted').length },
        { id: 'calendar', label: 'Calendar' },
        { id: 'accounts', label: 'Social accounts', count: accounts.length },
      ]} />

      {tab === 'queue' && <Queue posts={posts} accounts={accounts} onOpen={setComposing} onNew={() => setComposing({})} />}
      {tab === 'calendar' && <Calendar posts={posts} onOpen={setComposing} onNewOn={d => setComposing({ scheduledAt: d.toISOString() })} />}
      {tab === 'accounts' && <Accounts accounts={accounts} setAccounts={setAccounts} />}

      {composing && (
        <Composer
          initial={composing}
          accounts={accounts}
          onClose={() => setComposing(null)}
          onSave={p => { save(p); setComposing(null) }}
          onDelete={id => { setPosts(l => l.filter(x => x.id !== id)); setComposing(null) }}
          onGoAccounts={() => { setComposing(null); setTab('accounts') }}
        />
      )}
    </Page>
  )
}

function Queue({ posts, accounts, onOpen, onNew }) {
  const [influencers] = useInfluencers()
  const groups = ['failed', 'draft', 'planned', 'scheduled', 'posted']
  if (!posts.length) return <Empty title="Nothing in the queue" action={<button type="button" className="muse-btn muse-btn-filled" onClick={onNew}>Compose post</button>}>Compose a post from your Library media, or send one here from a photo’s Post button.</Empty>
  return (
    <div className="muse-stack">
      {groups.map(g => {
        const items = posts.filter(p => (p.status || 'draft') === g).sort((a, b) => (a.scheduledAt ? new Date(a.scheduledAt) : a.createdAt) - (b.scheduledAt ? new Date(b.scheduledAt) : b.createdAt))
        if (!items.length) return null
        return (
          <section key={g} className="muse-panel">
            <h3 className="muse-panel-title">{POST_STATUSES[g]} <span className="muse-tabs-count">{items.length}</span></h3>
            <ul className="muse-list">
              {items.map(p => {
                const who = (influencers || []).find(i => i.id === p.influencerId)
                const targets = accounts.filter(a => p.accountIds?.includes(a.id))
                return (
                  <li key={p.id}>
                    <button type="button" className="muse-list-row" onClick={() => onOpen(p)}>
                      <span className="muse-thumb" style={{ backgroundImage: p.mediaUrls?.[0] && !/\.(mp4|webm|mov)(\?|$)/i.test(p.mediaUrls[0]) ? `url(${p.mediaUrls[0]})` : undefined }}>{p.mediaUrls?.length > 1 && <em>{p.mediaUrls.length}</em>}</span>
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
          </section>
        )
      })}
    </div>
  )
}

function Calendar({ posts, onOpen, onNewOn }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const days = useMemo(() => {
    const start = new Date(cursor); start.setDate(1 - ((start.getDay() + 6) % 7)) // Monday-first grid
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [cursor])
  const byDay = useMemo(() => {
    const m = {}
    for (const p of posts) {
      const at = p.scheduledAt || p.postedAt
      if (!at) continue
      const k = new Date(at).toDateString()
      ;(m[k] ||= []).push(p)
    }
    return m
  }, [posts])
  const today = new Date().toDateString()
  const shift = n => setCursor(c => { const d = new Date(c); d.setMonth(d.getMonth() + n); return d })

  return (
    <div className="muse-panel muse-calendar">
      <div className="muse-cal-head">
        <button type="button" className="muse-btn muse-btn-text" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <h3>{cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h3>
        <button type="button" className="muse-btn muse-btn-text" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
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
  )
}

function Accounts({ accounts, setAccounts }) {
  const [influencers] = useInfluencers()
  const [draft, setDraft] = useState(null)
  const pub = getPublishing()
  const provider = PUBLISHING_PROVIDERS.find(p => p.id === pub.provider)
  const connected = isPublishingConnected(pub)

  return (
    <div className="muse-stack">
      <div className="muse-panel">
        <h3 className="muse-panel-title">How posting works</h3>
        <p className="muse-muted">
          {connected
            ? <>Posts go out through <strong>{provider?.name}</strong>. {pub.provider === 'ayrshare' ? 'Each account here must also be linked in your Ayrshare dashboard (or the Ayrshare profile you set on the account).' : 'Your automation receives the platform and handle for each account.'}</>
            : <>Add the accounts each influencer posts to, then connect a posting service (Ayrshare, or a Zapier/Make/n8n webhook) in <Link to="/settings?section=connections">Settings → Connections</Link>.</>}
        </p>
      </div>

      {accounts.length === 0 ? (
        <Empty title="No social accounts yet" action={<button type="button" className="muse-btn muse-btn-filled" onClick={() => setDraft({})}>Add account</button>}>Add an Instagram, TikTok, YouTube or other account and link it to an influencer.</Empty>
      ) : (
        <ul className="muse-account-grid">
          {accounts.map(a => {
            const who = (influencers || []).find(i => i.id === a.influencerId)
            return (
              <li key={a.id} className="muse-panel muse-account">
                <span className={`muse-platform-dot p-${a.platform}`} aria-hidden>{platformName(a.platform).slice(0, 1)}</span>
                <span className="muse-list-main">
                  <strong>{a.handle}</strong>
                  <small>{platformName(a.platform)}{who ? ` · ${who.name}` : ''}{a.profileKey ? ' · own Ayrshare profile' : ''}</small>
                </span>
                <span className={`muse-badge ${connected ? 'posted' : 'draft'}`}>{connected ? 'Ready' : 'Not connected'}</span>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => setDraft(a)}>Edit</button>
              </li>
            )
          })}
          <li><button type="button" className="muse-panel muse-account muse-account-add" onClick={() => setDraft({})}>+ Add account</button></li>
        </ul>
      )}

      {draft && (
        <Dialog title={draft.id ? 'Edit account' : 'Add social account'} onClose={() => setDraft(null)} actions={<>
          {draft.id && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { setAccounts(l => l.filter(x => x.id !== draft.id)); setDraft(null) }}>Remove</button>}
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setDraft(null)}>Cancel</button>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!draft.handle?.trim()} onClick={() => {
            const a = { platform: 'instagram', ...draft, handle: draft.handle.trim().startsWith('@') ? draft.handle.trim() : '@' + draft.handle.trim(), id: draft.id || newId('acct') }
            setAccounts(l => l.some(x => x.id === a.id) ? l.map(x => x.id === a.id ? a : x) : [...l, a]); setDraft(null)
          }}>Save</button>
        </>}>
          <div className="muse-form-grid">
            <Field label="Platform">
              <select className="muse-input" value={draft.platform || 'instagram'} onChange={e => setDraft({ ...draft, platform: e.target.value })}>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Handle"><input className="muse-input" autoFocus value={draft.handle || ''} onChange={e => setDraft({ ...draft, handle: e.target.value })} placeholder="@handle" /></Field>
          </div>
          <Field label="Influencer"><InfluencerSelect value={draft.influencerId} onChange={v => setDraft({ ...draft, influencerId: v })} /></Field>
          {pub.provider === 'ayrshare' && (
            <Field label="Ayrshare profile key" hint="Only if this account sits in its own Ayrshare profile (Business plan). Leave empty to use your main profile.">
              <input className="muse-input" type="password" value={draft.profileKey || ''} onChange={e => setDraft({ ...draft, profileKey: e.target.value })} autoComplete="off" />
            </Field>
          )}
        </Dialog>
      )}
    </div>
  )
}

function Composer({ initial, accounts, onClose, onSave, onDelete, onGoAccounts }) {
  const [influencers] = useInfluencers()
  const library = useMemo(() => collectLibrary(influencers || []), [influencers])
  const [p, setP] = useState(() => ({ caption: '', mediaUrls: [], accountIds: [], status: 'draft', ...initial }))
  const [picking, setPicking] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = patch => setP(x => ({ ...x, ...patch }))
  const inf = (influencers || []).find(i => i.id === p.influencerId)
  const libFor = library.filter(it => !p.influencerId || it.influencerId === p.influencerId).slice(0, 60)
  const connected = isPublishingConnected()
  const problems = validatePost(p, accounts)
  const future = p.scheduledAt && new Date(p.scheduledAt).getTime() > Date.now() + 60_000
  const locked = p.status === 'posted' || p.status === 'scheduled'

  const finalize = patch => {
    const targets = accounts.filter(a => (patch.accountIds || p.accountIds)?.includes(a.id))
    onSave({ ...p, ...patch, id: p.id || newId('post'), platforms: [...new Set(targets.map(a => a.platform))], createdAt: p.createdAt || Date.now(), updatedAt: Date.now() })
  }

  async function send() {
    setBusy(true); setError('')
    try {
      const r = await publishPost(p, accounts)
      finalize({ status: r.status, providerId: r.providerId, links: r.links, error: '', postedAt: r.status === 'posted' ? new Date().toISOString() : undefined })
    } catch (e) {
      setError(e.message)
      finalize({ status: 'failed', error: e.message })
    } finally { setBusy(false) }
  }

  return (
    <Dialog title={p.id ? 'Edit post' : 'Compose post'} onClose={onClose} wide actions={<>
      {p.id && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => onDelete(p.id)}>Delete</button>}
      <button type="button" className="muse-btn muse-btn-tonal" onClick={() => finalize({ status: p.scheduledAt ? 'planned' : 'draft' })} disabled={locked}>{p.scheduledAt ? 'Save to calendar' : 'Save draft'}</button>
      <button type="button" className="muse-btn muse-btn-filled" disabled={!connected || problems.length > 0 || busy || locked} onClick={send} title={!connected ? 'Connect a posting service in Settings first' : problems[0]}>
        {busy ? 'Sending…' : future ? 'Schedule' : 'Post now'}
      </button>
    </>}>
      {locked && <p className="muse-notice">This post is {POST_STATUSES[p.status].toLowerCase()} with your posting service{p.links?.length ? <>: {p.links.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer">{l}</a>)}</> : ''}. Change it in the provider’s dashboard.</p>}

      <div className="muse-form-grid">
        <Field label="Influencer"><InfluencerSelect value={p.influencerId} onChange={v => set({ influencerId: v })} /></Field>
        <Field label="Date and time" hint="Leave empty to post now or keep as a draft.">
          <input className="muse-input" type="datetime-local" value={toLocalInput(p.scheduledAt)} onChange={e => set({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
        </Field>
      </div>

      <Field label="Media">
        <div className="muse-media-row">
          {p.mediaUrls.map(u => (
            <span key={u} className="muse-thumb lg" style={{ backgroundImage: /\.(mp4|webm|mov)(\?|$)/i.test(u) ? undefined : `url(${u})` }}>
              {/\.(mp4|webm|mov)(\?|$)/i.test(u) && <em>Video</em>}
              <button type="button" aria-label="Remove media" onClick={() => set({ mediaUrls: p.mediaUrls.filter(x => x !== u) })}>✕</button>
            </span>
          ))}
          <button type="button" className="muse-thumb lg muse-thumb-add" onClick={() => setPicking(v => !v)}>{picking ? 'Close' : '+ Library'}</button>
        </div>
      </Field>
      {picking && (
        <div className="muse-picker">
          {libFor.length === 0 ? <p className="muse-muted">No generated media{inf ? ` for ${inf.name}` : ''} yet. <Link to="/library">Open the Library</Link>.</p> : (
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
            <input className="muse-input" value={urlText} onChange={e => setUrlText(e.target.value)} placeholder="Or paste a public https image/video link" aria-label="Media URL" />
            <button type="submit" className="muse-btn muse-btn-tonal" disabled={!/^https:\/\//i.test(urlText.trim())}>Add</button>
          </form>
        </div>
      )}

      <Field label="Caption">
        <textarea className="muse-input" rows={6} value={p.caption} onChange={e => set({ caption: e.target.value })} placeholder="Hook line, story, call to action, hashtags…" />
      </Field>
      <SkillAssist
        use="caption"
        label="Write caption"
        task={() => `Write the caption for this post.${p.caption ? ` Draft or brief: ${p.caption}` : ''} Platforms: ${accounts.filter(a => p.accountIds.includes(a.id)).map(a => platformName(a.platform)).join(', ') || 'Instagram'}.`}
        context={() => influencerContext(inf)}
        onResult={r => set({ caption: r })}
      />

      <Field label="Post to">
        {accounts.length === 0 ? (
          <p className="muse-muted">No accounts yet. <button type="button" className="muse-btn muse-btn-text" onClick={onGoAccounts}>Add a social account</button></p>
        ) : (
          <div className="muse-chip-row">
            {accounts.map(a => {
              const on = p.accountIds.includes(a.id)
              return (
                <button key={a.id} type="button" className={`muse-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => set({ accountIds: on ? p.accountIds.filter(x => x !== a.id) : [...p.accountIds, a.id] })}>
                  {platformName(a.platform)} {a.handle}
                </button>
              )
            })}
          </div>
        )}
      </Field>

      {(problems.length > 0 || error || !connected) && (
        <ul className="muse-problems">
          {!connected && <li>Connect a posting service in <Link to="/settings?section=connections">Settings → Connections</Link> to post. You can still save drafts and plan the calendar.</li>}
          {problems.map(x => <li key={x}>{x}</li>)}
          {error && <li className="muse-error">{error}</li>}
        </ul>
      )}
      {PLATFORMS.some(x => accounts.filter(a => p.accountIds.includes(a.id)).some(a => a.platform === x.id && x.videoOnly)) && <p className="muse-field-hint">TikTok and YouTube Shorts accept video only.</p>}
    </Dialog>
  )
}
