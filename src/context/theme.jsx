import { createContext, useContext, useEffect } from 'react'

// Muse Studio is light-only. The provider keeps its old API (theme, toggle, isDark)
// so existing callers keep working, but the theme is always "light".
const ThemeContext = createContext({ theme: 'light', toggle: () => {}, isDark: false })

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    try { localStorage.setItem('theme', 'light') } catch {}
  }, [])
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggle: () => {}, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
