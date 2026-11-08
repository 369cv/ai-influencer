import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Appearance: 'system' (default, follows the device and switches live), 'light' or 'dark'.
// The choice is per browser (localStorage 'muse_theme'); index.html applies it before
// React loads so there's no flash. Tokens for both themes live in src/design/tokens.json.
export const THEME_KEY = 'muse_theme'
const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)
const readPref = () => { try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : 'system' } catch { return 'system' } }
const resolve = pref => (pref === 'system' ? (media()?.matches ? 'dark' : 'light') : pref)

const ThemeContext = createContext({ theme: 'light', pref: 'system', setPref: () => {}, toggle: () => {}, isDark: false })

export function ThemeProvider({ children }) {
  const [pref, setPrefState] = useState(readPref)
  const [theme, setTheme] = useState(() => resolve(readPref()))

  useEffect(() => {
    const apply = () => {
      const t = resolve(pref)
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#111114' : '#F8F9FC')
    }
    apply()
    if (pref !== 'system') return
    const m = media()
    m?.addEventListener?.('change', apply)
    return () => m?.removeEventListener?.('change', apply)
  }, [pref])

  const setPref = useCallback(p => {
    try { p === 'system' ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, p) } catch {}
    setPrefState(p)
  }, [])
  const toggle = useCallback(() => setPref(theme === 'dark' ? 'light' : 'dark'), [theme, setPref])

  return (
    <ThemeContext.Provider value={{ theme, pref, setPref, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
