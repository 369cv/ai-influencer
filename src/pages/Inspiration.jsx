import { useState, useRef, useMemo } from 'react'
import { useInspirationBoards, generateId } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { newId } from '../utils/localJson'
import { compressImage } from '../utils/imageUtils'
import Lightbox from '../components/Lightbox'

function downloadImage(src, filename) {
  const a = document.createElement('a')
  a.href = src
  a.download = filename
  a.click()
}

function BoardCard({ board, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(board.name)
  const previews = board.images?.slice(0, 4) ?? []

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, transform 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
      onClick={() => onSelect(board.id)}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', aspectRatio: '4/3', background: 'var(--bg-tertiary)' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
            {previews[i]
              ? <img src={previews[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)' }} />
            }
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={() => { if (name.trim()) onRename(board.id, name.trim()); else setName(board.name); setEditing(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { if (name.trim()) onRename(board.id, name.trim()); else setName(board.name); setEditing(false) } if (e.key === 'Escape') { setName(board.name); setEditing(false) } }}
            style={{
              fontSize: 14, fontWeight: 600, border: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              outline: 'none', width: '100%',
            }}
          />
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{board.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{board.images?.length ?? 0} images</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(true)} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>Rename</button>
          <button onClick={() => { if (!board.images?.length || window.confirm(`Delete "${board.name}" and its ${board.images.length} image${board.images.length !== 1 ? 's' : ''}?`)) onDelete(board.id) }} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#FF3B30', background: 'rgba(255,59,48,0.1)' }}>×</button>
        </div>
      </div>
    </div>
  )
}

// Two tag axes (niche × shoot type) and one status per image, kept in
// board.meta — an array parallel to board.images so existing image strings
// stay untouched. "To create" sends the image to Plan as an idea.
export const NICHES = ['Lifestyle', 'Fashion', 'Beauty', 'Fitness', 'Portrait', 'Podcast']
export const SHOOTS = ['Editorial', 'UGC', 'Streetstyle', 'Headshot', 'Studio', 'Motion']

function ChipRow({ label, options, value, onChange, counts }) {
  return (
    <div className="muse-chip-row" role="group" aria-label={label} style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 2 }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', minWidth: 44 }}>{label}</span>
      <button type="button" className={`muse-pchip${value == null ? ' on' : ''}`} aria-pressed={value == null} onClick={() => onChange(null)}>All</button>
      {options.map(o => (
        <button key={o} type="button" className={`muse-pchip${value === o ? ' on' : ''}`} aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)}>
          {o}{counts[o] ? <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{counts[o]}</span> : null}
        </button>
      ))}
    </div>
  )
}

