import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Workspaces: one per brand or client. The switcher sits under the logo.
// Planning, content, social accounts and tracked creators are stored per workspace
// (see useWorkspaceStore). Influencers, the Library and Settings stay global.

const LIST_KEY = 'muse_workspaces'
const ACTIVE_KEY = 'muse_active_workspace'
const DEFAULT_WS = { id: 'ws_default', name: 'My studio' }

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { console.warn('localStorage write failed', key, e) }
}

const WorkspaceCtx = createContext(null)

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState(() => {
    const list = read(LIST_KEY, null)
    return Array.isArray(list) && list.length ? list : [DEFAULT_WS]
  })
  const [activeId, setActiveId] = useState(() => read(ACTIVE_KEY, DEFAULT_WS.id))

  useEffect(() => { write(LIST_KEY, workspaces) }, [workspaces])
  useEffect(() => { write(ACTIVE_KEY, activeId) }, [activeId])

  const active = workspaces.find(w => w.id === activeId) || workspaces[0]

  const addWorkspace = useCallback(name => {
    const ws = { id: 'ws_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.trim() || 'Untitled workspace' }
    setWorkspaces(l => [...l, ws])
    setActiveId(ws.id)
    return ws
  }, [])
  const renameWorkspace = useCallback((id, name) => setWorkspaces(l => l.map(w => w.id === id ? { ...w, name: name.trim() || w.name } : w)), [])
  const removeWorkspace = useCallback(id => {
    setWorkspaces(l => {
      if (l.length <= 1) return l
      const next = l.filter(w => w.id !== id)
      if (activeId === id) setActiveId(next[0].id)
      return next
    })
  }, [activeId])

  return (
    <WorkspaceCtx.Provider value={{ workspaces, active, setActiveId, addWorkspace, renameWorkspace, removeWorkspace }}>
      {children}
    </WorkspaceCtx.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceCtx)

// A localStorage-backed list scoped to the active workspace: key `${base}__${workspaceId}`.
// Re-reads when the workspace changes.
export function useWorkspaceStore(base, initial = []) {
  const { active } = useWorkspace()
  const key = `${base}__${active.id}`
  const [state, setState] = useState(() => ({ key, value: read(key, initial) }))
  const value = state.key === key ? state.value : read(key, initial)

  useEffect(() => {
    if (state.key !== key) setState({ key, value: read(key, initial) })
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback(updater => {
    setState(prev => {
      const cur = prev.key === key ? prev.value : read(key, initial)
      const next = typeof updater === 'function' ? updater(cur) : updater
      write(key, next)
      return { key, value: next }
    })
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue]
}

// Read a workspace store outside React (e.g. Home summary rows).
export function readWorkspaceStore(base, workspaceId, initial = []) {
  return read(`${base}__${workspaceId}`, initial)
}
