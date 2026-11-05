import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { downloadImage } from '../utils/imageUtils'
import { isPublishingConnected } from '../utils/connections'
import { MODEL_LABELS } from '../utils/creditEstimate'

// Full-screen viewer for Library items: swipe or arrow keys to move,
// Esc to close, and per-item actions along the bottom.

const P = {
  close: 'M6 6l12 12M18 6L6 18',
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 6l6 6-6 6',
  modify: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  video: 'M4 6h11v12H4zM15 10l5-3v10l-5-3',
  similar: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  post: 'M4 12l16-8-6 16-3-7z',
  details: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
}
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)

function PostSheet({ item, onClose }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share
  const connected = isPublishingConnected()
  async function share() {
    try { await navigator.share({ title: `${item.influencerName} · Muse Studio`, url: item.url }) } catch {}
  }
  async function copy() {
    try { await navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch {}
  }
  function compose() {
    onClose()
    navigate('/content?compose=1', { state: { prefillMedia: item.url, influencerId: item.influencerId } })
  }
  return (
    <div className="muse-viewer-post" role="dialog" aria-label="Post">
      <h3>Post</h3>
      <p>{connected
        ? 'Write the caption, pick the accounts, then post now or schedule it.'
        : 'Add it to your content queue now. To post directly, connect a posting service in Settings → Connections.'}</p>
      <div className="muse-plan-actions">
        <button type="button" className="muse-btn muse-btn-filled" onClick={compose}>{connected ? 'Compose post' : 'Add to queue'}</button>
      </div>
      <div className="muse-plan-actions">
        <button type="button" className="muse-btn muse-btn-tonal" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
        {canShare
          ? <button type="button" className="muse-btn muse-btn-tonal" onClick={share}>Share…</button>
          : <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Done</button>}
      </div>
    </div>
  )
}

// Details: the prompt and settings that made this item (Studio saves them as
// settings.recipe), and Recreate to reopen Studio with exactly those settings.
function DetailsSheet({ item, date, onRecreate }) {
  const [copied, setCopied] = useState(false)
  const r = item.settings?.recipe || null
  const rows = [
    r?.model && ['Model', MODEL_LABELS[r.model] || r.model],
    ['Aspect', r?.ratio || item.aspectRatio],
    r?.resolution && ['Resolution', String(r.resolution).toUpperCase()],
    r?.mode === 'video' && r?.seconds && ['Length', `${r.seconds}s`],
    r?.refs?.length > 0 && ['References', String(r.refs.length)],
    date && ['Created', date],
    r?.credits != null && ['Est. cost', `~${r.credits} credits`],
  ].filter(Boolean)
  async function copy() {
    try { await navigator.clipboard.writeText(r.prompt); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch {}
  }
  return (
    <div className="muse-viewer-post" role="dialog" aria-label="Details">
      <h3>Details</h3>
      {r?.prompt ? (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="muse-plan-label">Prompt</span>
            <button type="button" className="muse-btn muse-btn-text" style={{ minHeight: 32 }} onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p style={{ fontSize: 'var(--font-size-label)', lineHeight: 1.5, maxHeight: 96, overflow: 'auto', overflowWrap: 'anywhere' }}>{r.prompt}</p>
        </div>
      ) : (
        <p>{r ? 'No prompt was used for this one.' : 'Settings weren’t saved for this item. Items made in Studio from now on keep them.'}</p>
      )}
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2) var(--space-4)', marginTop: 'var(--space-3)' }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ minWidth: 0 }}>
            <dt className="muse-plan-label">{k}</dt>
            <dd style={{ fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-medium)', overflowWrap: 'anywhere' }}>{v}</dd>
          </div>
        ))}
      </dl>
      {r && onRecreate && (
        <div className="muse-plan-actions">
          <button type="button" className="muse-btn muse-btn-filled" onClick={() => onRecreate(item)}>Recreate in Studio</button>
        </div>
      )}
    </div>
  )
}

export default function MediaViewer({ items, index, onIndex, onClose, onModify, onMakeVideo, onMoreLikeThis, onRecreate }) {
  const item = items[index]
  const [sheet, setSheet] = useState(null) // 'post' | 'details' | null
  const postOpen = sheet === 'post'
  const setPostOpen = v => setSheet(cur => { const open = typeof v === 'function' ? v(cur === 'post') : v; return open ? 'post' : (cur === 'post' ? null : cur) })
  const touch = useRef(null)
  const has = d => (d < 0 ? index > 0 : index < items.length - 1)
  const go = d => { if (has(d)) { setSheet(null); onIndex(index + d) } }

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { sheet ? setSheet(null) : onClose() }
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
  }) // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null
  const isPhoto = item.kind === 'photo'
  const ext = isPhoto ? 'png' : 'mp4'
  const fname = `${(item.influencerName || 'muse').toLowerCase().replace(/\s+/g, '-')}-${item.id}.${ext}`
  const date = item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const actions = [
    isPhoto && { key: 'modify', label: 'Use as reference', icon: P.modify, run: () => onModify(item) },
    isPhoto && { key: 'video', label: 'Make video', icon: P.video, run: () => onMakeVideo(item) },
    isPhoto && { key: 'similar', label: 'More like this', icon: P.similar, run: () => onMoreLikeThis(item) },
    { key: 'details', label: 'Details', icon: P.details, run: () => setSheet(x => x === 'details' ? null : 'details') },
    { key: 'download', label: 'Download', icon: P.download, run: () => downloadImage(item.url, fname) },
    { key: 'post', label: 'Post', icon: P.post, run: () => setPostOpen(o => !o) },
  ].filter(Boolean)

  return createPortal(
    <div className="muse-viewer" role="dialog" aria-modal="true" aria-label={`${item.influencerName}, ${item.label}`}
      onTouchStart={e => { touch.current = e.touches[0].clientX }}
      onTouchEnd={e => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1) }}
    >
      <header className="muse-viewer-top">
        <button type="button" className="muse-viewer-icon" onClick={onClose} aria-label="Close"><Icon d={P.close} /></button>
        <div className="muse-viewer-title">
          <strong>{item.influencerName}</strong>
          <span>{[item.label, date].filter(Boolean).join(' · ')}</span>
        </div>
        <span className="muse-viewer-count">{index + 1} / {items.length}</span>
      </header>

      <div className="muse-viewer-stage" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        {has(-1) && <button type="button" className="muse-viewer-icon muse-viewer-nav prev" onClick={() => go(-1)} aria-label="Previous"><Icon d={P.prev} /></button>}
        {isPhoto
          ? <img key={item.url} src={item.url} alt={`${item.influencerName}: ${item.label}`} />
          : <video key={item.url} src={item.url} controls playsInline autoPlay loop />}
        {has(1) && <button type="button" className="muse-viewer-icon muse-viewer-nav next" onClick={() => go(1)} aria-label="Next"><Icon d={P.next} /></button>}
      </div>

      {postOpen && <PostSheet item={item} onClose={() => setSheet(null)} />}
      {sheet === 'details' && <DetailsSheet item={item} date={date} onRecreate={onRecreate} />}

      <nav className="muse-viewer-actions" aria-label="Actions">
        {actions.map(a => (
          <button key={a.key} type="button" className={`muse-viewer-action${a.key === sheet ? ' on' : ''}`} aria-pressed={a.key === 'post' || a.key === 'details' ? a.key === sheet : undefined} onClick={a.run}>
            <span className="muse-viewer-action-icon"><Icon d={a.icon} /></span>
            <span>{a.label}</span>
          </button>
        ))}
      </nav>
    </div>,
    document.body
  )
}
