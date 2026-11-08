import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getHFToken } from '../utils/higgsfieldAuth'
import { createFaceElement, getElement } from '../utils/higgsfieldGenerate'
import { useInfluencers } from '../store'
import { collectLibrary } from '../utils/library'
import { compressImage } from '../utils/imageUtils'
import { newId } from '../utils/localJson'

// Influencer → identity: her looks, face sheet and voice in one place, plus
// "Create with her". Looks are saved on the influencer as `looks: [{ id, url, name }]`
// and are offered as the start photo / reference wherever she is used.
const card = { background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }
const label = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }

export function addLooks(setInfluencers, influencerId, urls) {
  setInfluencers(prev => prev.map(i => {
    if (i.id !== influencerId) return i
    const have = new Set((i.looks || []).map(l => l.url))
    const added = urls.filter(u => u && !have.has(u)).map((url, n) => ({ id: newId('look'), url, name: `Look ${(i.looks || []).length + n + 1}`, createdAt: Date.now() }))
    return { ...i, looks: [...(i.looks || []), ...added] }
  }))
}

function AddLooks({ influencer, onClose }) {
  const navigate = useNavigate()
  const [influencers, setInfluencers] = useInfluencers()
  const [mode, setMode] = useState('')
  const [picked, setPicked] = useState([])
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const name = influencer.name || 'her'
  const photos = useMemo(() => collectLibrary(influencers || []).filter(it => it.kind === 'photo' && it.influencerId === influencer.id).slice(0, 48), [influencers, influencer.id])
  const have = new Set((influencer.looks || []).map(l => l.url))

  function upload(e) {
    const files = [...(e.target.files || [])].filter(f => f.type.startsWith('image/')).slice(0, 8)
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    Promise.all(files.map(f => new Promise(res => { const r = new FileReader(); r.onload = () => compressImage(r.result).then(res); r.readAsDataURL(f) })))
      .then(urls => { addLooks(setInfluencers, influencer.id, urls); onClose() })
      .finally(() => setBusy(false))
  }
  const describe = e => {
    e.preventDefault()
    if (!desc.trim()) return
    navigate('/', { state: { createFor: influencer.id, createText: `New look for ${name}: ${desc.trim()}` } })
  }

  return (
    <div className="muse-sheet-backdrop" onClick={onClose}>
      <div className="muse-deal-sheet muse-looks-sheet" role="dialog" aria-modal="true" aria-label={`Add looks for ${name}`} onClick={e => e.stopPropagation()}>
        <div className="muse-cs-head"><h3>Add looks for {name}</h3><button type="button" className="muse-btn muse-btn-text" onClick={onClose} aria-label="Close">✕</button></div>
        <p className="muse-muted" style={{ margin: 0 }}>New outfits, settings and poses. The face stays the same.</p>
        {!mode && (
          <div className="muse-looks-sources">
            <button type="button" className="muse-looks-src" onClick={() => setMode('describe')}><b>Describe it</b><small>Write the look; it becomes a photoshoot plan</small></button>
            <button type="button" className="muse-looks-src" onClick={() => setMode('media')}><b>From Media</b><small>{photos.length ? `Pick from ${photos.length} photo${photos.length > 1 ? 's' : ''} of ${name}` : `No photos of ${name} yet`}</small></button>
            <button type="button" className="muse-looks-src" onClick={() => fileRef.current?.click()} disabled={busy}><b>{busy ? 'Adding…' : 'Upload'}</b><small>Photos from your device</small></button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={upload} />
          </div>
        )}
        {mode === 'describe' && (
          <form className="muse-cp-ask" onSubmit={describe}>
            <input className="muse-input" autoFocus value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. black slip dress, rooftop at night, city lights" aria-label="Describe the look" />
            <button type="submit" className="muse-btn muse-btn-filled" disabled={!desc.trim()}>Plan it</button>
          </form>
        )}
        {mode === 'media' && (photos.length ? (
          <>
            <div className="muse-picker-grid">
              {photos.map(it => {
                const on = picked.includes(it.url) || have.has(it.url)
                return <button key={it.id} type="button" className={`muse-thumb${on ? ' on' : ''}`} disabled={have.has(it.url)} aria-pressed={on} title={have.has(it.url) ? 'Already a look' : it.label} style={{ backgroundImage: `url(${it.url})` }} onClick={() => setPicked(p => (p.includes(it.url) ? p.filter(u => u !== it.url) : [...p, it.url]))} />
              })}
            </div>
            <div className="muse-deal-foot"><span className="muse-flow-bar-note">{picked.length} selected</span><button type="button" className="muse-btn muse-btn-filled" disabled={!picked.length} onClick={() => { addLooks(setInfluencers, influencer.id, picked); onClose() }}>Add {picked.length || ''} look{picked.length === 1 ? '' : 's'}</button></div>
          </>
        ) : <p className="muse-muted">Make a photoshoot first; its photos show up here.</p>)}
        {mode && <button type="button" className="muse-btn muse-btn-text" style={{ alignSelf: 'flex-start' }} onClick={() => { setMode(''); setPicked([]) }}>← Other ways</button>}
      </div>
    </div>
  )
}

