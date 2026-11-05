import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useInfluencers } from '../store'
import { openStarters } from './StarterSheet'

// Desktop sidebar (≥1100px): a collapsible rail with New, the main sections and
// recent influencers. Phones use MobileTabBar; mid widths keep the top nav links.
// It sets html[data-rail="collapsed|expanded"] so the shell can offset content.

const KEY = 'muse_rail_expanded'
const I = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M12 5v14M5 12h14',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  people: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  library: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  flow: 'M6 4v6a2 2 0 0 0 2 2h8a2 2 0 0 1 2 2v6M6 4a2 2 0 1 0 0 .01M18 20a2 2 0 1 0 0 .01',
  spark: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z',
  deal: 'M20 7H4v12h16zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  content: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5',
  plan: 'M9 4h6M5 8h14v12H5zM9 12h6M9 16h4',
  track: 'M3 17l6-6 4 4 8-8M15 7h6v6',
}
const LINKS = [
  { to: '/', label: 'Home', icon: I.home, end: true },
  { to: '/influencers', label: 'Influencers', icon: I.people },
  { to: '/content', label: 'Content', icon: I.content },
  { to: '/plan', label: 'Plan', icon: I.plan },
  { to: '/tracking', label: 'Tracking', icon: I.track },
  { to: '/library', label: 'Library', icon: I.library },
  { to: '/workflows', label: 'Workflows', icon: I.flow },
  { to: '/inspiration', label: 'Inspiration', icon: I.spark },
  { to: '/brand-deals', label: 'Brand Deals', icon: I.deal },
]
const Icon = ({ d }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>

export default function AppSidebar() {
  const { pathname } = useLocation()
  const [influencers] = useInfluencers()
  const [expanded, setExpanded] = useState(() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })
  const hidden = pathname === '/welcome' || pathname.startsWith('/auth')

  useEffect(() => {
    const el = document.documentElement
    if (hidden) el.removeAttribute('data-rail')
    else el.setAttribute('data-rail', expanded ? 'expanded' : 'collapsed')
    try { localStorage.setItem(KEY, expanded ? '1' : '0') } catch {}
    return () => el.removeAttribute('data-rail')
  }, [expanded, hidden])

  if (hidden) return null
  const recent = (influencers || []).slice(-5).reverse()

  return (
    <aside className={`muse-rail${expanded ? ' expanded' : ''}`} aria-label="Sidebar">
      <button type="button" className="muse-rail-item muse-rail-toggle" onClick={() => setExpanded(e => !e)} aria-expanded={expanded} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} title={expanded ? 'Collapse' : 'Expand'}>
        <Icon d={I.menu} />
      </button>

      <button type="button" className="muse-rail-new" title="Create, manage content or plan" onClick={() => openStarters()}>
        <Icon d={I.plus} /><span className="muse-rail-label">New</span>
      </button>

      <nav className="muse-rail-nav">
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end} title={l.label} className={({ isActive }) => `muse-rail-item${isActive ? ' active' : ''}`}>
            <Icon d={l.icon} /><span className="muse-rail-label">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {expanded && recent.length > 0 && (
        <div className="muse-rail-recent">
          <span className="muse-rail-heading">Recent</span>
          {recent.map(inf => (
            <Link key={inf.id} to="/influencers" state={{ selectId: inf.id }} className="muse-rail-item muse-rail-person" title={inf.name}>
              <span className="muse-rail-avatar" style={{ backgroundImage: (inf.mainImage || inf.image) ? `url(${inf.mainImage || inf.image})` : undefined }} />
              <span className="muse-rail-label">{inf.name || 'Untitled'}</span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  )
}
