import { useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { collectLibrary } from '../utils/library'
import { progress } from '../utils/planning'
import { platformName } from '../utils/publishing'
import { STUDIO_TEMPLATES, readJobs } from '../utils/studio'
import { isHFConnected } from '../utils/higgsfieldAuth'

// Home: one composer and one "Pick up where you left off" list.
// The picker inside the composer decides where a typed prompt goes.
const TARGETS = [
  { id: 'influencer', label: 'Influencer', placeholder: 'Describe an influencer: niche, vibe, story…' },
  { id: 'post', label: 'Post', placeholder: 'Write a caption or describe the post…' },
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
  const [target, setTarget] = useState(() => { try { return localStorage.getItem('muse_home_target') || 'influencer' } catch { return 'influencer' } })
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

  function submit(e) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
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

  return (
    <div className="muse-home">
      <div className="muse-glow" aria-hidden />
      <section className="muse-hero">
        <p className="muse-eyebrow">{greeting()}</p>
        <h1 className="muse-display">What are we making today?</h1>

        <form className="muse-composer muse-composer-stack" onSubmit={submit}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            rows={2}
          />
          <div className="muse-composer-row">
            <button type="button" className="muse-icon-btn" title="Start from a photo" aria-label="Start an influencer from a photo" onClick={() => fileRef.current?.click()}>+</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={attach} />
            <div className="muse-target" role="radiogroup" aria-label="What to make">
              {TARGETS.map(x => (
                <button key={x.id} type="button" role="radio" aria-checked={target === x.id} className={target === x.id ? 'on' : ''} onClick={() => pick(x.id)}>{x.label}</button>
              ))}
            </div>
            <button type="submit" className="muse-send" aria-label={`Start: ${t.label}`} title={`Start: ${t.label}`} disabled={!text.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>
        </form>

        <div className="muse-home-templates" aria-label="Templates">
          {STUDIO_TEMPLATES.map(t => <Link key={t.id} to={`/studio?template=${t.id}`} className="muse-chip" title={t.hint}>{t.label}</Link>)}
        </div>
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