export default function InfluencerLooks({ influencer, onUpdate }) {
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState('')
  const looks = influencer.looks || []
  const main = influencer.mainImage || influencer.image
  const vp = influencer.voiceProfile
  const name = influencer.name || 'this influencer'
  const remove = id => onUpdate({ looks: looks.filter(l => l.id !== id) })
  const rename = (id, v) => onUpdate({ looks: looks.map(l => (l.id === id ? { ...l, name: v } : l)) })

  return (
    <section style={card} aria-labelledby={`looks-${influencer.id}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span id={`looks-${influencer.id}`} style={label}>Looks</span>
        <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setAdding(true)}>Add looks</button>
          <button type="button" className="muse-btn muse-btn-filled" onClick={() => navigate('/', { state: { createFor: influencer.id } })}>Create with {influencer.name || 'her'}</button>
        </span>
      </div>
      <div className="muse-looks-grid">
        {main && <figure className="muse-lk"><span className="muse-lk-img" style={{ backgroundImage: `url(${main})` }} /><figcaption>Main</figcaption></figure>}
        {looks.map(l => (
          <figure key={l.id} className="muse-lk">
            <span className="muse-lk-img" style={{ backgroundImage: `url(${l.url})` }} />
            {renaming === l.id
              ? <input className="muse-input" autoFocus defaultValue={l.name} onBlur={e => { rename(l.id, e.target.value.trim() || l.name); setRenaming('') }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming('') }} aria-label="Look name" />
              : <figcaption><button type="button" className="muse-lk-name" onClick={() => setRenaming(l.id)} title="Rename">{l.name}</button><button type="button" className="muse-lk-x" onClick={() => remove(l.id)} aria-label={`Remove ${l.name}`}>✕</button></figcaption>}
          </figure>
        ))}
        <button type="button" className="muse-lk muse-lk-add" onClick={() => setAdding(true)}>＋<span>Add a look</span></button>
      </div>
      {(() => {
        // The old Home tab's rooms become looks (settings), on request.
        const have = new Set(looks.map(l => l.url))
        const rooms = (influencer.homeSlots || []).filter(h => h.image && !have.has(h.image))
        if (!rooms.length) return null
        return (
          <div className="muse-notice" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span>{rooms.length} home room{rooms.length > 1 ? 's' : ''} from the old Home tab ({rooms.map(r => r.name).filter(Boolean).slice(0, 3).join(', ')}).</span>
            <button type="button" className="muse-btn muse-btn-tonal" onClick={() => onUpdate({ looks: [...looks, ...rooms.map(r => ({ id: newId('look'), url: r.image, name: r.name || 'Home', createdAt: Date.now(), from: 'home' }))] })}>Bring them into Looks</button>
          </div>
        )
      })()}
      <div className="muse-looks-id">
        <div className="muse-looks-idcard">
          <span style={label}>Face sheet</span>
          {influencer.characterSheetImage
            ? <span className="muse-looks-sheet-img" style={{ backgroundImage: `url(${influencer.characterSheetImage})` }} role="img" aria-label={`${name} face sheet`} />
            : <span className="muse-muted" style={{ fontSize: 13 }}>Not made yet. Make it in the Character sheet section of this page.</span>}
          <small className="muse-muted">Every look and video holds this face.</small>
        </div>
        <ConsistentFace influencer={influencer} main={main} onUpdate={onUpdate} />
        <div className="muse-looks-idcard">
          <span style={label}>Voice</span>
          <b style={{ fontSize: 14 }}>{vp?.voiceId ? (vp.voiceName || 'ElevenLabs voice') : 'No voice yet'}</b>
          <small className="muse-muted">{vp?.voiceId ? 'Used for her talking videos.' : 'Pick one in Voice below.'}</small>
        </div>
      </div>
      {adding && <AddLooks influencer={influencer} onClose={() => setAdding(false)} />}
    </section>
  )
}

// Consistent face: a Higgsfield Element made from her main photo. Once Higgsfield
// finishes it, every photo made in Create, Studio and recipes sends it automatically.
const READY = 'completed'
const FAILED = new Set(['failed', 'kling_failed', 'nsfw'])
function ConsistentFace({ influencer, main, onUpdate }) {
  const el = influencer.hfElement || null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const signedIn = !!getHFToken()
  const stale = el && main && el.from !== main
  // While Higgsfield is still processing, check again every 10 seconds.
  useEffect(() => {
    if (!el?.id || el.status === READY || FAILED.has(el.status) || !signedIn) return
    const t = setInterval(async () => {
      try { const x = await getElement(el.id); if (x.status !== el.status) onUpdate({ hfElement: { ...el, status: x.status } }) } catch {}
    }, 10000)
    return () => clearInterval(t)
  }, [el?.id, el?.status, signedIn]) // eslint-disable-line react-hooks/exhaustive-deps
  async function make() {
    setBusy(true); setError('')
    try { const x = await createFaceElement(main, influencer.name); onUpdate({ hfElement: { id: x.id, status: x.status, name: x.name, from: main, createdAt: Date.now() } }) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const state = !el ? 'none' : el.status === READY ? 'ready' : FAILED.has(el.status) ? 'failed' : 'working'
  return (
    <div className="muse-looks-idcard">
      <span style={label}>Consistent face</span>
      <b style={{ fontSize: 14 }}>{state === 'ready' ? 'On' : state === 'working' ? 'Higgsfield is preparing it…' : state === 'failed' ? `Higgsfield couldn’t use this photo (${el.status})` : 'Off'}</b>
      <small className="muse-muted">
        {state === 'ready' ? `A Higgsfield Element${el.name ? ` (${el.name})` : ''} from her main photo, sent with every photo.${stale ? ' Her main photo has changed since.' : ''}`
          : 'Save her face as a Higgsfield Element so every photo keeps it.'}
      </small>
      {error && <small className="muse-error">{error}</small>}
      {!signedIn ? <Link to="/settings?section=connections" className="muse-text-btn">Connect Higgsfield</Link>
        : !main ? <small className="muse-muted">Add a main photo first.</small>
        : (state === 'none' || state === 'failed' || stale) && <button type="button" className="muse-btn muse-btn-tonal" disabled={busy} onClick={make}>{busy ? 'Saving…' : state === 'none' ? 'Turn on' : 'Make it again'}</button>}
    </div>
  )
}
