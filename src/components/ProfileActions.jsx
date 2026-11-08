import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Influencer profile header actions: Create ▾ (Photoshoot in Create, Studio, or the
// composer, with this influencer preselected) and ⋯ (the advanced photo and video
// studios, Export persona, Delete). Every item goes to a page
// that exists; nothing here is a placeholder.
const I = {
  photo: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5l5-3v9l-5-3" /></>,
  post: <path d="M4 20l16-8L4 4v6l10 2-10 2z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  down: <path d="M6 9l6 6 6-6" />,
  more: <><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>,
  export: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  spark: <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z" />,
  sliders: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />,
}
const Icon = ({ k, s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{I[k]}</svg>

function useDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, setOpen, ref])
}

function Menu({ label, trigger, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useDismiss(open, setOpen, ref)
  return (
    <div className="muse-pa" ref={ref}>
      {trigger({ open, toggle: () => setOpen(o => !o) })}
      {open && (
        <div className="muse-pa-menu" role="menu" aria-label={label}>
          {items.map(it => (
            <button key={it.label} type="button" role="menuitem" className={it.danger ? 'danger' : ''} onClick={() => { setOpen(false); it.onClick() }}>
              <Icon k={it.icon} />{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfileActions({ influencer, onExport, onDelete, onAdvanced }) {
  const navigate = useNavigate()
  const state = { influencerId: influencer.id }
  return (
    <div className="muse-pa-row">
      <Menu label="Create" items={[
        { label: 'Photoshoot', icon: 'spark', onClick: () => navigate('/', { state: { createFor: influencer.id } }) },
        { label: 'Photo in Studio', icon: 'photo', onClick: () => navigate('/studio', { state }) },
        { label: 'Video in Studio', icon: 'video', onClick: () => navigate('/studio?mode=video', { state: { ...state, mode: 'video' } }) },
        { label: 'Post', icon: 'post', onClick: () => navigate('/content?compose=1', { state }) },
      ]} trigger={({ open, toggle }) => (
        <button type="button" className="muse-btn muse-btn-filled" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
          <Icon k="plus" /> Create <Icon k="down" s={14} />
        </button>
      )} />
      <Menu label="More actions" items={[
        ...(onAdvanced ? [
          { label: 'Advanced photo studio', icon: 'sliders', onClick: () => onAdvanced('photo') },
          { label: 'Advanced video studio', icon: 'video', onClick: () => onAdvanced('content') },
        ] : []),
        { label: 'Export persona', icon: 'export', onClick: onExport },
        { label: 'Delete influencer', icon: 'trash', danger: true, onClick: onDelete },
      ]} trigger={({ open, toggle }) => (
        <button type="button" className="muse-btn muse-btn-tonal muse-pa-more" aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
          <Icon k="more" s={18} />
        </button>
      )} />
    </div>
  )
}
