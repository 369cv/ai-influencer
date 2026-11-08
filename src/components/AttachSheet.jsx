import { useMemo, useRef, useState } from 'react'
import { useInfluencers } from '../store'
import { collectLibrary } from '../utils/library'
import { compressImage } from '../utils/imageUtils'

// Create box → Attach: one "Add media" sheet with Upload · Her looks · Media.
// Everything listed is the user's own data; nothing is pre-filled.
// props: influencer, max (how many can be picked), kinds ('photo' | 'any'), onAdd(urls), onClose
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

export default function AttachSheet({ influencer, max = 1, kinds = 'photo', title = 'Add media', hint = '', onAdd, onClose }) {
  const [influencers] = useInfluencers()
  const looks = useMemo(() => [
    ...(influencer?.mainImage ? [{ url: influencer.mainImage, name: 'Main photo' }] : []),
    ...(influencer?.looks || []).map(l => ({ url: l.url, name: l.name })),
  ], [influencer])
  const media = useMemo(() => collectLibrary(influencers || [])
    .filter(it => (!influencer || it.influencerId === influencer.id) && (kinds === 'any' || it.kind === 'photo'))
    .slice(0, 60).map(it => ({ url: it.url, name: it.label, kind: it.kind })), [influencers, influencer, kinds])
  const [tab, setTab] = useState(looks.length ? 'looks' : media.length ? 'media' : 'upload')
  const [picked, setPicked] = useState([])
  const [uploads, setUploads] = useState([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const name = influencer?.name || 'this influencer'
  const items = tab === 'looks' ? looks : tab === 'media' ? media : uploads
  const toggle = url => setPicked(p => p.includes(url) ? p.filter(x => x !== url) : max === 1 ? [url] : [...p, url].slice(0, max))

  function upload(e) {
    const files = [...(e.target.files || [])].filter(f => f.type.startsWith('image/') || (kinds === 'any' && f.type.startsWith('video/'))).slice(0, 8)
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader()
      r.onload = () => (f.type.startsWith('image/') ? compressImage(r.result) : Promise.resolve(r.result)).then(res)
      r.readAsDataURL(f)
    }))).then(urls => {
      setUploads(u => [...urls.map((url, i) => ({ url, name: files[i].name })), ...u])
      setPicked(p => (max === 1 ? [urls[0]] : [...p, ...urls].slice(0, max)))
    }).finally(() => setBusy(false))
  }

  return (
    <div className="muse-sheet-backdrop" onClick={onClose}>
      <div className="muse-deal-sheet muse-attach" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="muse-cs-head"><h3>{title}</h3><button type="button" className="muse-btn muse-btn-text" onClick={onClose} aria-label="Close">✕</button></div>
        <div className="muse-chip-row" role="tablist" aria-label="Source">
          {[['upload', 'Upload'], ['looks', `${influencer?.name ? `${influencer.name}’s` : 'Her'} looks`], ['media', 'Media']].map(([id, l]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={`muse-chip${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>
        {tab === 'upload' && (
          <button type="button" className="muse-attach-drop" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Adding…' : 'Choose files from your device'}
            <input ref={fileRef} type="file" accept={kinds === 'any' ? 'image/*,video/*' : 'image/*'} multiple={max > 1} hidden onChange={upload} />
          </button>
        )}
        {items.length > 0 ? (
          <div className="muse-attach-grid">
            {items.map(it => {
              const n = picked.indexOf(it.url)
              return (
                <button key={it.url} type="button" className={`muse-attach-cell${n >= 0 ? ' on' : ''}`} aria-pressed={n >= 0} title={it.name} onClick={() => toggle(it.url)}
                  style={{ backgroundImage: isVideo(it.url) ? undefined : `url(${it.url})` }}>
                  {isVideo(it.url) && <em>Video</em>}
                  {n >= 0 && <span className="muse-attach-n">{max === 1 ? '✓' : n + 1}</span>}
                </button>
              )
            })}
          </div>
        ) : tab !== 'upload' && (
          <p className="muse-muted" style={{ fontSize: 13 }}>{tab === 'looks' ? `${name} has no looks yet. Add some on her profile, or upload.` : `No media of ${name} yet.`}</p>
        )}
        <div className="muse-assist-row">
          <span className="muse-muted f1" style={{ fontSize: 13, flex: 1 }}>{picked.length} selected{hint ? ` · ${hint}` : ''}</span>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!picked.length} onClick={() => { onAdd(picked); onClose() }}>Add</button>
        </div>
      </div>
    </div>
  )
}
