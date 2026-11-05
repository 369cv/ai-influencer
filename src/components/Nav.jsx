import { NavLink, useLocation } from 'react-router-dom'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { openStarters } from './StarterSheet'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/influencers', label: 'Influencers' },
  { to: '/content', label: 'Content' },
  { to: '/plan', label: 'Plan' },
  { to: '/library', label: 'Library' },
  { to: '/workflows', label: 'Workflows' },
]

// Light-only top bar: logo + workspace switcher, section links, "+ Create" (opens the
// three starters) and Settings. No theme toggle: Muse Studio is light mode only.
export default function Nav() {
  const { pathname } = useLocation()
  const landing = pathname === '/welcome'

  return (
    <nav className={`nav-root${landing ? ' landing' : ''}`}>
      <div className="nav-left">
        <NavLink to="/" className="nav-brand" aria-label="Muse Studio home">
          <img src="/icon.svg" alt="" width="28" height="28" />
          <span className="nav-brand-label">Muse Studio</span>
        </NavLink>
        {!landing && <WorkspaceSwitcher />}
      </div>

      <div className="nav-links">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-right">
        <button type="button" className="muse-btn muse-btn-filled nav-create" onClick={() => openStarters()} aria-haspopup="dialog">+ Create</button>
        <NavLink to="/settings" title="Settings" aria-label="Settings" className={({ isActive }) => `nav-icon${isActive ? ' active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </NavLink>
      </div>
    </nav>
  )
}
