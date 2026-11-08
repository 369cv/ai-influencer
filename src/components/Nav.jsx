import { NavLink, useLocation } from 'react-router-dom'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { openDrawer } from './AppSidebar'

// Slim top bar. Shown only below 720px (logo, workspace, ☰ opens the sidebar as a
// drawer) and on the /welcome landing page. From 720px up the sidebar is the only
// navigation, so this bar is hidden by CSS (see muse-pages.css).
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
      <div className="nav-right">
        {landing
          ? <NavLink to="/" className="muse-btn muse-btn-filled nav-create">Open studio</NavLink>
          : (
            <button type="button" className="nav-icon" onClick={openDrawer} aria-label="Open menu" title="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          )}
      </div>
    </nav>
  )
}
