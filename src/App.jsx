import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './context/theme'
import { WorkspaceProvider } from './context/workspace'
import { StoreProvider } from './store'
import { silentRefreshHFToken } from './utils/higgsfieldAuth'
import Nav from './components/Nav'
import OfflineBanner from './components/OfflineBanner'
import Landing from './pages/Landing'
import Home from './pages/Home'
import AppSidebar from './components/AppSidebar'
import Influencers from './pages/Influencers'
import Create from './pages/Create'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Inspiration from './pages/Inspiration'
import Workflows from './pages/Workflows'
import Import from './pages/Import'
import Content from './pages/Content'
import Studio from './pages/Studio'
import AuthCallback from './pages/AuthCallback'

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
        <Route path="/plan" element={<Navigate to="/content?view=ideas" replace />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/tracking" element={<Navigate to="/content?view=ideas" replace />} />
        <Route path="/library" element={<Navigate to="/content?view=media" replace />} />
        <Route path="/workflows" element={<Navigate to="/" replace />} />
        <Route path="/import" element={<Import />} />
        <Route path="/workflows/:id" element={<Workflows />} />
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/brand-deals" element={<BrandDealsRedirect />} />
        <Route path="/create" element={<Create />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        <Route path="/help/c/:id" element={<Help />} />
        <Route path="/help/a/:slug" element={<Help />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
    </WorkspaceProvider>
    </StoreProvider>
    </ThemeProvider>
  )
}

// /brand-deals?deal=<id> (Needs you, deliverables) → Content › Deals, keeping the deal to open.
function BrandDealsRedirect() {
  const { search } = useLocation()
  const q = new URLSearchParams(search); q.set('view', 'deals')
  return <Navigate to={`/content?${q}`} replace />
}
