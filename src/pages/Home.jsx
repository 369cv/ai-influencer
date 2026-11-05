import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { openStarters, STARTERS } from '../components/StarterSheet'
import { progress } from '../utils/planning'
import { platformName } from '../utils/publishing'

// Prompt-first home with three starters: Create, Manage content, Plan.
// The segmented toggle above the composer decides what a typed prompt does.
const MODES = {
  create: {
    heading: 'Who are we creating today?',
    placeholder: 'Describe your influencer: niche, vibe, story…',
    cta: 'Start creating',
    chips: [
      { label: 'New influencer', to: '/create' },
      { label: 'Photo shoot', to: '/influencers', state: { studioTab: 'photo' } },
      { label: 'Video', to: '/influencers', state: { studioTab: 'content' } },
      { label: 'Workflows', to: '/workflows' },
    ],
  },
  content: {
    heading: 'What are we posting?',
    placeholder: 'Write a caption or describe the post…',
    cta: 'Compose post',
    chips: [
      { label: 'Compose post', to: '/content?compose=1' },
      { label: 'Calendar', to: '/content?tab=calendar' },
      { label: 'Library', to: '/library' },
      { label: 'Social accounts', to: '/content?tab=accounts' },
    ],
  },
  plan: {
    heading: 'What are we planning?',
    placeholder: 'Capture an idea, a hook or a project…',
    cta: 'Save idea',
    chips: [
      { label: 'Ideas', to: '/plan' },
      { label: 'Projects', to: '/plan?tab=projects' },
      { label: 'Track creators', to: '/tracking' },
      { label: 'Brand deals', to: '/brand-deals' },
      { label: 'Inspiration', to: '/inspiration' },
    ],
  },
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const navigate = useNavigate()
  const [influencers] = useInfluencers()
  const [projects] = useWorkspaceStore('muse_projects')
  const [posts] = useWorkspaceStore('muse_posts')
  const [mode, setMode] = useState(() => { try { return localStorage.getItem('muse_home_mode') || 'create' } catch { return 'create' } })
  const [text, setText] = useState('')
  const m = MODES[mode] || MODES.create
  const recent = (influencers || []).slice(-6).reverse()
  const activeProjects = (projects || []).filter(p => p.status !== 'done').slice(0, 3)
  const upcoming = (posts || [])
    .filter(p => (p.status === 'scheduled' || p.status === 'planned') && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3)

  function pick(id) {
    setMode(id)
    try { localStorage.setItem('muse_home_mode', id) } catch {}
  }

  function submit(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    if (mode === 'content') navigate('/content?compose=1', { state: { prefillCaption: t } })
    else if (mode === 'plan') navigate('/plan', { state: { newIdea: t } })
    else navigate('/create', { state: { prefillBackstory: t } })
  }

  return (
    <div className="muse-home">
      <div className="muse-glow" aria-hidden />
      <section className="muse-hero">
        <p className="muse-eyebrow">{greeting()}</p>
        <h1 className="muse-display">{m.heading}</h1>

        <div className="muse-mode-toggle" role="tablist" aria-label="Starter">
          {STARTERS.map(s => (
            <button key={s.id} type="button" role="tab" aria-selected={mode === s.id} className={mode === s.id ? 'on' : ''} onClick={() => pick(s.id)}>
              {s.title}
            </button>
          ))}
        </div>

        <form className="muse-composer" onSubmit={submit}>
          <button type="button" className="muse-icon-btn" title="All starters" aria-label="Open starters" onClick={() => openStarters(mode)}>+</button>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={m.placeholder}
            aria-label={m.placeholder}
          />
          <button type="submit" className="muse-send" aria-label={m.cta} title={m.cta} disabled={!text.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </form>
        <div className="muse-chips">
          {m.chips.map(c => <Link key={c.label} to={c.to} state={c.state} className="muse-chip">{c.label}</Link>)}
        </div>
      </section>

      {(activeProjects.length > 0 || upcoming.length > 0) && (
        <section className="muse-recent muse-home-split">
          {activeProjects.length > 0 && (
            <div className="muse-panel">
              <div className="muse-section-head"><h2>Active projects</h2><Link to="/plan?tab=projects" className="muse-text-btn">All projects</Link></div>
              <ul className="muse-list">
                {activeProjects.map(p => (
                  <li key={p.id}>
                    <Link to={`/plan?tab=projects&open=${p.id}`} className="muse-list-row">
                      <span className="muse-list-main"><strong>{p.name}</strong><small>{p.steps?.filter(s => !s.done)[0]?.label || 'All steps done'}</small></span>
                      <span className="muse-progress" aria-label={`${progress(p)}% done`}><span style={{ width: `${progress(p)}%` }} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="muse-panel">
              <div className="muse-section-head"><h2>Up next</h2><Link to="/content?tab=calendar" className="muse-text-btn">Calendar</Link></div>
              <ul className="muse-list">
                {upcoming.map(p => (
                  <li key={p.id}>
                    <Link to={`/content?open=${p.id}`} className="muse-list-row">
                      <span className="muse-list-main"><strong>{p.caption?.slice(0, 60) || 'Untitled post'}</strong><small>{new Date(p.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {(p.platforms || []).map(platformName).join(', ') || 'No accounts'}</small></span>
                      <span className={`muse-badge ${p.status}`}>{p.status === 'scheduled' ? 'Scheduled' : 'Planned'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {recent.length > 0 && (
        <section className="muse-recent">
          <div className="muse-section-head">
            <h2>Your influencers</h2>
            <Link to="/influencers" className="muse-text-btn">View all</Link>
          </div>
          <div className="muse-card-row">
            {recent.map(inf => (
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
