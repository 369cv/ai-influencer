import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInfluencers } from '../store'
import MediaViewer from '../components/MediaViewer'
import { collectLibrary, readPhotoHistory, handoffToPhotoStudio } from '../utils/library'

// Library: every generated photo and video in one media grid.
const KINDS = [{ id: 'all', label: 'All' }, { id: 'photo', label: 'Photos' }, { id: 'video', label: 'Videos' }]

export default function Library({ embedded = false }) {
  const navigate = useNavigate()
  const [influencers] = useInfluencers()
  const [photoHistory, setPhotoHistory] = useState(readPhotoHistory)
  const [kind, setKind] = useState('all')
  const [who, setWho] = useState('all')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    const refresh = () => setPhotoHistory(readPhotoHistory())
    window.addEventListener('photo_studio_history_updated', refresh)
    window.addEventListener('storage', refresh)
    return () => { window.removeEventListener('photo_studio_history_updated', refresh); window.removeEventListener('storage', refresh) }
  }, [])

  const all = useMemo(() => collectLibrary(influencers || [], photoHistory), [influencers, photoHistory])
  const people = useMemo(() => {
    const counts = {}
    all.forEach(i => { counts[i.influencerId] = (counts[i.influencerId] || 0) + 1 })
    return (influencers || []).filter(i => counts[i.id]).map(i => ({ ...i, count: counts[i.id] }))
  }, [all, influencers])
  const items = all.filter(i => (kind === 'all' || i.kind === kind) && (who === 'all' || i.influencerId === who))

  const go = to => { setOpen(null); navigate(to.pathname, { state: to.state }) }

  return (
    <div className={embedded ? 'muse-embed' : 'muse-page'}>
      {!embedded && <header className="muse-page-head">
        <div>
          <h1>Library</h1>
          <p>{all.length ? `${all.length} photos and videos across ${people.length} ${people.length === 1 ? 'influencer' : 'influencers'}` : 'Everything you generate lands here.'}</p>
        </div>
      </header>}

      {all.length > 0 && (
        <div className="muse-filter-row" role="toolbar" aria-label="Filters">
          {KINDS.map(k => (
            <button key={k.id} type="button" className={`muse-filter${kind === k.id ? ' on' : ''}`} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>
          ))}
          <span className="muse-filter-sep" aria-hidden />
          <button type="button" className={`muse-filter${who === 'all' ? ' on' : ''}`} aria-pressed={who === 'all'} onClick={() => setWho('all')}>Everyone</button>
          {people.map(p => (
            <button key={p.id} type="button" className={`muse-filter with-avatar${who === p.id ? ' on' : ''}`} aria-pressed={who === p.id} onClick={() => setWho(p.id)}>
              <span className="muse-filter-avatar" style={{ backgroundImage: (p.mainImage || p.image) ? `url(${p.mainImage || p.image})` : undefined }} />
              {p.name}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <div className="muse-media-grid">
          {items.map((it, i) => (
            <button key={it.id} type="button" className="muse-media-cell" onClick={() => setOpen(i)} aria-label={`Open ${it.influencerName}, ${it.label}`}>
              {it.kind === 'video'
                ? <video src={it.url} muted playsInline preload="metadata" />
                : <img src={it.url} alt="" loading="lazy" decoding="async" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />}
              {it.kind === 'video' && <span className="muse-media-badge">Video</span>}
              <span className="muse-media-meta">{it.influencerName}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="muse-empty">
          <div className="muse-glow" aria-hidden />
          <h2>{all.length ? 'Nothing matches these filters' : 'No media yet'}</h2>
          <p>{all.length ? 'Try another filter.' : 'Generate a photo shoot or a video and it will show up here.'}</p>
          {!all.length && <Link to="/influencers" className="muse-btn muse-btn-filled">Open a studio</Link>}
        </div>
      )}

      {open != null && items[open] && (
        <MediaViewer
          items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)}
          onModify={it => { setOpen(null); navigate('/studio', { state: { ref: it.url, influencerId: it.influencerId } }) }}
          onMoreLikeThis={it => it.settings?.source === 'studio'
            ? (setOpen(null), navigate('/studio', { state: { ref: it.url, influencerId: it.influencerId } }))
            : go(handoffToPhotoStudio(it, { openPlan: true }))}
          onMakeVideo={it => { setOpen(null); navigate('/studio?mode=video', { state: { ref: it.url, influencerId: it.influencerId, mode: 'video' } }) }}
        />
      )}
    </div>
  )
}
