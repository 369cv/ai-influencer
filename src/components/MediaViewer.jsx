import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'
import { downloadImage } from '../utils/imageUtils'
import { isPublishingConnected } from '../utils/connections'
import { MODEL_LABELS } from '../utils/creditEstimate'
import { getHFToken } from '../utils/higgsfieldAuth'
import { hfToolNames, editCost, editImage, EDIT_TOOLS } from '../utils/higgsfieldGenerate'
import { useInfluencers } from '../store'

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
  edit: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4',
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

// Edit: Higgsfield's Upscale, Expand and Remove background on this photo. The cost is
// Higgsfield's own quote where it offers one; the result is saved to Media.
const EDITS = [
  { op: 'upscale', label: 'Upscale', hint: 'Sharper, up to 4K' },
  { op: 'expand', label: 'Expand', hint: 'Extend the frame to a new shape' },
  { op: 'removebg', label: 'Remove background', hint: 'Subject only, transparent' },
]
const EXPAND_RATIOS = ['9:16', '4:5', '1:1', '16:9']
function EditSheet({ item }) {
  const [, setInfluencers] = useInfluencers()
  const [tools, setTools] = useState(null)
  const [op, setOp] = useState('upscale')
  const [opts, setOpts] = useState({ resolution: '4k', aspectRatio: '4:5' })
  const [cost, setCost] = useState({ state: 'idle' })
  const [run, setRun] = useState({ state: 'idle' })
  const signedIn = !!getHFToken()
  useEffect(() => { if (signedIn) hfToolNames().then(setTools).catch(() => setTools(new Set())) }, [signedIn])
  const available = EDITS.filter(e => tools?.has(EDIT_TOOLS[e.op]))
  async function quote() {
    setCost({ state: 'busy' })
    try { const n = await editCost(op, item.url, opts); setCost({ state: 'done', n }) } catch (e) { setCost({ state: 'error', error: e.message }) }
  }
  async function go() {
    setRun({ state: 'busy' })
    try {
      const url = await editImage(op, item.url, opts)
      const label = op === 'upscale' ? `Upscaled ${opts.resolution.toUpperCase()}` : op === 'expand' ? `Expanded ${opts.aspectRatio}` : 'Background removed'
      if (item.influencerId) setInfluencers(prev => prev.map(i => i.id === item.influencerId ? { ...i, generationHistory: [{ id: `edit_${Date.now()}`, type: 'image', url, label, date: Date.now(), settings: { source: 'edit', edit: op, from: item.url, aspectRatio: op === 'expand' ? opts.aspectRatio : item.aspectRatio } }, ...(i.generationHistory || [])] } : i))
      setRun({ state: 'done', url, label })
    } catch (e) { setRun({ state: 'error', error: e.message }) }
  }
  const pick = (o, patch = {}) => { setOp(o); setOpts(x => ({ ...x, ...patch })); setCost({ state: 'idle' }); setRun({ state: 'idle' }) }
  if (!signedIn) return <div className="muse-viewer-post" role="dialog" aria-label="Edit"><h3>Edit</h3><p>Sign in to Higgsfield to upscale, expand or remove the background.</p><div className="muse-plan-actions"><Link className="muse-btn muse-btn-filled" to="/settings?section=connections">Connect Higgsfield</Link></div></div>
  return (
    <div className="muse-viewer-post" role="dialog" aria-label="Edit">
      <h3>Edit</h3>
      {tools == null ? <p>Checking what your Higgsfield account can do…</p> : !available.length ? <p>Your Higgsfield account doesn’t offer these edits right now.</p> : (
        <>
          <div className="muse-chip-row" role="radiogroup" aria-label="Edit">
            {available.map(e => <button key={e.op} type="button" role="radio" aria-checked={op === e.op} className={`muse-chip${op === e.op ? ' on' : ''}`} onClick={() => pick(e.op)} title={e.hint}>{e.label}</button>)}
          </div>
          {op === 'upscale' && <div className="muse-chip-row" role="radiogroup" aria-label="Resolution">{['2k', '4k'].map(r => <button key={r} type="button" role="radio" aria-checked={opts.resolution === r} className={`muse-chip${opts.resolution === r ? ' on' : ''}`} onClick={() => pick('upscale', { resolution: r })}>{r.toUpperCase()}</button>)}</div>}
          {op === 'expand' && <div className="muse-chip-row" role="radiogroup" aria-label="New shape">{EXPAND_RATIOS.map(r => <button key={r} type="button" role="radio" aria-checked={opts.aspectRatio === r} className={`muse-chip${opts.aspectRatio === r ? ' on' : ''}`} onClick={() => pick('expand', { aspectRatio: r })}>{r}</button>)}</div>}
          <p className="muse-muted" style={{ fontSize: 13 }}>
            {op === 'removebg' ? 'Higgsfield doesn’t quote this one in advance; it uses your Higgsfield credits.'
              : cost.state === 'busy' ? 'Asking Higgsfield for the cost…'
              : cost.state === 'done' ? (cost.n != null ? `Costs ${cost.n} credits.` : 'Higgsfield didn’t return a price.')
              : cost.state === 'error' ? <span className="muse-error">{cost.error}</span>
              : <button type="button" className="muse-btn muse-btn-text" style={{ padding: 0 }} onClick={quote}>Check the cost</button>}
          </p>
          {run.state === 'error' && <p className="muse-error">{run.error}</p>}
          {run.state === 'done' ? (
            <div className="muse-edit-result">
              <img src={run.url} alt={run.label} />
              <span>{run.label}. Saved to Media.</span>
              <a className="muse-btn muse-btn-text" href={run.url} target="_blank" rel="noopener noreferrer">Open</a>
            </div>
          ) : (
            <div className="muse-plan-actions">
              <button type="button" className="muse-btn muse-btn-filled" disabled={run.state === 'busy'} onClick={go}>
                {run.state === 'busy' ? 'Working…' : `${EDITS.find(e => e.op === op).label}${cost.state === 'done' && cost.n != null ? ` · ${cost.n} credits` : ''}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Details: the prompt and settings that made this item (Studio saves them as
// settings.recipe), and Recreate to reopen Studio with exactly those settings.
function DetailsSheet({ item, date, onRecreate }) {
  const [copied, setCopied] = useState(false)
  const r = item.settings?.recipe || null
  const rows = [
    r?.motion && ['Motion prompt', r.motion],
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
    isPhoto && { key: 'edit', label: 'Edit', icon: P.edit, run: () => setSheet(x => x === 'edit' ? null : 'edit') },
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
      {sheet === 'edit' && isPhoto && <EditSheet key={item.url} item={item} />}
      {sheet === 'details' && <DetailsSheet item={item} date={date} onRecreate={onRecreate} />}

      <nav className="muse-viewer-actions" aria-label="Actions">
        {actions.map(a => (
          <button key={a.key} type="button" className={`muse-viewer-action${a.key === sheet ? ' on' : ''}`} aria-pressed={a.key === 'post' || a.key === 'details' || a.key === 'edit' ? a.key === sheet : undefined} onClick={a.run}>
            <span className="muse-viewer-action-icon"><Icon d={a.icon} /></span>
            <span>{a.label}</span>
          </button>
        ))}
      </nav>
    </div>,
    document.body
  )
}
