import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// The one "New" menu: every way to start something, grouped, no tabs.
// Open it from anywhere with openNewMenu(anchorElement?). With an anchor it opens
// as a popover next to it; without one (or on narrow screens) it opens centered.

const EVT = 'muse:new-menu'
export function openNewMenu(anchor) {
  const r = anchor?.getBoundingClientRect?.()
  window.dispatchEvent(new CustomEvent(EVT, { detail: r ? { top: r.top, left: r.right, bottom: r.bottom } : null }))
}

const P = {
  influencer: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  photo: 'M4 6h16v12H4zM4 15l5-5 4 4 3-3 4 4',
  video: 'M4 6h11v12H4zM15 10l5-3v10l-5-3',
  product: 'M20 7H4v12h16zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  post: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  idea: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
  project: 'M9 4h6M5 8h14v12H5zM9 12h6M9 16h4',
  template: 'M6 4v6a2 2 0 0 0 2 2h8a2 2 0 0 1 2 2v6M6 4a2 2 0 1 0 0 .01M18 20a2 2 0 1 0 0 .01',
}

export const NEW_GROUPS = [
  { label: 'Create', items: [
    { id: 'influencer', label: 'Influencer', hint: 'Name, niche, look, face anchor', to: '/create', icon: P.influencer },
    { id: 'photo', label: 'Photo shoot', hint: 'Prompt, character, shot list', to: '/studio', icon: P.photo },
    { id: 'video', label: 'Video', hint: 'Animate a photo or a script', to: '/studio?mode=video', icon: P.video },
    { id: 'product', label: 'Product sheet', hint: 'Brand product for a sponsored post', to: '/brand-deals', icon: P.product },
  ] },
  { label: 'Content', items: [
    { id: 'post', label: 'Post', hint: 'Media, caption, accounts, time', to: '/content?compose=1', icon: P.post },
  ] },
  { label: 'Plan', items: [
    { id: 'idea', label: 'Idea', hint: 'Save it now, shape it later', to: '/plan?new=idea', icon: P.idea },
    { id: 'project', label: 'Project', hint: 'Content piece, series, brand deal, launch', to: '/plan?new=project', icon: P.project },
  ] },
  { label: null, items: [
    { id: 'template', label: 'From a template', hint: 'New poses, angles, try-on, UGC ad…', to: '/studio?templates=1', icon: P.template },
  ] },
]
const ALL = NEW_GROUPS.flatMap(g => g.items)

export default function NewMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null)
  const [pos, setPos] = useState(null)
  const [active, setActive] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const on = e => { setAnchor(e.detail); setActive(0); setOpen(true) }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])

  // Place next to the anchor, kept inside the viewport.
  useLayoutEffect(() => {
    if (!open) return
    const el = ref.current
    if (!el || !anchor || window.innerWidth < 720) { setPos(null); return }
    const h = el.offsetHeight, w = el.offsetWidth
    const top = Math.max(12, Math.min(anchor.top, window.innerHeight - h - 12))
    const left = Math.min(anchor.left + 8, window.innerWidth - w - 12)
    setPos({ top, left })
  }, [open, anchor])

  useEffect(() => {
    if (!open) return
    ref.current?.querySelectorAll('[role=menuitem]')[active]?.focus()
  }, [open, active, pos])

  useEffect(() => {
    if (!open) return
    const k = e => {
      if (e.key === 'Escape') setOpen(false)
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % ALL.length) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + ALL.length) % ALL.length) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  if (!open) return null
  const go = it => { setOpen(false); navigate(it.to, it.state ? { state: it.state } : undefined) }
  let i = -1

  return (
    <div className={`muse-newmenu-layer${pos ? ' anchored' : ''}`} onMouseDown={e => { if (!ref.current?.contains(e.target)) setOpen(false) }}>
      <div ref={ref} className="muse-newmenu" role="menu" aria-label="New" style={pos ? { top: pos.top, left: pos.left } : undefined}>
        {NEW_GROUPS.map((g, gi) => (
          <div key={gi} className="muse-newmenu-group">
            {g.label ? <span className="muse-newmenu-label">{g.label}</span> : <hr />}
            {g.items.map(it => {
              i += 1
              const idx = i
              return (
                <button key={it.id} type="button" role="menuitem" tabIndex={idx === active ? 0 : -1} className="muse-newmenu-item" onMouseEnter={() => setActive(idx)} onClick={() => go(it)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={it.icon} /></svg>
                  <span><strong>{it.label}</strong><small>{it.hint}</small></span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
