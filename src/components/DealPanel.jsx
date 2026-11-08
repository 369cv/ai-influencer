import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { DEAL_STATUSES, DELIVERABLE_KINDS, APPROVAL, newDeliverable, postFor, isPosted, kindLabel, approvalPackHtml } from '../utils/deals'
import { downloadImage } from '../utils/imageUtils'

// Brand deal → Deliverables. Each deliverable links to a Content post; the approval
// pack is a file you send the brand, and you record their answer here.
const fmtWhen = iso => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const handle = brand => '@' + String(brand || '').toLowerCase().replace(/[^a-z0-9_.]/g, '')

function postState(post) {
  if (!post) return { label: 'No post yet', tone: '' }
  if (isPosted(post)) return { label: 'Posted', tone: 'ok' }
  if (post.status === 'scheduled') return { label: `Scheduled · ${fmtWhen(post.scheduledAt)}`, tone: 'ok' }
  if (post.status === 'failed') return { label: 'Failed to post', tone: 'bad' }
  return { label: post.scheduledAt ? `Planned · ${fmtWhen(post.scheduledAt)}` : 'Draft', tone: '' }
}

function Deliverable({ d, n, post, onChange, onRemove, onCreatePost, onOpenPost, onStudio, onMake }) {
  const [noting, setNoting] = useState(false)
  const [note, setNote] = useState(d.note || '')
  const ps = postState(post)
  return (
    <li className="muse-dl">
      <div className="muse-dl-head">
        <span className="muse-dl-num">{n}</span>
        <select className="muse-input muse-dl-kind" value={d.kind} onChange={e => onChange({ kind: e.target.value })} aria-label={`Deliverable ${n} type`}>
          {DELIVERABLE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <label className="muse-dl-due">
          <span className="muse-muted">Due</span>
          <input className="muse-input" type="date" value={d.due || ''} onChange={e => onChange({ due: e.target.value })} aria-label={`Deliverable ${n} due date`} />
        </label>
        <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={onRemove} aria-label={`Remove deliverable ${n}`}>Remove</button>
      </div>
      <div className="muse-dl-row">
        <span className={`muse-sc-dot ${ps.tone === 'ok' ? 'ok' : ps.tone === 'bad' ? 'fail' : ''}`} aria-hidden />
        <span className="muse-dl-text">
          {post ? <><strong>{post.caption?.split('\n')[0]?.slice(0, 70) || 'No caption yet'}</strong><small>{ps.label}</small></> : <small>{ps.label}</small>}
        </span>
        {post ? <button type="button" className="muse-btn muse-btn-tonal" onClick={onOpenPost}>Open post</button>
          : <><button type="button" className="muse-btn muse-btn-text" onClick={onMake} title={d.kind === 'reel' || d.kind === 'story' ? 'Talking video with her, about this brand' : 'Photoshoot in Create, about this brand'}>{d.kind === 'reel' || d.kind === 'story' ? 'Make the video' : 'Make the photos'}</button><button type="button" className="muse-btn muse-btn-tonal" onClick={onCreatePost}>Create post</button></>}
      </div>
      <div className="muse-dl-row">
        <span className={`muse-badge ${d.approval === 'approved' ? 'posted' : d.approval === 'changes' ? 'failed' : d.approval === 'sent' ? 'approved' : 'draft'}`}>{APPROVAL[d.approval || 'none']}</span>
        <span className="muse-dl-text">{d.approval === 'changes' && d.note && <small>“{d.note}”</small>}</span>
        {d.approval !== 'approved' && <button type="button" className="muse-btn muse-btn-text" onClick={() => onChange({ approval: 'approved', note: '', decidedAt: Date.now() })}>Mark approved</button>}
        {d.approval !== 'changes' && <button type="button" className="muse-btn muse-btn-text" onClick={() => setNoting(v => !v)} aria-expanded={noting}>Changes requested</button>}
        {d.approval === 'changes' && <button type="button" className="muse-btn muse-btn-text" onClick={onStudio}>Open in Studio</button>}
      </div>
      {noting && (
        <form className="muse-dl-note" onSubmit={e => { e.preventDefault(); onChange({ approval: 'changes', note: note.trim(), decidedAt: Date.now() }); setNoting(false) }}>
          <input className="muse-input" autoFocus value={note} onChange={e => setNote(e.target.value)} placeholder="What the brand asked to change" aria-label="Requested changes" />
          <button type="submit" className="muse-btn muse-btn-filled" disabled={!note.trim()}>Save</button>
        </form>
      )}
    </li>
  )
}

export default function DealPanel({ deal, onChange, onClose }) {
  const navigate = useNavigate()
  const [influencers] = useInfluencers()
  const [posts] = useWorkspaceStore('muse_posts')
  const [packNote, setPackNote] = useState('')
  const list = deal.deliverables || []
  const inf = (influencers || []).find(i => i.id === deal.influencerId)
  const setList = next => onChange({ deliverables: next })
  const updateD = (id, patch) => setList(list.map(d => (d.id === id ? { ...d, ...patch } : d)))
  const ready = list.filter(d => postFor(d, posts) && d.approval !== 'approved')

  function createPost(d) {
    navigate('/content?compose=1', { state: {
      influencerId: deal.influencerId || null,
      prefillCaption: `\n\n#ad ${handle(deal.brand)}`,
      dealId: deal.id, deliverableId: d.id,
      ...(d.kind === 'reel' ? { igFormat: 'reel' } : d.kind === 'story' ? { igFormat: 'story' } : {}),
    } })
  }
  function downloadPack() {
    const items = ready.map(d => ({ d, post: postFor(d, posts) }))
    const html = approvalPackHtml({ deal, influencer: inf, items })
    const name = `${String(deal.brand).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-approval-${new Date().toISOString().slice(0, 10)}.html`
    downloadImage(`data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`, name)
    const ids = new Set(items.map(x => x.d.id))
    setList(list.map(d => (ids.has(d.id) ? { ...d, approval: 'sent', sentAt: Date.now() } : d)))
    setPackNote(`Downloaded with ${items.length} item${items.length > 1 ? 's' : ''}. Send it to ${deal.brand}, then record their answer on each item.`)
  }

  return (
    <div className="muse-sheet-backdrop" onClick={onClose}>
      <div className="muse-deal-sheet" role="dialog" aria-modal="true" aria-label={`${deal.brand} deliverables`} onClick={e => e.stopPropagation()}>
        <div className="muse-cs-head">
          <h3>{deal.brand}</h3>
          <button type="button" className="muse-btn muse-btn-text" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="muse-deal-fields">
          <label className="muse-field">
            <span className="muse-field-label">Influencer</span>
            <select className="muse-input" value={deal.influencerId || ''} onChange={e => onChange({ influencerId: e.target.value || null })}>
              <option value="">Pick one</option>
              {(influencers || []).map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
            </select>
          </label>
          <label className="muse-field">
            <span className="muse-field-label">Fee</span>
            <input className="muse-input" inputMode="decimal" value={deal.fee ?? ''} onChange={e => onChange({ fee: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" />
          </label>
          <label className="muse-field">
            <span className="muse-field-label">Status</span>
            <select className="muse-input" value={deal.status || 'negotiating'} onChange={e => onChange({ status: e.target.value, ...(e.target.value === 'paid' && !deal.paidAt ? { paidAt: Date.now() } : {}) })}>
              {DEAL_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="muse-deal-listhead">
          <span className="muse-field-label">Deliverables</span>
          <div className="muse-chip-row">
            {DELIVERABLE_KINDS.map(k => <button key={k.id} type="button" className="muse-chip" onClick={() => setList([...list, newDeliverable(k.id)])}>＋ {k.label}</button>)}
          </div>
        </div>
        {!list.length && <p className="muse-muted">Add what you agreed to deliver. Each one becomes a post in Content.</p>}
        <ol className="muse-dl-list">
          {list.map((d, i) => (
            <Deliverable key={d.id} d={d} n={i + 1} post={postFor(d, posts)}
              onChange={patch => updateD(d.id, patch)}
              onRemove={() => setList(list.filter(x => x.id !== d.id))}
              onCreatePost={() => createPost(d)}
              onMake={() => {
                const brief = `${kindLabel(d.kind)} for ${deal.brand}${d.note ? `. Change requested: ${d.note}` : ''}`
                if (d.kind === 'reel' || d.kind === 'story') navigate('/talk', { state: { influencerId: deal.influencerId, topic: `${deal.brand}: why I use it` } })
                else navigate('/', { state: { createFor: deal.influencerId || undefined, createText: `${brief}. Her with the ${deal.brand} product, natural and on-brand.` } })
              }}
              onOpenPost={() => navigate(`/content?view=queue&open=${postFor(d, posts).id}`)}
              onStudio={() => navigate('/studio', { state: { influencerId: deal.influencerId, prefillPrompt: d.note ? `${kindLabel(d.kind)} for ${deal.brand}. Change requested: ${d.note}` : undefined } })}
            />
          ))}
        </ol>

        <div className="muse-deal-foot">
          <span className="muse-flow-bar-note">{packNote || (ready.length ? `${ready.length} item${ready.length > 1 ? 's' : ''} with a post can go in the approval pack.` : 'Create a post for a deliverable to include it in an approval pack.')}</span>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!ready.length} onClick={downloadPack}>Download approval pack</button>
        </div>
      </div>
    </div>
  )
}
