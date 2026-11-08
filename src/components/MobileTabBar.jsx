import { NavLink, useLocation } from 'react-router-dom'

// Bottom tab bar, shown only on phone widths (see .muse-tabbar in index.css).
const I = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  people: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  plus: 'M12 5v14M5 12h14',
  spark: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z',
  deal: 'M20 7H4v12h16zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  library: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
}
const TABS = [
  { to: '/', label: 'Home', icon: I.home, end: true },
  { to: '/influencers', label: 'Influencers', icon: I.people },
  { to: '/create', label: 'Create', icon: I.plus, primary: true },
  { to: '/inspiration', label: 'Ideas', icon: I.spark },
  { to: '/library', label: 'Library', icon: I.library },
]

export default function MobileTabBar() {
  const { pathname } = useLocation()
  // Hidden on /create: the wizard pins its own Back/Next bar to the bottom.
  if (pathname === '/welcome' || pathname.startsWith('/auth') || pathname.startsWith('/create') || pathname.startsWith('/import') || /^\/workflows\/./.test(pathname)) return null
  return (
    <nav className="muse-tabbar" aria-label="Primary">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `muse-tab${isActive ? ' active' : ''}${t.primary ? ' primary' : ''}`}>
          <span className="muse-tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
          </span>
          <span className="muse-tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
