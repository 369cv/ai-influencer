import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../context/workspace'

// Sits under/next to the logo. Switches the active workspace (brand or client).
export default function WorkspaceSwitcher() {
  const { workspaces, active, setActiveId, addWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="muse-ws" ref={ref}>
      <button type="button" className="muse-ws-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)} title="Switch workspace">
        <span className="muse-ws-avatar" aria-hidden>{(active.name || 'W').slice(0, 1).toUpperCase()}</span>
        <span className="muse-ws-name">{active.name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="muse-ws-menu" role="menu">
          <span className="muse-rail-heading">Workspaces</span>
          {workspaces.map(w => (
            <button key={w.id} type="button" role="menuitemradio" aria-checked={w.id === active.id} className={`muse-ws-item${w.id === active.id ? ' on' : ''}`} onClick={() => { setActiveId(w.id); setOpen(false) }}>
              <span className="muse-ws-avatar sm" aria-hidden>{(w.name || 'W').slice(0, 1).toUpperCase()}</span>
              <span>{w.name}</span>
              {w.id === active.id && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5 9-10" /></svg>}
            </button>
          ))}
          <form className="muse-ws-new" onSubmit={e => { e.preventDefault(); if (name.trim()) { addWorkspace(name); setName(''); setOpen(false) } }}>
            <input className="muse-input muse-input-sm" value={name} onChange={e => setName(e.target.value)} placeholder="New workspace" aria-label="New workspace name" />
            <button type="submit" className="muse-btn muse-btn-tonal" disabled={!name.trim()}>Add</button>
          </form>
          <Link to="/settings?section=workspace" className="muse-ws-manage" onClick={() => setOpen(false)}>Manage workspaces</Link>
        </div>
      )}
    </div>
  )
}
