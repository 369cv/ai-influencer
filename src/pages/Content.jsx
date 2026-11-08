import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useInfluencers, useBrandDeals } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Page, Seg, Field, Empty, Dialog, SkillAssist } from '../components/ui'
import Library from './Library'
import Plan from './Plan'
import BrandDeals from './BrandDeals'
import WeeklyIdeas from '../components/WeeklyIdeas'
import { collectLibrary } from '../utils/library'
import { PLATFORMS, POST_STATUSES, IG_FORMATS, platformName, validatePost, platformChecks, captionFor, hasOwnCaption, publishPost, cancelPost, failedRoutes, refreshStats, canHaveStats, statsLine } from '../utils/publishing'
import { downloadImage } from '../utils/imageUtils'
import { isPublishingConnected, routeForAccount, routeName } from '../utils/connections'
import { CONNECTORS } from '../utils/connectors'
import ConnectorLogo from '../components/ConnectorLogo'
import { freeSlots, nextFreeSlot, isSlotTime, fmtSlot, fmtTime } from '../utils/schedule'
import { influencerContext } from '../utils/claudeAssist'
import { newId } from '../utils/localJson'
import { kindLabel } from '../utils/deals'

// Content: posts with three views (Queue · Calendar · Media), filtered by influencer.
// The Queue shows each influencer's time slots (Settings → Social accounts or the
// influencer profile), with empty slots ready to fill. Social accounts live in Settings.

const VIEWS = [{ id: 'queue', label: 'Queue' }, { id: 'ideas', label: 'Ideas' }, { id: 'calendar', label: 'Calendar' }, { id: 'media', label: 'Media' }, { id: 'deals', label: 'Deals' }]
const platformLogo = id => CONNECTORS.find(c => c.auth === 'social' && c.platform === id)
const Avatar = ({ inf, size = 22 }) => <span className="muse-q-avatar" style={{ width: size, height: size, backgroundImage: (inf?.mainImage || inf?.image) ? `url(${inf.mainImage || inf.image})` : undefined }} aria-hidden>{!(inf?.mainImage || inf?.image) && (inf?.name || '?').slice(0, 1)}</span>
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
  const rawView = params.get('view') === 'list' ? 'queue' : params.get('view')
  const view = VIEWS.some(v => v.id === rawView) ? rawView : (narrow() ? 'queue' : 'calendar')
  const [influencers] = useInfluencers()
  const [posts, setPosts] = useWorkspaceStore('muse_posts')
  const [accounts] = useWorkspaceStore('muse_accounts')
  const [who, setWho] = useState('all')
  const [composing, setComposing] = useState(null)
  const [retrying, setRetrying] = useState('')
  const [statsState, setStatsState] = useState({ busy: false, error: '', at: 0 })
  // Sent → Refresh stats: one read per Ayrshare post, saved on the post.
  async function loadStats(list) {
    setStatsState(s => ({ ...s, busy: true, error: '' }))
    try {
      const byId = await refreshStats(list)
      setPosts(l => l.map(x => byId[x.id] ? { ...x, stats: byId[x.id] } : x))
      setStatsState({ busy: false, error: '', at: Date.now() })
    } catch (e) { setStatsState(s => ({ ...s, busy: false, error: e.message })) }
  }

  useEffect(() => {
    // Ideas and Deals own their ?open= / ?deal= params.
    const openId = view === 'ideas' || view === 'deals' ? null : params.get('open')
    if (params.get('compose') === '1') {
      // ?compose=1 stays in the URL until the composer closes, so a direct
      // load (bookmark, extension link) still opens it if the page remounts.
      setComposing(c => c || {
        caption: location.state?.prefillCaption || '', mediaUrls: location.state?.prefillMediaList?.length ? location.state.prefillMediaList : location.state?.prefillMedia ? [location.state.prefillMedia] : [], influencerId: location.state?.influencerId || null,
        // Brand deal → Create post: the post is linked back to its deliverable.
        ...(location.state?.deliverableId ? { dealId: location.state.dealId, deliverableId: location.state.deliverableId } : {}),
        ...(location.state?.igFormat ? { igFormat: location.state.igFormat } : {}),
      })
    } else if (openId) {
      const p = posts.find(x => x.id === openId)
      if (p) setComposing(p)
      setParams(q => { q.delete('open'); return q }, { replace: true })
    }
  }, [params]) // eslint-disable-line

  const closeComposer = () => {
    setComposing(null)
    if (params.get('compose')) setParams(q => { q.delete('compose'); return q }, { replace: true, state: {} })
  }
  const setView = v => setParams(q => { q.set('view', v); return q }, { replace: true })
  const save = p => setPosts(l => l.some(x => x.id === p.id) ? l.map(x => x.id === p.id ? p : x) : [p, ...l])
  const accountsOf = id => accounts.filter(a => a.influencerId === id).map(a => a.id)
  const newPost = (extra = {}) => {
    const influencerId = extra.influencerId !== undefined ? extra.influencerId : who !== 'all' ? who : null
    setComposing({ influencerId, accountIds: influencerId ? accountsOf(influencerId) : [], ...extra })
  }
  // Inline Retry (Queue → Failed): re-send only the routes that failed.
  async function retry(post) {
    setRetrying(post.id)
    try {
      const routes = failedRoutes(post)
      const r = await publishPost(post, accounts, routes.length ? { routes } : {})
      save({ ...post, status: r.status, routeResults: r.routeResults, error: r.error, providerId: r.providerId, links: r.links, postedAt: r.status === 'posted' ? new Date().toISOString() : post.postedAt, updatedAt: Date.now() })
    } catch (e) { save({ ...post, error: e.message, updatedAt: Date.now() }) } finally { setRetrying('') }
  }
  const shownInfluencers = (influencers || []).filter(i => who === 'all' || i.id === who)
  const shown = posts.filter(p => who === 'all' || p.influencerId === who)

  return (
    <Page
      title="Content"
      wide
      actions={<>
        <Seg options={VIEWS} value={view} onChange={setView} label="View" />
        <button type="button" className="muse-btn muse-btn-filled" onClick={() => newPost()}>New post</button>
      </>}
    >
      {(view === 'queue' || view === 'calendar') && (influencers || []).length > 0 && (
        <div className="muse-q-who" role="group" aria-label="Influencer">
          <button type="button" className={`muse-chip${who === 'all' ? ' on' : ''}`} aria-pressed={who === 'all'} onClick={() => setWho('all')}>All influencers</button>
          {(influencers || []).map(i => {
            const plats = [...new Set(accounts.filter(a => a.influencerId === i.id).map(a => a.platform))]
            return (
              <button key={i.id} type="button" className={`muse-chip muse-q-whochip${who === i.id ? ' on' : ''}`} aria-pressed={who === i.id} onClick={() => setWho(who === i.id ? 'all' : i.id)}>
                <Avatar inf={i} />{i.name || 'Untitled'}
                {plats.length > 0 && <span className="muse-q-plats">{plats.map(pl => platformLogo(pl) && <ConnectorLogo key={pl} c={platformLogo(pl)} size={16} />)}</span>}
              </button>
            )
          })}
        </div>
      )}
      {view === 'queue' && <Queue posts={shown} influencers={shownInfluencers} accounts={accounts} onOpen={setComposing} onNewAt={(i, at) => newPost({ influencerId: i.id, scheduledAt: at.toISOString() })} onNew={() => newPost()} onRetry={retry} retrying={retrying} onRefreshStats={loadStats} statsState={statsState} />}
      {view === 'calendar' && <Calendar posts={shown} onOpen={setComposing} onNewOn={d => newPost({ scheduledAt: d.toISOString() })} />}
      {view === 'media' && <Library embedded />}
      {view === 'ideas' && <><div className="muse-ideas-week"><WeeklyIdeas /></div><Plan embedded /></>}
      {view === 'deals' && <BrandDeals embedded />}

      {composing && (
        <Composer
          initial={composing}
          accounts={accounts}
          posts={posts}
          onClose={closeComposer}
          onSave={p => { save(p); closeComposer() }}
          onPersist={save}
          onDelete={id => { setPosts(l => l.filter(x => x.id !== id)); closeComposer() }}
        />
      )}
    </Page>
  )
}

