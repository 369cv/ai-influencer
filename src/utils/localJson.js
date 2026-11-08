import { useEffect, useState, useCallback } from 'react'

// Global (not workspace-scoped) localStorage JSON value that stays in sync across
// every component using the same key, in this tab and in other tabs.
const EVT = 'muse:localjson'

export function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage write failed', key, e)
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }))
}

export function useLocalJSON(key, initial) {
  const [value, setValue] = useState(() => readJSON(key, initial))

  useEffect(() => {
    const sync = e => {
      const k = e.detail?.key ?? e.key
      if (k === key) setValue(readJSON(key, initial))
    }
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(updater => {
    const cur = readJSON(key, initial)
    const next = typeof updater === 'function' ? updater(cur) : updater
    writeJSON(key, next)
    setValue(next)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return [value, set]
}

export const newId = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
