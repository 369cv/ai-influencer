import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useInspirationBoards, generateId } from '../store'
import { compressImage } from '../utils/imageUtils'

// /import — entry point for the Chrome extension (AGENTS.md §6).
//   /import?type=face|style|inspiration&url=<image url>&source=<page url>
// The image is fetched through /api/img-proxy (mode=import), compressed to a
// data URL, shown for confirmation, then handed to /create or saved to a board.

const TYPES = {
  face:        { title: 'Use as a face reference',  cta: 'Start an influencer with this face' },
  style:       { title: 'Use as a style reference', cta: 'Start an influencer with this style' },
  inspiration: { title: 'Save to Inspiration',      cta: 'Save to board' },
}
const EXT_BOARD = 'From the web'

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export default function Import() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [boards, setBoards] = useInspirationBoards()
  const q = new URLSearchParams(search)
  const type = q.get('type')
  const url = q.get('url') || ''
  const source = q.get('source') || ''
  const cfg = TYPES[type]

  const [img, setImg] = useState(null)
  const [error, setError] = useState(null)
  const [boardId, setBoardId] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!cfg || !url) return
    let alive = true
    setImg(null); setError(null)
    ;(async () => {
      try {
        if (!/^https:\/\//i.test(url)) throw new Error('Only https image links can be imported.')
        if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You’re offline. Connect to the internet and try again.')
        const res = await fetch(`/api/img-proxy?mode=import&url=${encodeURIComponent(url)}`)
        if (!res.ok) throw new Error(res.status === 403 ? 'This link can’t be imported.' : res.status === 413 ? 'That image is too large (15 MB max).' : `Couldn’t fetch the image (${res.status}).`)
        const blob = await res.blob()
        if (!blob.type.startsWith('image/')) throw new Error('That link isn’t an image.')
        const data = await compressImage(await blobToDataUrl(blob))
        if (alive) setImg(data)
      } catch (e) { if (alive) setError(e.message || 'Import failed.') }
    })()
    return () => { alive = false }
  }, [type, url]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (boardId || !boards) return
    setBoardId(boards.find(b => b.name === EXT_BOARD)?.id || boards[0]?.id || 'new')
  }, [boards, boardId])

  function confirm() {
    if (!img) return
    if (type === 'face' || type === 'style') {
      navigate('/create', { state: type === 'face' ? { prefillFaceRef: img } : { prefillStyleRef: img } })
      return
    }
    setBoards(prev => {
      const list = prev || []
      if (boardId === 'new' || !list.some(b => b.id === boardId)) {
        return [...list, { id: generateId(), name: EXT_BOARD, images: [img], createdAt: Date.now() }]
      }
      return list.map(b => b.id === boardId ? { ...b, images: [...(b.images || []), img] } : b)
    })
    setSaved(true)
  }

  let host = ''
  try { host = source ? new URL(source).hostname : new URL(url).hostname } catch {}

  if (!cfg || !url) {
    return (
      <div className="muse-page muse-import">
        <div className="muse-empty">
          <div className="muse-glow" aria-hidden />
          <h2>Nothing to import</h2>
          <p>This page is opened by the Muse Studio browser extension with an image link, for example <code>/import?type=face&amp;url=…</code>.</p>
          <Link to="/" className="muse-btn muse-btn-filled">Go home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="muse-page muse-import">
      <header className="muse-page-head">
        <div>
          <h1>{cfg.title}</h1>
          {host && <p>From {host}</p>}
        </div>
      </header>

      <div className="muse-import-card">
        <div className="muse-import-preview">
          {img ? <img src={img} alt="Imported image" />
            : error ? <span className="muse-import-msg">{error}</span>
            : <span className="muse-import-msg"><span className="muse-spinner" aria-hidden /> Fetching image…</span>}
        </div>

        {type === 'inspiration' && img && !saved && (
          <div className="muse-import-boards">
            <span className="muse-plan-label">Board</span>
            <div className="muse-filter-row">
              {(boards || []).map(b => (
                <button key={b.id} type="button" className={`muse-filter${boardId === b.id ? ' on' : ''}`} aria-pressed={boardId === b.id} onClick={() => setBoardId(b.id)}>{b.name}</button>
              ))}
              {!(boards || []).some(b => b.name === EXT_BOARD) && (
                <button type="button" className={`muse-filter${boardId === 'new' ? ' on' : ''}`} aria-pressed={boardId === 'new'} onClick={() => setBoardId('new')}>+ {EXT_BOARD}</button>
              )}
            </div>
          </div>
        )}

        {saved ? (
          <div className="muse-plan-actions">
            <Link to="/" className="muse-btn muse-btn-tonal">Done</Link>
            <Link to="/plan?view=inspiration" className="muse-btn muse-btn-filled">Open Inspiration</Link>
          </div>
        ) : (
          <div className="muse-plan-actions">
            <button type="button" className="muse-btn muse-btn-tonal" onClick={() => navigate('/')}>Cancel</button>
            <button type="button" className="muse-btn muse-btn-filled" onClick={confirm} disabled={!img}>{cfg.cta}</button>
          </div>
        )}
        {saved && <p className="muse-plan-note">Saved. You can close this tab.</p>}
      </div>
    </div>
  )
}
