import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useLocalJSON } from '../utils/localJson'
import { isHFConnected } from '../utils/higgsfieldAuth'
import { hasClaude } from '../utils/claudeAssist'
import {
  SESSIONS_KEY, RATIOS, MAX_SHOTS, normalizeSessions, patchSession, planCredits, modelLabel,
  revisePlan, runSession, stopSession, deleteSession,
} from '../utils/createSessions'
import { newId } from '../utils/localJson'
import { addLooks } from './InfluencerLooks'

// Create → one request: the plan (free, editable, cost on the button), then the results.
const STATUS = { plan: 'Plan · free to change', running: 'Making it…', done: 'Ready', failed: 'Failed', stopped: 'Stopped' }

export default function CreatePlan({ id, onClose }) {
  const navigate = useNavigate()
  const [influencers, setInfluencers] = useInfluencers()
  const [saved, setSaved] = useState(false)
  const [raw] = useLocalJSON(SESSIONS_KEY, [])
  const s = normalizeSessions(raw).find(x => x.id === id)
  const [change, setChange] = useState('')
  const [revising, setRevising] = useState(false)
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState([])
  if (!s) return <div className="muse-cp-empty"><p className="muse-muted">This request isn’t here anymore.</p><button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Back to Create</button></div>

  const inf = (influencers || []).find(i => i.id === s.influencerId)
  const plan = s.plan
  const credits = planCredits(plan)
  const editable = s.status === 'plan' || s.status === 'failed' || s.status === 'stopped'
  const results = plan.shots.map(sh => ({ sh, url: s.results?.[sh.id], busy: s.status === 'running' && (s.running || []).includes(sh.id) }))
  const anyResult = results.some(r => r.url)
  const setPlan = patch => patchSession(id, x => ({ plan: { ...x.plan, ...patch } }))
  const setShot = (sid, text) => setPlan({ shots: plan.shots.map(x => (x.id === sid ? { ...x, text } : x)) })
  const blocker = !isHFConnected() ? 'Connect Higgsfield in Settings → Connections to make this.' : !inf ? 'Pick an influencer for this shoot.' : !plan.shots.some(x => x.text.trim()) ? 'Add at least one shot.' : ''

  async function ask(e) {
    e.preventDefault()
    if (!change.trim()) return
    setRevising(true); setNote('')
    const ok = await revisePlan(id, change.trim())
    setRevising(false)
    if (ok) { setChange(''); setNote('Updated. Nothing else changed.') } else setNote('Couldn’t change it automatically. Edit the plan directly.')
  }
  const make = () => runSession(id, inf)
  const redo = sid => runSession(id, inf, { onlyShotIds: [sid] })
  const toggle = url => setPicked(p => (p.includes(url) ? p.filter(u => u !== url) : [...p, url]))
  const queue = () => {
    const media = picked.length ? picked : results.filter(r => r.url).map(r => r.url).slice(0, 1)
    navigate('/content?compose=1', { state: { influencerId: s.influencerId, prefillMedia: media[0], prefillMediaList: media } })
  }

  return (
    <section className="muse-cp" aria-label="Plan">
      <div className="muse-cp-head">
        <button type="button" className="muse-btn muse-btn-text" onClick={onClose}>← Create</button>
        <span className={`muse-badge ${s.status === 'done' ? 'posted' : s.status === 'failed' || s.status === 'stopped' ? 'failed' : 'draft'}`}>{STATUS[s.status]}</span>
      </div>
      <p className="muse-cp-request">“{s.request}”</p>

      <div className="muse-cp-card">
        {editable
          ? <input className="muse-cp-title" value={plan.title} onChange={e => setPlan({ title: e.target.value })} aria-label="Title" />
          : <h2 className="muse-cp-title">{plan.title}</h2>}

        <dl className="muse-cp-kv">
          <dt>Influencer</dt>
          <dd>{editable
            ? <select className="muse-input" value={s.influencerId || ''} onChange={e => patchSession(id, { influencerId: e.target.value || null, influencerName: (influencers || []).find(i => i.id === e.target.value)?.name || '' })}>
                <option value="">Pick one</option>{(influencers || []).map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
              </select>
            : inf?.name || s.influencerName}</dd>
          <dt>Scene</dt>
          <dd>{editable ? <textarea className="muse-input" rows={2} value={plan.scene} onChange={e => setPlan({ scene: e.target.value })} aria-label="Scene" /> : plan.scene}</dd>
          {(inf?.looks || []).length > 0 && <>
            <dt>Look</dt>
            <dd className="muse-chip-row">{editable
              ? [{ id: '', name: 'None', url: '' }, ...inf.looks].map(l => <button key={l.id || 'none'} type="button" className={`muse-chip${(plan.lookUrl || '') === l.url ? ' on' : ''}`} aria-pressed={(plan.lookUrl || '') === l.url} onClick={() => setPlan({ lookUrl: l.url || undefined })}>{l.url && <span className="muse-create-av" style={{ width: 18, height: 18, backgroundImage: `url(${l.url})` }} />}{l.name}</button>)
              : (inf.looks.find(l => l.url === plan.lookUrl)?.name || 'None')}</dd>
          </>}
          <dt>Format</dt>
          <dd className="muse-chip-row">{editable
            ? RATIOS.map(r => <button key={r} type="button" className={`muse-chip${plan.ratio === r ? ' on' : ''}`} aria-pressed={plan.ratio === r} onClick={() => setPlan({ ratio: r })}>{r}</button>)
            : plan.ratio} <span className="muse-muted">· {modelLabel(plan.model)} · {plan.resolution}</span></dd>
        </dl>

        <div className="muse-cp-shots">
          {results.map(({ sh, url, busy }, n) => (
            <div key={sh.id} className="muse-cp-shot">
              <div className={`muse-cp-frame r${plan.ratio.replace(':', 'x')}${url && picked.includes(url) ? ' on' : ''}`}>
                {url ? <button type="button" className="muse-cp-img" style={{ backgroundImage: `url(${url})` }} aria-pressed={picked.includes(url)} aria-label={`Shot ${n + 1}: select`} onClick={() => toggle(url)} />
                  : busy ? <span className="muse-cp-wait">Making…</span>
                  : <span className="muse-cp-num">{n + 1}</span>}
              </div>
              {editable && !url
                ? <textarea className="muse-input" rows={3} value={sh.text} onChange={e => setShot(sh.id, e.target.value)} aria-label={`Shot ${n + 1}`} />
                : <p className="muse-cp-shottext">{sh.text}</p>}
              <div className="muse-cp-shotact">
                {editable && plan.shots.length > 1 && !url && <button type="button" className="muse-btn muse-btn-text" onClick={() => setPlan({ shots: plan.shots.filter(x => x.id !== sh.id) })}>Remove</button>}
                {url && s.status !== 'running' && <button type="button" className="muse-btn muse-btn-text" onClick={() => redo(sh.id)}>Redo</button>}
              </div>
            </div>
          ))}
          {editable && plan.shots.length < MAX_SHOTS && <button type="button" className="muse-cp-add" onClick={() => setPlan({ shots: [...plan.shots, { id: newId('shot'), text: '' }] })}>＋ Shot</button>}
        </div>

        {s.status === 'running' && <div className="muse-wf-prog" role="progressbar" aria-valuenow={s.progress || 0} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${s.progress || 2}%` }} /></div>}
        {s.error && <p className="muse-error" role="alert">{s.error}</p>}

        {editable && hasClaude() && (
          <form className="muse-cp-ask" onSubmit={ask}>
            <input className="muse-input" value={change} onChange={e => setChange(e.target.value)} placeholder="Change something: “make the last shot by the window”" aria-label="Change the plan" />
            <button type="submit" className="muse-btn muse-btn-tonal" disabled={!change.trim() || revising}>{revising ? 'Changing…' : 'Change'}</button>
          </form>
        )}
        {note && <p className="muse-field-hint" role="status">{note}</p>}

        <div className="muse-cp-foot">
          {s.status === 'running' ? (
            <><span className="muse-flow-bar-note">You can leave this page; it keeps going until you close the app.</span><button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => stopSession(id)}>Stop</button></>
          ) : anyResult && !editable ? (
            <>
              <span className="muse-flow-bar-note">{picked.length ? `${picked.length} selected` : 'Tap photos to choose which to post.'} Also saved to Content → Media.</span>
              {inf && <button type="button" className="muse-btn muse-btn-text" disabled={!picked.length || saved} onClick={() => { addLooks(setInfluencers, inf.id, picked); setSaved(true) }} title={picked.length ? '' : 'Select photos first'}>{saved ? 'Saved as looks' : `Save as look${picked.length > 1 ? 's' : ''}`}</button>}
              <button type="button" className="muse-btn muse-btn-text" onClick={() => navigate('/studio?mode=video', { state: { influencerId: s.influencerId, ref: picked[0] || results.find(r => r.url)?.url, mode: 'video' } })}>Animate in Studio</button>
              <button type="button" className="muse-btn muse-btn-filled" onClick={queue}>Post{picked.length > 1 ? ` (${picked.length})` : ''}</button>
            </>
          ) : (
            <>
              <span className="muse-flow-bar-note">{blocker || `Uses about ${credits} Higgsfield credits. Nothing is made until you press the button.`}</span>
              <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { deleteSession(id); onClose() }}>Discard</button>
              <button type="button" className="muse-btn muse-btn-tonal" onClick={() => navigate('/studio', { state: { influencerId: s.influencerId, prefillPrompt: `${plan.scene}\n${plan.shots.map(x => `- ${x.text}`).join('\n')}` } })}>Edit in Studio</button>
              <button type="button" className="muse-btn muse-btn-filled" disabled={!!blocker} onClick={make}>Make it · ~{credits} credits</button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
