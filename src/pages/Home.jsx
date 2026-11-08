import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { collectLibrary } from '../utils/library'
import { progress } from '../utils/planning'
import { platformName } from '../utils/publishing'
import { readJobs } from '../utils/studio'
import { isHFConnected } from '../utils/higgsfieldAuth'
import WeeklyIdeas from '../components/WeeklyIdeas'
import NeedsYou from '../components/NeedsYou'
import CreatePlan from '../components/CreatePlan'
import { SESSIONS_KEY, normalizeSessions, startSession, RATIOS } from '../utils/createSessions'
import { useLocalJSON } from '../utils/localJson'

// Create (Home): one box. A photoshoot request becomes a free, editable plan (?s=<id>)
// before anything is generated; the other chips hand the text to the right place.
const TARGETS = [
  { id: 'photoshoot', label: 'Photoshoot', placeholder: 'Describe the shoot: where, what she wears, the mood…' },
  { id: 'post', label: 'Post', placeholder: 'Write a caption or describe the post…' },
  { id: 'influencer', label: 'New influencer', placeholder: 'Describe an influencer: niche, vibe, story…' },
  { id: 'idea', label: 'Idea', placeholder: 'Capture an idea, a hook or a trend…' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
const when = iso => new Date(iso).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

export default function Home() {
  const navigate = useNavigate()
  const [influencers] = useInfluencers()
  const [projects] = useWorkspaceStore('muse_projects')
  const [posts] = useWorkspaceStore('muse_posts')
  const [params, setParams] = useSearchParams()
  const sessionId = params.get('s')
  const [target, setTarget] = useState(() => { try { const v = localStorage.getItem('muse_home_target'); return TARGETS.some(x => x.id === v) ? v : 'photoshoot' } catch { return 'photoshoot' } })
  const [who, setWho] = useState(() => { try { return localStorage.getItem('muse_create_who') || '' } catch { return '' } })
  const [ratio, setRatio] = useState('9:16')
  const [drafting, setDrafting] = useState(false)
  const [rawSessions] = useLocalJSON(SESSIONS_KEY, [])
  const sessions = normalizeSessions(rawSessions)
  const boxRef = useRef(null)
  // Profile "Create with her" / Add looks → Describe: preselect her and prefill the box.
  const location = useLocation()
  useEffect(() => {
    const st = location.state || {}
    if (!st.createFor && !st.createText) return
    if (st.createFor) { setWho(st.createFor); try { localStorage.setItem('muse_create_who', st.createFor) } catch {} }
    setTarget('photoshoot')
    if (st.createText) setText(st.createText)
    setTimeout(() => boxRef.current?.focus(), 0)
    navigate(location.pathname + location.search, { replace: true, state: {} })
  }, [location.key]) // eslint-disable-line
  // Sidebar "New" lands here with ?new=1: focus the box.
  useEffect(() => { if (params.get('new')) { boxRef.current?.focus(); setParams(q => { q.delete('new'); return q }, { replace: true }) } }, [params]) // eslint-disable-line
  const [text, setText] = useState('')
  const [accounts] = useWorkspaceStore('muse_accounts')
  const [hideChecklist, setHideChecklist] = useState(() => { try { return localStorage.getItem('muse_checklist_hidden') === '1' } catch { return false } })
  const fileRef = useRef(null)
  const t = TARGETS.find(x => x.id === target) || TARGETS[0]
  const recentInfluencers = (influencers || []).slice(-6).reverse()

  // One mixed list: upcoming posts, active projects, latest generations.
  const resume = useMemo(() => {
    const rows = []
    for (const p of posts || []) {
      if (p.status === 'posted') continue
      rows.push({ key: p.id, at: p.scheduledAt ? new Date(p.scheduledAt).getTime() : p.updatedAt || p.createdAt || 0, to: `/content?open=${p.id}`, thumb: p.mediaUrls?.find(u => !isVideo(u)), title: p.caption?.split('\n')[0] || 'Untitled post', sub: `Post · ${p.scheduledAt ? when(p.scheduledAt) : 'no date'} · ${(p.platforms || []).map(platformName).join(', ') || 'no accounts'}`, badge: { scheduled: 'Scheduled', planned: 'Planned', failed: 'Failed' }[p.status] || 'Draft', tone: p.status })
    }
    for (const p of projects || []) {
      if (p.status === 'done') continue
      rows.push({ key: p.id, at: p.updatedAt || p.createdAt || 0, to: `/plan?open=${p.id}`, title: p.name, sub: `Project · next: ${p.steps?.find(s => !s.done)?.label || 'all steps done'}`, progress: progress(p) })
    }
    for (const it of collectLibrary(influencers || []).sort((a, b) => b.date - a.date).slice(0, 3)) {
      rows.push({ key: it.id, at: it.date || 0, to: '/content?view=media', thumb: it.kind === 'photo' ? it.url : null, title: `${it.influencerName} · ${it.label}`, sub: `${it.kind === 'video' ? 'Video' : 'Photo'} · ${it.date ? new Date(it.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}`, badge: 'Ready', tone: 'posted' })
    }
    return rows.sort((a, b) => b.at - a.at).slice(0, 5)
  }, [posts, projects, influencers])

  const checklist = [
    { id: 'hf', label: 'Connect Higgsfield', done: isHFConnected(), to: '/settings?section=connections' },
    { id: 'inf', label: 'Create an influencer', done: (influencers || []).some(i => !/-template$/.test(i.id)), to: '/create' },
    { id: 'shoot', label: 'First photo shoot', done: readJobs().some(j => j.status === 'done') || collectLibrary(influencers || []).some(it => it.source === 'photo-studio'), to: '/studio' },
    { id: 'acct', label: 'Add a social account', done: (accounts || []).length > 0, to: '/settings?section=accounts' },
    { id: 'post', label: 'Schedule a post', done: (posts || []).some(p => ['planned', 'scheduled', 'posted'].includes(p.status)), to: '/content?compose=1' },
  ]
  const doneCount = checklist.filter(c => c.done).length
  const showChecklist = !hideChecklist && doneCount < checklist.length

  function pick(id) {
    setTarget(id)
    try { localStorage.setItem('muse_home_target', id) } catch {}
  }

  const list = influencers || []
  const creator = list.find(i => i.id === who) || list[list.length - 1]
  const pickWho = id => { setWho(id); try { localStorage.setItem('muse_create_who', id) } catch {} }

  async function submit(e) {
    e.preventDefault()
    const v = text.trim()
    if (!v || drafting) return
    if (target === 'photoshoot') {
      setDrafting(true)
      try { const id = await startSession({ request: v, influencer: creator, ratio }); setText(''); setParams({ s: id }) } finally { setDrafting(false) }
      return
    }
    if (target === 'post') navigate('/content?compose=1', { state: { prefillCaption: v } })
    else if (target === 'idea') navigate('/plan', { state: { newIdea: v } })
    else navigate('/create', { state: { prefillBackstory: v } })
  }

  // "+" attaches a photo as the face reference for a new influencer.
  function attach(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = () => navigate('/create', { state: { prefillFaceRef: r.result, prefillBackstory: text.trim() || undefined } })
    r.readAsDataURL(f)
  }

  // A request is open: the plan (then its results) gets the whole page.
  if (sessionId) return <div className="muse-home"><CreatePlan id={sessionId} onClose={() => setParams({})} /></div>

  return (
    <div className="muse-home">
      <div className="muse-glow" aria-hidden />
      <section className="muse-hero">
        <p className="muse-eyebrow">{greeting()}</p>
        <h1 className="muse-display">{target === 'photoshoot' && creator ? `What should ${creator.name || 'she'} make today?` : 'What are we making today?'}</h1>

        <form className="muse-composer muse-composer-stack" onSubmit={submit}>
          {(target === 'photoshoot' || target === 'post') && list.length > 0 && (
            <div className="muse-create-chips">
              <label className="muse-create-pill">
                <span className="muse-create-av" style={{ backgroundImage: (creator?.mainImage || creator?.image) ? `url(${creator.mainImage || creator.image})` : undefined }} />
                <span className="muse-create-pilltext"><b>{creator?.name || 'Influencer'}</b><small>Influencer</small></span>
                <select value={creator?.id || ''} onChange={e => pickWho(e.target.value)} aria-label="Influencer">
                  {list.map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
                </select>
              </label>
              {target === 'photoshoot' && (
                <label className="muse-create-pill">
                  <span className="muse-create-pilltext"><b>{ratio}</b><small>Format</small></span>
                  <select value={ratio} onChange={e => setRatio(e.target.value)} aria-label="Format">{RATIOS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                </label>
              )}
            </div>
          )}
          <textarea
            ref={boxRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            rows={2}
          />
          <div className="muse-composer-row">
            <button type="button" className="muse-icon-btn" title="Start an influencer from a photo" aria-label="Start an influencer from a photo" onClick={() => fileRef.current?.click()}>+</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={attach} />
            <span className="muse-create-hint">{target === 'photoshoot' ? (drafting ? 'Drafting the plan…' : 'Plan is free') : ''}</span>
            <button type="submit" className="muse-send" aria-label={`Start: ${t.label}`} title={`Start: ${t.label}`} disabled={!text.trim() || drafting}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>
        </form>

        <div className="muse-target muse-create-jobs" role="radiogroup" aria-label="What to make">
          {TARGETS.map(x => (
            <button key={x.id} type="button" role="radio" aria-checked={target === x.id} className={target === x.id ? 'on' : ''} onClick={() => pick(x.id)}>{x.label}</button>
          ))}
          <Link to="/studio?mode=video" className="muse-create-joblink">Video in Studio</Link>
        </div>

        {sessions.length > 0 && (
          <div className="muse-create-recent" aria-label="Recent requests">
            {sessions.slice(0, 6).map(x => (
              <button key={x.id} type="button" className="muse-chip" onClick={() => setParams({ s: x.id })} title={x.request}>
                {x.plan?.title || x.request.slice(0, 40)} <span className="muse-muted">· {{ plan: 'plan', running: 'making', done: 'ready', failed: 'failed', stopped: 'stopped' }[x.status]}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {showChecklist && (
        <section className="muse-recent muse-checklist" aria-label="Getting started">
          <div className="muse-section-head">
            <h2>Getting started <span className="muse-checklist-count">{doneCount}/{checklist.length}</span></h2>
            <button type="button" className="muse-text-btn" onClick={() => { setHideChecklist(true); try { localStorage.setItem('muse_checklist_hidden', '1') } catch {} }}>Hide</button>
          </div>
          <div className="muse-checklist-bar" aria-hidden>{checklist.map(c => <span key={c.id} className={c.done ? 'done' : ''} />)}</div>
          <ol className="muse-checklist-list">
            {checklist.map(c => (
              <li key={c.id} className={c.done ? 'done' : ''}>
                <Link to={c.to}><span className="muse-checklist-dot" aria-hidden>{c.done ? '✓' : ''}</span>{c.label}{c.done && <span className="sr-only"> (done)</span>}</Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <NeedsYou />

      <WeeklyIdeas />

      {resume.length > 0 && (
        <section className="muse-recent muse-resume">
          <div className="muse-section-head"><h2>Pick up where you left off</h2></div>
          <ul className="muse-list muse-panel">
            {resume.map(r => (
              <li key={r.key}>
                <Link to={r.to} className="muse-list-row">
                  <span className="muse-thumb" style={{ backgroundImage: r.thumb ? `url(${r.thumb})` : undefined }} />
                  <span className="muse-list-main"><strong>{r.title}</strong><small>{r.sub}</small></span>
                  {r.progress != null
                    ? <span className="muse-progress" aria-label={`${r.progress}% done`}><span style={{ width: `${r.progress}%` }} /></span>
                    : <span className={`muse-badge ${r.tone || ''}`}>{r.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentInfluencers.length > 0 && (
        <section className="muse-recent">
          <div className="muse-section-head">
            <h2>Your influencers</h2>
            <Link to="/influencers" className="muse-text-btn">View all</Link>
          </div>
          <div className="muse-card-row">
            {recentInfluencers.map(inf => (
              <Link key={inf.id} to="/influencers" state={{ selectId: inf.id }} className="muse-card">
                <div className="muse-card-img" style={{ backgroundImage: (inf.mainImage || inf.image) ? `url(${inf.mainImage || inf.image})` : undefined }} />
                <div className="muse-card-body">
                  <strong>{inf.name || 'Untitled'}</strong>
                  <span>{inf.niche || inf.title || (inf.niches || []).join(', ') || '—'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
