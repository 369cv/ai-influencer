import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './context/theme'
import { WorkspaceProvider } from './context/workspace'
import { StoreProvider } from './store'
import { silentRefreshHFToken } from './utils/higgsfieldAuth'
import Nav from './components/Nav'
import OfflineBanner from './components/OfflineBanner'
import Landing from './pages/Landing'
import Home from './pages/Home'
import MobileTabBar from './components/MobileTabBar'
import AppSidebar from './components/AppSidebar'
import Influencers from './pages/Influencers'
import Inspiration from './pages/Inspiration'
import BrandDeals from './pages/BrandDeals'
import Create from './pages/Create'
import Settings from './pages/Settings'
import Library from './pages/Library'
import Workflows from './pages/Workflows'
import Import from './pages/Import'
import Content from './pages/Content'
import Plan from './pages/Plan'
import Tracking from './pages/Tracking'
import StarterSheet from './components/StarterSheet'
import AuthCallback from './pages/AuthCallback'

const FEEDBACK_FORM_URL = 'https://forms.gle/p5cBXw4sYaHPdcANA'

function FeedbackButton() {
  const [hover, setHover] = useState(false)

  return (
    <a
      className="muse-feedback"
      href={FEEDBACK_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Something broke? Have an idea? Send feedback"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 8,
        height: 44, padding: '0 16px', borderRadius: 22,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        color: 'var(--text-primary)',
        fontSize: 14, fontWeight: 600, textDecoration: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.18s',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
      Feedback
    </a>
  )
}

export default function App() {
  useEffect(() => {
    silentRefreshHFToken()
    function onVisible() {
      if (document.visibilityState === 'visible') silentRefreshHFToken()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <ThemeProvider>
    <StoreProvider>
    <WorkspaceProvider>
    <BrowserRouter>
      <AppSidebar />
      <Nav />
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/influencers" element={<Influencers />} />
        <Route path="/content" element={<Content />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/library" element={<Library />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/import" element={<Import />} />
        <Route path="/workflows/:id" element={<Workflows />} />
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/brand-deals" element={<BrandDeals />} />
        <Route path="/create" element={<Create />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <StarterSheet />
      <FeedbackButton />
      <MobileTabBar />
      <Analytics />
    </BrowserRouter>
    </WorkspaceProvider>
    </StoreProvider>
    </ThemeProvider>
  )
}