const TABS = [{ id: 'queue', label: 'Queue' }, { id: 'drafts', label: 'Drafts' }, { id: 'sent', label: 'Sent' }, { id: 'failed', label: 'Failed' }]
const QUEUED = new Set(['planned', 'approved', 'scheduled'])
function tabOf(p, now) {
  const t = p.scheduledAt ? new Date(p.scheduledAt).getTime() : null
  if (p.status === 'failed') return 'failed'
  if (p.status === 'posted' || (p.status === 'scheduled' && t && t <= now)) return 'sent'
  if (t && QUEUED.has(p.status)) return 'queue'
  return 'drafts'
}
const dayLabel = d => {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  const diff = Math.round((x - t) / 864e5)
  const date = new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return diff === 0 ? ['Today', date] : diff === 1 ? ['Tomorrow', date] : [date, '']
}
const BADGE = { planned: 'Planned · not sent', approved: 'Approved · not sent', scheduled: 'Scheduled', posted: 'Posted', failed: 'Failed', draft: 'Draft' }

function Queue({ posts, influencers, accounts, onOpen, onNewAt, onNew, onRetry, retrying, onRefreshStats, statsState }) {
  const [tab, setTab] = useState('queue')
  const now = Date.now()
  const byTab = useMemo(() => { const m = { queue: [], drafts: [], sent: [], failed: [] }; for (const p of posts) m[tabOf(p, now)].push(p); return m }, [posts]) // eslint-disable-line
  const withSchedule = influencers.filter(i => i.postingSchedule)
  const rows = useMemo(() => {
    if (tab !== 'queue') {
      const list = [...byTab[tab]].sort((a, b) => tab === 'drafts' ? (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0) : new Date(b.postedAt || b.scheduledAt || 0) - new Date(a.postedAt || a.scheduledAt || 0))
      return list.map(p => ({ kind: 'post', p, at: p.postedAt || p.scheduledAt }))
    }
    const items = byTab.queue.map(p => ({ kind: 'post', p, at: p.scheduledAt }))
    for (const i of withSchedule) for (const s of freeSlots(i.postingSchedule, posts, i.id, { days: 7 })) items.push({ kind: 'slot', inf: i, at: s.at.toISOString() })
    return items.sort((a, b) => new Date(a.at) - new Date(b.at))
  }, [tab, byTab, posts, withSchedule.map(i => i.id + JSON.stringify(i.postingSchedule)).join()]) // eslint-disable-line
  const infOf = id => influencers.find(i => i.id === id)

  let lastDay = ''
  return (
    <div className="muse-q">
      <div className="muse-q-tabs" role="tablist" aria-label="Posts">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`${tab === t.id ? 'on' : ''}${t.id === 'failed' && byTab.failed.length ? ' warn' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}<i>{byTab[t.id].length}</i>
          </button>
        ))}
        {influencers.length === 1 && influencers[0].postingSchedule && (() => {
          const i = influencers[0]; const wk = now + 7 * 864e5
          const n = byTab.queue.filter(p => new Date(p.scheduledAt) <= wk).length
          return <span className="muse-q-goal">{n} of {i.postingSchedule.weeklyGoal || 1} queued this week</span>
        })()}
        {tab === 'sent' && byTab.sent.some(canHaveStats) && (
          <span className="muse-q-goal muse-q-stats-ctl">
            {statsState.error ? <span className="muse-error">{statsState.error}</span> : statsState.at ? <span>Stats updated {when(new Date(statsState.at).toISOString())}</span> : null}
            <button type="button" className="muse-btn muse-btn-text" disabled={statsState.busy} onClick={() => onRefreshStats(byTab.sent.filter(canHaveStats))}>{statsState.busy ? 'Reading stats…' : 'Refresh stats'}</button>
          </span>
        )}
      </div>

      {rows.length === 0 && (
        tab === 'queue'
          ? <Empty title="Nothing queued" action={<button type="button" className="muse-btn muse-btn-filled" onClick={onNew}>New post</button>}>
              {withSchedule.length ? 'Every slot this week is free. Add a post or pick a slot.' : <>Set a posting schedule so empty slots show up here. <Link to="/settings?section=accounts">Posting schedules</Link></>}
            </Empty>
          : <Empty title={tab === 'drafts' ? 'No drafts' : tab === 'sent' ? 'Nothing sent yet' : 'No failed posts'} />
      )}

      {rows.map(r => {
        const d = new Date(r.at || Date.now()).toDateString()
        const head = r.at && d !== lastDay ? (lastDay = d, dayLabel(r.at)) : null
        const time = r.at ? fmtTime(r.at) : ''
        if (r.kind === 'slot') {
          return (
            <div key={`slot-${r.inf.id}-${r.at}`}>
              {head && <h3 className="muse-q-day">{head[0]} {head[1] && <small>· {head[1]}</small>}</h3>}
              <div className="muse-q-row">
                <span className="muse-q-time">{time}</span>
                <button type="button" className="muse-q-empty" onClick={() => onNewAt(r.inf, new Date(r.at))}>＋ Add to {r.inf.name || 'this influencer'}’s {time} slot</button>
              </div>
            </div>
          )
        }
        const p = r.p
        const inf = infOf(p.influencerId)
        const targets = accounts.filter(a => p.accountIds?.includes(a.id))
        const plats = [...new Set(targets.map(a => a.platform))]
        const routes = p.routeResults?.length ? [...new Set(p.routeResults.map(x => x.route))] : [...new Set(targets.map(a => routeForAccount(a)).filter(Boolean))]
        const failed = p.status === 'failed'
        return (
          <div key={p.id}>
            {head && tab === 'queue' && <h3 className="muse-q-day">{head[0]} {head[1] && <small>· {head[1]}</small>}</h3>}
            <div className="muse-q-row">
              {tab === 'queue' && <span className="muse-q-time">{time}</span>}
              <div className={`muse-q-card${failed ? ' failed' : ''}`}>
                <button type="button" className="muse-q-open" onClick={() => onOpen(p)} aria-label={`Open post: ${p.caption?.slice(0, 40) || 'No caption'}`}>
                  <span className="muse-thumb" style={{ backgroundImage: p.mediaUrls?.[0] && !isVideo(p.mediaUrls[0]) ? `url(${p.mediaUrls[0]})` : undefined }}>{isVideo(p.mediaUrls?.[0]) && <em>Video</em>}{p.mediaUrls?.length > 1 && <em>{p.mediaUrls.length}</em>}</span>
                  <span className="muse-q-text">
                    <strong>{p.caption?.split('\n')[0]?.slice(0, 90) || 'No caption'}</strong>
                    <small>
                      {inf && <><Avatar inf={inf} size={18} />{inf.name}</>}
                      {plats.map(pl => platformLogo(pl) && <ConnectorLogo key={pl} c={platformLogo(pl)} size={16} />)}
                      {!plats.length && <span>No accounts</span>}
                      {tab !== 'queue' && (p.postedAt || p.scheduledAt) && <span>· {when(p.postedAt || p.scheduledAt)}</span>}
                      {routes.length > 0 && <span>· via {routes.map(routeName).join(', ')}</span>}
                    </small>
                    {failed && p.error && <small className="muse-error">{p.error}</small>}
                    {tab === 'sent' && (
                      p.stats && statsLine(p.stats.totals)
                        ? <small className="muse-q-stats">{statsLine(p.stats.totals)}</small>
                        : p.stats?.error ? <small className="muse-muted">{p.stats.error}</small>
                        : !canHaveStats(p) && routes.length > 0 ? <small className="muse-muted">No stats: {routes.map(routeName).join(', ')} can’t report back</small>
                        : null
                    )}
                  </span>
                </button>
                <span className={`muse-badge ${p.status || 'draft'}`}>{BADGE[p.status || 'draft']}</span>
                {failed && <button type="button" className="muse-btn muse-btn-tonal" onClick={() => onRetry(p)} disabled={retrying === p.id || !isPublishingConnected()}>{retrying === p.id ? 'Retrying…' : failedRoutes(p).length ? `Retry ${failedRoutes(p).map(routeName).join(', ')}` : 'Retry'}</button>}
                {p.links?.[0] && tab === 'sent' && <a className="muse-btn muse-btn-text" href={p.links[0]} target="_blank" rel="noopener noreferrer">View ↗</a>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
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

function Composer({ initial, accounts, posts = [], onClose, onSave, onPersist, onDelete }) {
  const [influencers] = useInfluencers()
  const library = useMemo(() => collectLibrary(influencers || []), [influencers])
  const [deals] = useBrandDeals()
  const [p, setP] = useState(() => ({ caption: '', mediaUrls: [], accountIds: [], status: 'draft', ...initial }))
  const [picking, setPicking] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState(false)
  const [whenPanel, setWhenPanel] = useState('') // '' | 'slots' | 'custom'
  const [showAll, setShowAll] = useState(false)
  const [capTab, setCapTab] = useState('all')       // 'all' or a platform id
  const [editing, setEditing] = useState(false)     // unlocks a scheduled post
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [notice, setNotice] = useState('')
  const set = patch => setP(x => ({ ...x, ...patch }))
  const inf = (influencers || []).find(i => i.id === p.influencerId)
  const schedule = inf?.postingSchedule
  const nextSlot = schedule ? nextFreeSlot(schedule, posts, inf.id, { exceptId: p.id }) : null
  const slotChoices = schedule ? freeSlots(schedule, posts, inf.id, { exceptId: p.id, days: 14 }).slice(0, 8) : []
  const onSlot = schedule && p.scheduledAt && isSlotTime(schedule, p.scheduledAt)
  // Posting as an influencer selects all of her accounts (untick to skip one); a new
  // post also takes her next free slot, so there's no date to type.
  const pickInfluencer = id => {
    const mine = accounts.filter(a => a.influencerId === id).map(a => a.id)
    const i = (influencers || []).find(x => x.id === id)
    const slot = !p.id && !p.scheduledAt && i?.postingSchedule ? nextFreeSlot(i.postingSchedule, posts, id) : null
    set({ influencerId: id, accountIds: mine.length || !id ? mine : p.accountIds, ...(slot ? { scheduledAt: slot.at.toISOString() } : {}) })
  }
  useEffect(() => { if (initial.influencerId && !initial.id && !initial.scheduledAt) pickInfluencer(initial.influencerId) }, []) // eslint-disable-line
  const libFor = library.filter(it => !p.influencerId || it.influencerId === p.influencerId).slice(0, 60)
  const connected = isPublishingConnected()
  const problems = validatePost(p, accounts)
  const future = p.scheduledAt && new Date(p.scheduledAt).getTime() > Date.now() + 60_000
  const scheduledOut = p.status === 'scheduled'
  const locked = p.status === 'posted' || (scheduledOut && !editing)
  const retryRoutes = p.status === 'failed' ? failedRoutes(p) : []
  const targets = accounts.filter(a => p.accountIds.includes(a.id))
  const preview = p.mediaUrls[0]
  // Captions per platform: "All platforms" edits the shared caption; a platform tab
  // edits that platform's own version (typing there creates it).
  const targetPlatforms = [...new Set(targets.map(a => a.platform))]
  const tab = capTab !== 'all' && targetPlatforms.includes(capTab) ? capTab : 'all'
  const tabText = tab === 'all' ? p.caption : captionFor(p, tab)
  const setTabText = v => tab === 'all' ? set({ caption: v }) : set({ captions: { ...(p.captions || {}), [tab]: v } })
  const resetTab = () => { const c = { ...(p.captions || {}) }; delete c[tab]; set({ captions: c }) }
  const checks = platformChecks(p, accounts)
  const tabLimit = tab === 'all'
    ? Math.min(...targetPlatforms.filter(pl => !hasOwnCaption(p, pl)).map(pl => PLATFORMS.find(x => x.id === pl)?.limit || Infinity))
    : PLATFORMS.find(x => x.id === tab)?.limit || Infinity
  const sentRoutes = (p.routeResults || []).filter(r => r.ok || r.partial).map(r => routeName(r.route))

  // close = false keeps the composer open (after a failed send) while still saving.
  const finalize = (patch, close = true) => {
    const ids = patch.accountIds || p.accountIds
    const t = accounts.filter(a => ids?.includes(a.id))
    const saved = { ...p, ...patch, id: p.id || newId('post'), platforms: [...new Set(t.map(a => a.platform))], createdAt: p.createdAt || Date.now(), updatedAt: Date.now() }
    if (close) onSave(saved); else { setP(saved); onPersist(saved) }
  }
  async function send(now) {
    setBusy(true); setError(''); setMenu(false); setNotice('')
    const post = { ...p, id: p.id || newId('post'), ...(now ? { scheduledAt: '' } : {}) }
    try {
      // Editing a scheduled post: pull it back from every route first, then send the
      // new version. If any route can't cancel, nothing is re-sent (no double posts).
      if (editing && scheduledOut) {
        const res = await cancelPost(post)
        const bad = res.filter(r => !r.ok)
        if (bad.length) { setError(bad.map(r => `${routeName(r.route)}: ${r.error}`).join(' · ') + ' Nothing was changed.'); return }
        post.routeResults = []
      }
      // A failed post re-sends only the routes that failed, so nothing posts twice.
      const r = await publishPost(post, accounts, retryRoutes.length ? { routes: retryRoutes } : {})
      if (r.status === 'failed') setError(r.error)
      if (r.status !== 'failed') setEditing(false)
      finalize({ ...post, status: r.status, routeResults: r.routeResults, providerId: r.providerId, links: r.links, error: r.error, postedAt: r.status === 'posted' ? new Date().toISOString() : undefined }, r.status !== 'failed')
    } catch (e) {
      setError(e.message)
      finalize({ ...post, status: 'failed', error: e.message }, false)
    } finally { setBusy(false) }
  }
  // Cancel a scheduled post everywhere it was sent; it stays here as a draft.
  async function cancelScheduled() {
    setBusy(true); setError(''); setConfirmCancel(false)
    try {
      const res = await cancelPost(p)
      const bad = res.filter(r => !r.ok)
      if (bad.length) { setError(bad.map(r => `${routeName(r.route)}: ${r.error}`).join(' · ')); return }
      setEditing(false)
      setNotice(`Cancelled on ${res.map(r => routeName(r.route)).join(', ')}. It’s kept here as a draft.`)
      finalize({ status: p.scheduledAt ? 'planned' : 'draft', routeResults: undefined, providerId: undefined, links: undefined, error: undefined }, false)
    } finally { setBusy(false) }
  }
  const blocker = !connected ? 'connect' : problems[0]
  const approved = p.status === 'approved'
  const canApprove = !locked && !approved && !!(p.caption.trim() || p.mediaUrls.length)
  // Post pack: everything needed to post by hand or in another scheduler.
  function downloadPack() {
    const base = `${(inf?.name || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`
    const lines = [
      p.caption,
      '',
      ...targetPlatforms.filter(pl => hasOwnCaption(p, pl)).flatMap(pl => [`${platformName(pl)} version:`, p.captions[pl], '']),
      p.firstComment?.trim() ? `First comment: ${p.firstComment.trim()}` : '',
      targets.length ? `Accounts: ${targets.map(a => `${platformName(a.platform)} ${a.handle || ''}`.trim()).join(', ')}` : '',
      p.scheduledAt ? `When: ${new Date(p.scheduledAt).toLocaleString()}` : '',
    ].filter((l, i) => i < 2 || l)
    downloadImage(`data:text/plain;base64,${btoa(unescape(encodeURIComponent(lines.join('\n').trim() + '\n')))}`, `${base}-caption.txt`)
    p.mediaUrls.forEach((u, i) => setTimeout(() => downloadImage(u, `${base}-${i + 1}.${isVideo(u) ? 'mp4' : 'png'}`), 150 * (i + 1)))
  }

  return (
    <div className="muse-sheet-backdrop" onClick={onClose}>
      <div className="muse-composer-sheet" role="dialog" aria-modal="true" aria-label={p.id ? 'Edit post' : 'New post'} onClick={e => e.stopPropagation()}>
        <div className="muse-cs-main">
          <div className="muse-cs-head">
            <h3>{p.id ? 'Edit post' : 'New post'}</h3>
            <button type="button" className="muse-btn muse-btn-text" onClick={onClose} aria-label="Close">✕</button>
          </div>
          {p.status === 'posted' && <p className="muse-notice">This post is posted{p.links?.length ? <>: {p.links.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer">{l}</a>)}</> : ''}. Change or delete it on the platform itself.</p>}
          {scheduledOut && !editing && (
            <div className="muse-notice muse-cs-sched">
              <span>Scheduled with {sentRoutes.join(', ') || 'your posting service'}. Editing or cancelling updates {sentRoutes.length > 1 ? 'them' : 'it'} too.</span>
              {!confirmCancel ? (
                <span className="muse-cs-sched-actions">
                  <button type="button" className="muse-btn muse-btn-text muse-danger" disabled={busy} onClick={() => setConfirmCancel(true)}>Cancel post</button>
                  <button type="button" className="muse-btn muse-btn-tonal" disabled={busy} onClick={() => { setEditing(true); setNotice('') }}>Edit</button>
                </span>
              ) : (
                <span className="muse-cs-sched-actions" role="group" aria-label="Confirm cancel">
                  <span>Cancel on {sentRoutes.join(', ') || 'your posting service'}?</span>
                  <button type="button" className="muse-btn muse-btn-text" onClick={() => setConfirmCancel(false)}>Keep it</button>
                  <button type="button" className="muse-btn muse-btn-filled muse-btn-danger" disabled={busy} onClick={cancelScheduled}>{busy ? 'Cancelling…' : 'Cancel post'}</button>
                </span>
              )}
            </div>
          )}
          {editing && <p className="muse-notice">Editing a scheduled post. Saving cancels it on {sentRoutes.join(', ')} and sends the new version{sentRoutes.some(r => r !== 'Ayrshare') ? '; automations receive muse.post.cancelled, then muse.post with the same postId' : ''}. <button type="button" className="muse-btn muse-btn-text" onClick={() => { setEditing(false); setP(x => ({ ...initial, ...posts.find(y => y.id === x.id) })); setError('') }}>Discard changes</button></p>}
          {notice && <p className="muse-notice" role="status">{notice}</p>}
          {p.dealId && (() => {
            const deal = (deals || []).find(d => d.id === p.dealId)
            const dl = deal?.deliverables?.find(d => d.id === p.deliverableId)
            return deal ? <p className="muse-notice"><span>Brand deal · <strong>{deal.brand}</strong>{dl ? ` · ${kindLabel(dl.kind)}` : ''}{dl?.approval === 'changes' && dl.note ? ` · changes requested: “${dl.note}”` : dl?.approval === 'approved' ? ' · approved' : ''}</span><Link to="/brand-deals">Deal</Link></p> : null
          })()}

          <div className="muse-cs-as">
            <span className="muse-field-label">Posting as</span>
            <div className="muse-chip-row" role="group" aria-label="Post to">
              <label className={`muse-chip muse-cs-who${inf ? ' on' : ''}`}>
                <Avatar inf={inf} />
                <select value={p.influencerId || ''} onChange={e => pickInfluencer(e.target.value || null)} aria-label="Influencer">
                  <option value="">No influencer</option>
                  {(influencers || []).map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
                </select>
              </label>
              {accounts.filter(a => showAll || !inf || a.influencerId === inf.id || p.accountIds.includes(a.id)).map(a => {
                const on = p.accountIds.includes(a.id)
                const pc = platformLogo(a.platform)
                return (
                  <button key={a.id} type="button" className={`muse-chip muse-cs-acct${on ? ' on' : ''}`} aria-pressed={on} onClick={() => set({ accountIds: on ? p.accountIds.filter(x => x !== a.id) : [...p.accountIds, a.id] })} title={`${platformName(a.platform)} ${a.handle}`}>
                    {pc ? <ConnectorLogo c={pc} size={18} /> : platformName(a.platform)} {a.handle}
                  </button>
                )
              })}
              {inf && !showAll && accounts.some(a => a.influencerId !== inf.id && !p.accountIds.includes(a.id)) && <button type="button" className="muse-chip" onClick={() => setShowAll(true)}>Other accounts</button>}
              <Link to="/settings?section=accounts" className="muse-chip" title="Add a social account">＋ Account</Link>
            </div>
            {inf && !accounts.some(a => a.influencerId === inf.id) && <p className="muse-field-hint">{inf.name} has no accounts yet. Link one in <Link to="/settings?section=accounts">Social accounts</Link>.</p>}
          </div>

          {targetPlatforms.length > 1 && (
            <div className="muse-chip-row muse-cs-captabs" role="tablist" aria-label="Caption for">
              <button type="button" role="tab" aria-selected={tab === 'all'} className={`muse-chip${tab === 'all' ? ' on' : ''}`} onClick={() => setCapTab('all')}>All platforms</button>
              {targetPlatforms.map(pl => {
                const pc = platformLogo(pl)
                return (
                  <button key={pl} type="button" role="tab" aria-selected={tab === pl} className={`muse-chip${tab === pl ? ' on' : ''}`} onClick={() => setCapTab(pl)}>
                    {pc && <ConnectorLogo c={pc} size={16} />}{platformName(pl)}{hasOwnCaption(p, pl) && <span className="muse-cs-own" title="Has its own caption" aria-label="has its own caption" />}
                  </button>
                )
              })}
            </div>
          )}
          <textarea className="muse-input muse-cs-caption" rows={6} value={tabText} onChange={e => setTabText(e.target.value)} disabled={locked} placeholder={tab === 'all' ? 'Hook line, story, call to action, hashtags…' : `A ${platformName(tab)}-only caption`} aria-label={tab === 'all' ? 'Caption' : `${platformName(tab)} caption`} />
          <div className="muse-cs-capmeta">
            <span>
              {tab === 'all'
                ? (targetPlatforms.length > 1 ? 'Applies to every platform without its own version.' : '')
                : hasOwnCaption(p, tab)
                  ? <button type="button" className="muse-btn muse-btn-text" disabled={locked} onClick={resetTab}>Reset to the shared caption</button>
                  : `Typing here makes a ${platformName(tab)}-only version.`}
            </span>
            <span className={tabText.length > tabLimit ? 'muse-error' : ''}>{Number.isFinite(tabLimit) ? `${tabText.length.toLocaleString()} / ${tabLimit.toLocaleString()}` : `${tabText.length.toLocaleString()} characters`}</span>
          </div>
          <SkillAssist
            use="caption"
            label="Write caption"
            task={() => `Write the caption for this post.${p.caption ? ` Draft or brief: ${p.caption}` : ''} Platforms: ${targets.map(a => platformName(a.platform)).join(', ') || 'Instagram'}.`}
            context={() => influencerContext(inf)}
            onResult={r => setTabText(r)}
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

          {targetPlatforms.includes('instagram') && (
            <div className="muse-cs-opt">
              <span className="muse-field-label">Instagram as</span>
              <div className="muse-chip-row" role="radiogroup" aria-label="Instagram format">
                {IG_FORMATS.map(f => {
                  const on = (p.igFormat || 'post') === f.id
                  return <button key={f.id} type="button" role="radio" aria-checked={on} disabled={locked} className={`muse-chip${on ? ' on' : ''}`} onClick={() => set({ igFormat: f.id })}>{f.label}</button>
                })}
              </div>
              {p.igFormat === 'story' && <p className="muse-field-hint">Stories show no caption and disappear after 24 hours.</p>}
            </div>
          )}
          <div className="muse-cs-opt">
            <label className="muse-field-label" htmlFor="muse-first-comment">First comment <span className="muse-muted">· optional</span></label>
            <input id="muse-first-comment" className="muse-input" value={p.firstComment || ''} disabled={locked} onChange={e => set({ firstComment: e.target.value })} placeholder="Posted as the first comment right after the post" />
            <p className="muse-field-hint">Ayrshare adds it after posting; webhook routes receive it in the JSON.{/#\w/.test(p.caption) && !p.firstComment ? <> <button type="button" className="muse-btn muse-btn-text" onClick={() => { const tags = p.caption.match(/#[\p{L}\p{N}_]+/gu) || []; set({ firstComment: tags.join(' '), caption: p.caption.replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, '').trimEnd() }) }}>Move hashtags here</button></> : null}</p>
          </div>

          {checks.length > 0 && (
            <ul className="muse-cs-checks" aria-label="Checks per platform">
              {checks.map(c => (
                <li key={c.platform}>
                  <span className={`muse-sc-dot ${c.problems.length ? 'fail' : 'ok'}`} aria-hidden />
                  <strong>{c.name}</strong>
                  <span className="muse-muted">{c.problems.length ? c.problems.join(' ') : `Ready${c.limit ? ` · ${c.length.toLocaleString()} / ${c.limit.toLocaleString()}` : ''}`}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="muse-cs-when">
            <span className="muse-field-label">When</span>
            <div className="muse-chip-row">
              <span className="muse-cs-when-now">{p.scheduledAt ? <>{when(p.scheduledAt)}{onSlot && <small> · {inf.name}’s slot</small>}</> : 'Not scheduled'}</span>
              {!locked && nextSlot && !(p.scheduledAt && new Date(p.scheduledAt).getTime() === nextSlot.at.getTime()) && <button type="button" className="muse-chip" onClick={() => { set({ scheduledAt: nextSlot.at.toISOString() }); setWhenPanel('') }}>Next free slot · {fmtSlot(nextSlot.at)}</button>}
              {!locked && slotChoices.length > 0 && <button type="button" className={`muse-chip${whenPanel === 'slots' ? ' on' : ''}`} aria-expanded={whenPanel === 'slots'} onClick={() => setWhenPanel(w => w === 'slots' ? '' : 'slots')}>Pick a slot</button>}
              {!locked && <button type="button" className={`muse-chip${whenPanel === 'custom' ? ' on' : ''}`} aria-expanded={whenPanel === 'custom'} onClick={() => setWhenPanel(w => w === 'custom' ? '' : 'custom')}>Custom time</button>}
              {!locked && p.scheduledAt && <button type="button" className="muse-chip" onClick={() => set({ scheduledAt: '' })}>Clear</button>}
            </div>
            {whenPanel === 'slots' && (
              <div className="muse-chip-row" role="group" aria-label="Free slots">
                {slotChoices.map(sl => {
                  const on = p.scheduledAt && new Date(p.scheduledAt).getTime() === sl.at.getTime()
                  return <button key={sl.at.toISOString()} type="button" className={`muse-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => { set({ scheduledAt: sl.at.toISOString() }); setWhenPanel('') }}>{fmtSlot(sl.at)}</button>
                })}
              </div>
            )}
            {whenPanel === 'custom' && <input className="muse-input" type="datetime-local" value={toLocalInput(p.scheduledAt)} onChange={e => set({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} aria-label="Date and time" style={{ maxWidth: 280 }} />}
            {inf && !schedule && <p className="muse-field-hint">Set {inf.name}’s <Link to="/settings?section=accounts">posting schedule</Link> to get slots and “Add to queue”.</p>}
          </div>

          <div className="muse-cs-foot">
            {(blocker || error) && (
              <p className={`muse-cs-warn${error ? ' muse-error' : ''}`}>
                {error || (blocker === 'connect' ? <>Connect a posting service to post. <Link to="/settings?section=connections">Connect</Link></> : blocker)}
              </p>
            )}
            {p.id && !scheduledOut && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => onDelete(p.id)}>Delete</button>}
            {approved && <span className="muse-badge approved" title={p.approvedAt ? `Approved ${new Date(p.approvedAt).toLocaleString()}` : undefined}>Approved ✓</span>}
            <button type="button" className="muse-btn muse-btn-text" onClick={downloadPack} disabled={!p.caption.trim() && !p.mediaUrls.length} title="Download the caption and media to post by hand">Download pack</button>
            {!editing && <button type="button" className="muse-btn muse-btn-tonal" onClick={() => finalize({ status: p.scheduledAt ? 'planned' : 'draft', approvedAt: undefined })} disabled={locked} title={approved ? 'Saving an edit moves it back to draft so it can be approved again' : undefined}>Save draft</button>}
            {canApprove && !editing && <button type="button" className="muse-btn muse-btn-tonal" onClick={() => finalize({ status: 'approved', approvedAt: new Date().toISOString() })}>Approve</button>}
            <div className="muse-split">
              <button type="button" className="muse-btn muse-btn-filled" disabled={!!blocker || busy || locked} onClick={() => send(false)}>
                {busy ? 'Sending…' : editing ? (future ? `Save changes · ${when(p.scheduledAt)}` : 'Save and post now') : retryRoutes.length ? `Retry ${retryRoutes.map(routeName).join(', ')}` : future ? `${onSlot ? 'Add to queue' : 'Schedule'} · ${when(p.scheduledAt)}` : 'Post now'}
              </button>
              {future && !editing && <button type="button" className="muse-btn muse-btn-filled muse-split-more" disabled={!!blocker || busy || locked} aria-label="More options" aria-expanded={menu} onClick={() => setMenu(m => !m)}>▾</button>}
              {menu && <div className="muse-split-menu" role="menu"><button type="button" role="menuitem" onClick={() => send(true)}>Post now instead</button></div>}
            </div>
          </div>
        </div>

        <aside className="muse-cs-preview" aria-label="Preview">
          <span className="muse-field-label">Preview</span>
          <div className="muse-preview-card">
            <div className="muse-preview-head"><span className="muse-rail-avatar" style={{ backgroundImage: (inf?.mainImage || inf?.image) ? `url(${inf.mainImage || inf.image})` : undefined }} /><strong>{targets[0]?.handle?.replace(/^@/, '') || inf?.name || 'your account'}</strong></div>
            <div className="muse-preview-media" style={{ backgroundImage: preview && !isVideo(preview) ? `url(${preview})` : undefined }}>{!preview ? <span>No media yet</span> : isVideo(preview) ? <span>Video</span> : null}</div>
            <p className="muse-preview-cap"><strong>{targets[0]?.handle?.replace(/^@/, '') || ''}</strong> {(tab === 'all' ? p.caption : tabText) || <em>{p.igFormat === 'story' && tab === 'instagram' ? 'Stories show no caption.' : 'Your caption shows here.'}</em>}</p>
          </div>
          {targets.some(a => PLATFORMS.find(x => x.id === a.platform)?.videoOnly) && <p className="muse-field-hint">TikTok and YouTube Shorts accept video only.</p>}
        </aside>
      </div>
    </div>
  )
}
