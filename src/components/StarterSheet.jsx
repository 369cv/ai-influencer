import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// The three starters behind every "+ Create" button, the sidebar's New button,
// the phone tab bar and the Home composer's "+": Create, Manage content, Plan.
// Open it from anywhere with openStarters() (optionally openStarters('plan')).

const EVT = 'muse:starters'
export function openStarters(mode) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { mode } }))
}

const P = {
  create: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z',
  content: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5',
  plan: 'M9 4h6M5 8h14v12H5zM9 12h6M9 16h4',
}
const Ico = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)

export const STARTERS = [
  {
    id: 'create', title: 'Create', sub: 'New influencers, photo shoots and videos', icon: P.create,
    actions: [
      { label: 'New influencer', hint: 'Name, niche, look, then the face anchor', to: '/create' },
      { label: 'Photo shoot', hint: 'Poses, outfits and locations for an influencer', to: '/influencers', state: { studioTab: 'photo' } },
      { label: 'Video', hint: 'Animate a photo or a script', to: '/influencers', state: { studioTab: 'content' } },
      { label: 'From a workflow', hint: 'Run a saved multi-step template', to: '/workflows' },
    ],
  },
  {
    id: 'content', title: 'Manage content', sub: 'Library, posts, calendar and social accounts', icon: P.content,
    actions: [
      { label: 'Compose a post', hint: 'Pick media, write the caption, choose accounts', to: '/content?compose=1' },
      { label: 'Content calendar', hint: 'Everything planned, scheduled and posted', to: '/content?tab=calendar' },
      { label: 'Library', hint: 'Every photo and video you generated', to: '/library' },
      { label: 'Social accounts', hint: 'Connect and manage where you post', to: '/content?tab=accounts' },
    ],
  },
  {
    id: 'plan', title: 'Plan', sub: 'Ideas, projects and the creators you track', icon: P.plan,
    actions: [
      { label: 'Capture an idea', hint: 'Save it now, shape it later', to: '/plan?new=idea' },
      { label: 'New project', hint: 'A content piece, series, brand deal or launch', to: '/plan?tab=projects&new=project' },
      { label: 'Track creators', hint: 'Benchmark influencers and competitors', to: '/tracking' },
      { label: 'Brand deals', hint: 'Briefs, deliverables and payments', to: '/brand-deals' },
    ],
  },
]

export default function StarterSheet() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('create')

  useEffect(() => {
    const on = e => { setMode(e.detail?.mode || 'create'); setOpen(true) }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  useEffect(() => {
    if (!open) return
    const k = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  if (!open) return null
  const s = STARTERS.find(x => x.id === mode) || STARTERS[0]
  const go = a => { setOpen(false); navigate(a.to, a.state ? { state: a.state } : undefined) }

  return (
    <div className="muse-sheet-backdrop" onClick={() => setOpen(false)}>
      <div className="muse-sheet muse-starters" role="dialog" aria-modal="true" aria-label="What do you want to do?" onClick={e => e.stopPropagation()}>
        <div className="muse-plan">
          <div className="muse-plan-head">
            <h3>What do you want to do?</h3>
            <p>Pick a starter. You can switch any time.</p>
          </div>
          <div className="muse-starter-tabs" role="tablist">
            {STARTERS.map(x => (
              <button key={x.id} type="button" role="tab" aria-selected={x.id === mode} className={`muse-starter-tab${x.id === mode ? ' on' : ''}`} onClick={() => setMode(x.id)}>
                <Ico d={x.icon} size={20} />
                <span>{x.title}</span>
              </button>
            ))}
          </div>
          <p className="muse-starter-sub">{s.sub}</p>
          <ul className="muse-starter-list">
            {s.actions.map(a => (
              <li key={a.label}>
                <button type="button" className="muse-starter-action" onClick={() => go(a)}>
                  <span><strong>{a.label}</strong><small>{a.hint}</small></span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </li>
            ))}
          </ul>
          <div className="muse-plan-actions">
            <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
