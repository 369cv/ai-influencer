import { useEffect, useLayoutEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useInfluencers } from '../store'
import { openNewMenu } from './NewMenu'
import WorkspaceSwitcher from './WorkspaceSwitcher'

// The one navigation. ≥1100px: full sidebar (collapsible to icons). 720–1099px:
// icons only. <720px: a drawer opened from the slim top bar (see Nav.jsx).
// Sets html[data-rail="collapsed|expanded"] so the shell can offset content,
// and html[data-drawer="open"] while the phone-width drawer is open.

const KEY = 'muse_rail_expanded'
const FEEDBACK_FORM_URL = 'https://forms.gle/p5cBXw4sYaHPdcANA'
const I = {
  collapse: 'M15 6l-6 6 6 6',
  expand: 'M9 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  people: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  content: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5',
  plan: 'M9 4h6M5 8h14v12H5zM9 12h6M9 16h4',
  help: 'M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7.2 19.73l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.2 14.1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.27 7.3l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9.9 3.3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.8 9.9H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.1z',
}
const LINKS = [
  { to: '/', label: 'Home', icon: I.home, end: true },
  { to: '/influencers', label: 'Influencers', icon: I.people },
  { to: '/content', label: 'Content', icon: I.content },
  { to: '/plan', label: 'Plan', icon: I.plan },
]
const Icon = ({ d }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>

export const DRAWER_EVT = 'muse:drawer'
export const openDrawer = () => window.dispatchEvent(new CustomEvent(DRAWER_EVT, { detail: true }))

export default function AppSidebar() {
  const { pathname } = useLocation()
  const [influencers] = useInfluencers()
  const [expanded, setExpanded] = useState(() => { try { return localStorage.getItem(KEY) !== '0' } catch { return true } })
  const [drawer, setDrawer] = useState(false)
  const hidden = pathname === '/welcome' || pathname.startsWith('/auth')

  // Layout effect: set the offset before the first paint so content doesn't slide in.
  useLayoutEffect(() => {
    const el = document.documentElement
    if (hidden) el.removeAttribute('data-rail')
    else el.setAttribute('data-rail', expanded ? 'expanded' : 'collapsed')
    try { localStorage.setItem(KEY, expanded ? '1' : '0') } catch {}
    return () => el.removeAttribute('data-rail')
  }, [expanded, hidden])

  // Phone-width drawer
  useEffect(() => {
    const on = e => setDrawer(!!e.detail)
    window.addEventListener(DRAWER_EVT, on)
    return () => window.removeEventListener(DRAWER_EVT, on)
  }, [])
  useEffect(() => { setDrawer(false) }, [pathname])
  useEffect(() => {
    const el = document.documentElement
    if (drawer) el.setAttribute('data-drawer', 'open'); else el.removeAttribute('data-drawer')
    if (!drawer) return
    const k = e => { if (e.key === 'Escape') setDrawer(false) }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); el.removeAttribute('data-drawer') }
  }, [drawer])

  if (hidden) return null
  const recent = (influencers || []).slice(-5).reverse()

  return (
    <>
      {drawer && <div className="muse-drawer-scrim" onClick={() => setDrawer(false)} aria-hidden />}
      <aside className={`muse-rail${expanded ? ' expanded' : ''}`} aria-label="Sidebar">
        <div className="muse-rail-top">
          <Link to="/" className="muse-rail-logo" aria-label="Muse Studio home"><img src="/icon.svg" alt="" width="28" height="28" /></Link>
          <WorkspaceSwitcher />
          <button type="button" className="muse-rail-collapse" onClick={() => { const el = document.documentElement; el.setAttribute('data-rail-anim', ''); setTimeout(() => el.removeAttribute('data-rail-anim'), 400); setExpanded(e => !e) }} aria-expanded={expanded} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} title={expanded ? 'Collapse' : 'Expand'}>
            <Icon d={expanded ? I.collapse : I.expand} />
          </button>
        </div>

        <button type="button" className="muse-rail-new" title="New" aria-haspopup="menu" onClick={e => openNewMenu(e.currentTarget)}>
          <Icon d={I.plus} /><span className="muse-rail-label">New</span>
        </button>

        <nav className="muse-rail-nav">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} title={l.label} className={({ isActive }) => `muse-rail-item${isActive ? ' active' : ''}`}>
              <Icon d={l.icon} /><span className="muse-rail-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {recent.length > 0 && (
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

        <div className="muse-rail-foot">
          <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="muse-rail-item" title="Help & feedback">
            <Icon d={I.help} /><span className="muse-rail-label">Help &amp; feedback</span>
          </a>
          <NavLink to="/settings" title="Settings" className={({ isActive }) => `muse-rail-item${isActive ? ' active' : ''}`}>
            <Icon d={I.settings} /><span className="muse-rail-label">Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  )
}
