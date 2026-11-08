import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useInfluencers } from '../store'

// Prompt-first home: greeting + one pill composer over the brand glow,
// quick-action chips, and recent influencers.
const CHIPS = [
  { label: 'New influencer', to: '/create' },
  { label: 'Photo shoot', to: '/influencers' },
  { label: 'Video', to: '/influencers' },
  { label: 'Workflows', to: '/workflows' },
  { label: 'Brand deal', to: '/brand-deals' },
  { label: 'Inspiration', to: '/inspiration' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const navigate = useNavigate()
  const [influencers] = useInfluencers()
  const [text, setText] = useState('')
  const recent = (influencers || []).slice(-6).reverse()

  function submit(e) {
    e.preventDefault()
    const brief = text.trim()
    navigate('/create', { state: brief ? { prefillBackstory: brief } : {} })
  }

  return (
    <div className="muse-home">
      <div className="muse-glow" aria-hidden />
      <section className="muse-hero">
        <p className="muse-eyebrow">{greeting()}</p>
        <h1 className="muse-display">Who are we creating today?</h1>
        <form className="muse-composer" onSubmit={submit}>
          <Link to="/create" className="muse-icon-btn" title="Start from a photo" aria-label="Start from a photo">+</Link>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe your influencer: niche, vibe, story…"
            aria-label="Describe your influencer"
          />
          <button type="submit" className="muse-send" aria-label="Start creating" disabled={!text.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </form>
        <div className="muse-chips">
          {CHIPS.map(c => <Link key={c.label} to={c.to} className="muse-chip">{c.label}</Link>)}
        </div>
      </section>

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