const tagSelect = { height: 26, borderRadius: 'var(--radius-pill)', border: 'none', background: 'rgba(255,255,255,0.92)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 600, padding: '0 8px', maxWidth: '50%' }
const overlayBtn = { height: 26, padding: '0 10px', borderRadius: 'var(--radius-pill)', fontSize: 11.5, fontWeight: 600 }

function BoardDetail({ board, onBack, onUpdate }) {
  const fileRef = useRef()
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [, setIdeas] = useWorkspaceStore('muse_ideas')
  const [niche, setNiche] = useState(null)
  const [shoot, setShoot] = useState(null)
  const [showSkipped, setShowSkipped] = useState(false)
  const [surprise, setSurprise] = useState(null)

  const boardImagesRef = useRef(board.images)
  boardImagesRef.current = board.images
  const boardMetaRef = useRef(board.meta)
  boardMetaRef.current = board.meta

  const images = board.images || []
  const meta = images.map((_, i) => (board.meta || [])[i] || {})
  const counts = useMemo(() => {
    const c = {}
    meta.forEach(m => { if (m.status !== 'skipped') { if (m.niche) c[m.niche] = (c[m.niche] || 0) + 1; if (m.shoot) c[m.shoot] = (c[m.shoot] || 0) + 1 } })
    return c
  }, [board.meta, images.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const matches = images.map((_, i) => i).filter(i => {
    const m = meta[i]
    if (!showSkipped && m.status === 'skipped') return false
    if (niche && m.niche !== niche) return false
    if (shoot && m.shoot !== shoot) return false
    return true
  })
  const visible = surprise ? surprise.filter(i => i < images.length) : matches
  const filtered = niche || shoot || surprise

  function setMeta(idx, patch) {
    const next = images.map((_, i) => ({ ...((boardMetaRef.current || [])[i] || {}) }))
    next[idx] = { ...next[idx], ...patch }
    onUpdate(board.id, { meta: next })
  }

  function toCreate(idx) {
    const m = meta[idx]
    if (m.ideaId) return
    const id = newId('idea')
    const tags = [m.niche, m.shoot].filter(Boolean).join(' · ')
    setIdeas(l => [{ id, title: `${board.name}${tags ? ` — ${tags}` : ''}`.slice(0, 300), notes: 'From Inspiration', images: [images[idx]], source: { type: 'inspiration', boardId: board.id }, status: 'inbox', createdAt: Date.now() }, ...l])
    setMeta(idx, { status: 'todo', ideaId: id })
  }

  function surpriseMe() {
    if (surprise) { setSurprise(null); return }
    const pool = [...matches]
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
    setSurprise(pool.slice(0, 6))
  }

  function addImages(files) {
    const readers = Array.from(files).map(file => new Promise(resolve => {
      const r = new FileReader()
      r.onload = e => compressImage(e.target.result).then(resolve)
      r.readAsDataURL(file)
    }))
    Promise.all(readers).then(results => {
      const prev = boardImagesRef.current ?? []
      const prevMeta = prev.map((_, i) => (boardMetaRef.current || [])[i] || {})
      onUpdate(board.id, { images: [...prev, ...results], meta: [...prevMeta, ...results.map(() => ({}))] })
    }).catch(console.error)
  }

  function removeImage(idx) {
    const next = board.images.filter((_, i) => i !== idx)
    const nextMeta = board.images.map((_, i) => (board.meta || [])[i] || {}).filter((_, i) => i !== idx)
    onUpdate(board.id, { images: next, meta: nextMeta })
  }

  function downloadAll() {
    board.images.forEach((img, i) => {
      setTimeout(() => downloadImage(img, `${board.name}-${i + 1}.jpg`), i * 120)
    })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 28px' }}>
      {lightboxIdx !== null && (
        <Lightbox
          images={board.images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--surface)' }}
        >← Back</button>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', flex: 1 }}>{board.name}</h1>
        {board.images?.length > 0 && (
          <button
            onClick={downloadAll}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 6 }}
          >↓ Download All</button>
        )}
      </div>

      <div style={{
        border: '2px dashed var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        textAlign: 'center',
        marginBottom: 24,
        cursor: 'pointer',
        background: 'var(--surface)',
      }} onClick={() => fileRef.current.click()}>
        <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>+</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Add images from Pinterest, Instagram, etc.</div>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
          onChange={e => addImages(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <ChipRow label="Niche" options={NICHES} value={niche} onChange={v => { setNiche(v); setSurprise(null) }} counts={counts} />
          <ChipRow label="Shoot" options={SHOOTS} value={shoot} onChange={v => { setShoot(v); setSurprise(null) }} counts={counts} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span aria-live="polite">{visible.length} {visible.length === 1 ? 'result' : 'results'}</span>
            {filtered && <button type="button" className="muse-btn muse-btn-text" style={{ minHeight: 32 }} onClick={() => { setNiche(null); setShoot(null); setSurprise(null) }}>Clear all</button>}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showSkipped} onChange={e => setShowSkipped(e.target.checked)} /> Show skipped
            </label>
            <span style={{ flex: 1 }} />
            <button type="button" className={`muse-pchip${surprise ? ' on' : ''}`} aria-pressed={!!surprise} onClick={surpriseMe} disabled={!surprise && matches.length === 0}>{surprise ? 'Show all' : '✦ Surprise me'}</button>
          </div>
        </div>
      )}

      {images.length > 0 && visible.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>No images match these filters.</p>
      )}

      {visible.length > 0 && (
        <div style={{ columns: '3 200px', gap: 12 }}>
          {visible.map(i => {
            const img = images[i]
            const m = meta[i]
            return (
            <div
              key={i}
              style={{ breakInside: 'avoid', marginBottom: 12, borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative', cursor: 'zoom-in', opacity: m.status === 'skipped' ? 0.5 : 1 }}
              onClick={() => setLightboxIdx(i)}
            >
              <img src={img} alt="" style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              {m.status === 'todo' && (
                <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 11.5, fontWeight: 600 }}>In Plan</span>
              )}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                display: 'flex', gap: 6,
              }}>
                <button
                  onClick={e => { e.stopPropagation(); downloadImage(img, `${board.name}-${i + 1}.jpg`) }}
                  title="Download"
                  aria-label="Download"
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >↓</button>
                <button
                  onClick={e => { e.stopPropagation(); removeImage(i) }}
                  title="Remove"
                  aria-label="Remove"
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: 8, right: 8, bottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6, cursor: 'default' }}>
                <select aria-label="Niche" value={m.niche || ''} onChange={e => setMeta(i, { niche: e.target.value || undefined })} style={tagSelect}>
                  <option value="">Niche</option>{NICHES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select aria-label="Shoot type" value={m.shoot || ''} onChange={e => setMeta(i, { shoot: e.target.value || undefined })} style={tagSelect}>
                  <option value="">Shoot</option>{SHOOTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {m.status !== 'todo' && (
                  <button type="button" onClick={() => toCreate(i)} style={{ ...overlayBtn, background: 'var(--accent)', color: 'var(--on-accent)' }}>To create</button>
                )}
                {m.status !== 'todo' && (
                  <button type="button" onClick={() => setMeta(i, { status: m.status === 'skipped' ? undefined : 'skipped' })} style={{ ...overlayBtn, background: 'rgba(255,255,255,0.92)', color: 'var(--text-primary)' }}>{m.status === 'skipped' ? 'Unskip' : 'Skip'}</button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Inspiration({ embedded = false }) {
  const [boards, setBoards] = useInspirationBoards()
  const [selectedId, setSelectedId] = useState(null)

  function createBoard() {
    const board = { id: generateId(), name: 'New Board', images: [], createdAt: Date.now() }
    setBoards(prev => [...prev, board])
  }

  function renameBoard(id, name) {
    setBoards(prev => prev.map(b => b.id === id ? { ...b, name } : b))
  }

  function deleteBoard(id) {
    setBoards(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function updateBoard(id, updates) {
    setBoards(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const selected = boards.find(b => b.id === selectedId)

  return (
    <div style={embedded ? undefined : { paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      {selected ? (
        <BoardDetail board={selected} onBack={() => setSelectedId(null)} onUpdate={updateBoard} />
      ) : (
        <div style={embedded ? undefined : { maxWidth: 960, margin: '0 auto', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: embedded ? 'flex-end' : 'space-between', marginBottom: embedded ? 16 : 28 }}>
            {!embedded && <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.6px' }}>Inspiration</h1>}
            <button type="button" className="muse-btn muse-btn-tonal" onClick={createBoard}>New board</button>
          </div>

          {boards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
              <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No boards yet</p>
              <p style={{ fontSize: 13 }}>Create a board to start saving mood board inspiration</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {boards.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onSelect={setSelectedId}
                  onRename={renameBoard}
                  onDelete={deleteBoard}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
