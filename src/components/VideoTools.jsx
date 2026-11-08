import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHFToken } from '../utils/higgsfieldAuth'
import { hfToolNames, reframeCost, reframeVideo, predictVirality, videoDuration } from '../utils/higgsfieldGenerate'
import { useInfluencers } from '../store'

// Video tools on Higgsfield: Reframe (new shape, edges filled in) and Virality Predictor.
// Both show only when your Higgsfield account lists the tool.
const SHAPES = ['9:16', '1:1', '3:4', '16:9']

function useTool(name) {
  const [has, setHas] = useState(null)
  const signedIn = !!getHFToken()
  useEffect(() => { if (signedIn) hfToolNames().then(t => setHas(t.has(name))).catch(() => setHas(false)) }, [signedIn, name])
  return { signedIn, has }
}
const Connect = ({ what }) => <><p>Sign in to Higgsfield to {what}.</p><div className="muse-plan-actions"><Link className="muse-btn muse-btn-filled" to="/settings?section=connections">Connect Higgsfield</Link></div></>

export function ReframeSheet({ item }) {
  const { signedIn, has } = useTool('reframe')
  const [, setInfluencers] = useInfluencers()
  const [shape, setShape] = useState('9:16')
  const [resolution, setResolution] = useState('1080p')
  const [seconds, setSeconds] = useState(null)
  const [cost, setCost] = useState({ state: 'idle' })
  const [run, setRun] = useState({ state: 'idle' })
  useEffect(() => { videoDuration(item.url).then(setSeconds).catch(() => setSeconds(0)) }, [item.url])
  useEffect(() => { setCost({ state: 'idle' }) }, [resolution])
  async function quote() {
    setCost({ state: 'busy' })
    try { setCost({ state: 'done', n: await reframeCost({ seconds, resolution }) }) } catch (e) { setCost({ state: 'error', error: e.message }) }
  }
  async function go() {
    setRun({ state: 'busy', p: 0 })
    try {
      const url = await reframeVideo(item.url, { aspectRatio: shape, resolution, seconds, onProgress: p => setRun({ state: 'busy', p: Math.round(p) }) })
      if (item.influencerId) setInfluencers(prev => prev.map(i => i.id === item.influencerId ? { ...i, generationHistory: [{ id: `reframe_${Date.now()}`, type: 'video', url, label: `Reframed ${shape}`, date: Date.now(), settings: { source: 'edit', edit: 'reframe', from: item.url, aspectRatio: shape } }, ...(i.generationHistory || [])] } : i))
      setRun({ state: 'done', url })
    } catch (e) { setRun({ state: 'error', error: e.message }) }
  }
  return (
    <div className="muse-viewer-post" role="dialog" aria-label="Reframe">
      <h3>Reframe</h3>
      {!signedIn ? <Connect what="reframe videos" /> : has == null ? <p>Checking your Higgsfield account…</p> : !has ? <p>Your Higgsfield account doesn’t offer Reframe right now.</p> : (
        <>
          <p>A new shape for this video; Higgsfield fills in the new edges.{seconds > 60 ? ' Videos over 60 seconds can’t be reframed.' : ''}</p>
          <div className="muse-chip-row" role="radiogroup" aria-label="New shape">{SHAPES.map(r => <button key={r} type="button" role="radio" aria-checked={shape === r} className={`muse-chip${shape === r ? ' on' : ''}`} onClick={() => { setShape(r); setRun({ state: 'idle' }) }}>{r}</button>)}</div>
          <div className="muse-chip-row" role="radiogroup" aria-label="Resolution">{['720p', '1080p'].map(r => <button key={r} type="button" role="radio" aria-checked={resolution === r} className={`muse-chip${resolution === r ? ' on' : ''}`} onClick={() => setResolution(r)}>{r}</button>)}</div>
          <p className="muse-muted" style={{ fontSize: 13 }}>
            {!seconds ? 'Reading the video length…' : cost.state === 'busy' ? 'Asking Higgsfield for the cost…' : cost.state === 'done' ? (cost.n != null ? `Costs ${cost.n} credits.` : 'Higgsfield didn’t return a price.') : cost.state === 'error' ? <span className="muse-error">{cost.error}</span> : <button type="button" className="muse-btn muse-btn-text" style={{ padding: 0 }} onClick={quote}>Check the cost</button>}
          </p>
          {run.state === 'error' && <p className="muse-error">{run.error}</p>}
          {run.state === 'done'
            ? <div className="muse-edit-result"><video src={run.url} muted playsInline style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 10 }} /><span>Reframed {shape}. Saved to Media.</span><a className="muse-btn muse-btn-text" href={run.url} target="_blank" rel="noopener noreferrer">Open</a></div>
            : <div className="muse-plan-actions"><button type="button" className="muse-btn muse-btn-filled" disabled={!seconds || seconds > 60 || run.state === 'busy'} onClick={go}>{run.state === 'busy' ? `Reframing… ${run.p || 0}%` : `Reframe to ${shape}${cost.state === 'done' && cost.n != null ? ` · ${cost.n} credits` : ''}`}</button></div>}
        </>
      )}
    </div>
  )
}

// Virality Predictor: Higgsfield's read on a video before it's posted. Shows only the
// scores Higgsfield returns.
export function ViralityPanel({ url, compact = false }) {
  const { signedIn, has } = useTool('virality_predictor')
  const [state, setState] = useState({ state: 'idle' })
  useEffect(() => { setState({ state: 'idle' }) }, [url])
  if (!signedIn) return compact ? null : <Connect what="predict virality" />
  if (has === false) return compact ? null : <p className="muse-muted">Your Higgsfield account doesn’t offer the Virality Predictor right now.</p>
  if (has == null) return null
  async function go() {
    setState({ state: 'busy', p: 0 })
    try { setState({ state: 'done', r: await predictVirality(url, { onProgress: p => setState({ state: 'busy', p }) }) }) } catch (e) { setState({ state: 'error', error: e.message }) }
  }
  const r = state.r
  return (
    <div className="muse-viral">
      {state.state !== 'done' && <button type="button" className="muse-chip" disabled={state.state === 'busy'} onClick={go} title="Higgsfield Virality Predictor: uses your Higgsfield credits">{state.state === 'busy' ? `Analysing… ${state.p || 0}%` : 'Predict virality'}</button>}
      {state.state === 'error' && <small className="muse-error">{state.error}</small>}
      {r && (r.scores.length ? (
        <div className="muse-viral-scores" aria-label="Virality scores">
          {r.scores.slice(0, 6).map(s => <span key={s.key} className="muse-viral-score"><b>{s.value}</b><small>{s.key}</small></span>)}
        </div>
      ) : <small className="muse-muted">Higgsfield finished the analysis without scores Muse can show.</small>)}
      {r?.summary && <small className="muse-muted">{r.summary}</small>}
      {r?.url && <a className="muse-text-btn" href={r.url} target="_blank" rel="noopener noreferrer">Open the full report in Higgsfield</a>}
    </div>
  )
}
