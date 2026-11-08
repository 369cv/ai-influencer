import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TEMPLATES, INTEGRATIONS, STEP_KINDS, TRIGGERS, templateStatus } from '../utils/workflows'
import { RUNS_KEY, normalizeRuns, runnable, estimateRun, startRun, cancelRun, queueRunPost, discardRunPost } from '../utils/workflowRun'
import { useLocalJSON } from '../utils/localJson'
import { useInfluencers, useBrandDeals } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { collectLibrary } from '../utils/library'

// Workflow template gallery (/workflows) and the trigger → steps view (/workflows/:id).
// A run is set up here, runs step by step (utils/workflowRun.js) and stops for review
// before anything goes to Content's queue. Steps whose app isn't connected show Connect.

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)
const AppMark = ({ app }) => <span className="muse-app-mark" title={INTEGRATIONS[app].name}>{INTEGRATIONS[app].mono}</span>
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')
const RUN_LABEL = { running: 'Running', review: 'Needs review', done: 'Done', failed: 'Failed', cancelled: 'Cancelled', stopped: 'Stopped' }
const STEP_LABEL = { waiting: 'Waiting', running: 'Running', review: 'Review', done: 'Done', failed: 'Failed', skipped: 'Skipped', stopped: 'Stopped' }
const liveStatus = r => r.status
// Apps a run needs connected before it starts. Post steps only add to Content's queue,
// so a posting service isn't needed until you send.
const runMissing = t => [...new Set(t.steps.filter(s => s.kind !== 'post').map(s => s.app))].filter(a => !INTEGRATIONS[a].isConnected())
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString() }

function Chain({ t }) {
  return (
    <div className="muse-chain" aria-label="Steps">
      <span className="muse-chain-node trigger"><Icon d={TRIGGERS[t.trigger].icon} size={14} /></span>
      {t.steps.map((s, i) => (
        <span key={i} className="muse-chain-seg">
          <span className="muse-chain-line" aria-hidden />
          <span className="muse-chain-node" title={STEP_KINDS[s.kind].label}><Icon d={STEP_KINDS[s.kind].icon} size={14} /></span>
        </span>
      ))}
    </div>
  )
}

function RunList({ runs }) {
  if (!runs.length) return null
  return (
    <section className="muse-wf-runs" aria-labelledby="wf-runs">
      <h2 id="wf-runs" className="muse-group-title">Runs</h2>
      <ul className="muse-conn-group">
        {runs.slice(0, 12).map(r => {
          const st = liveStatus(r)
          return (
            <li key={r.id}>
              <Link className="muse-conn-row" to={`/workflows/${r.templateId}?run=${r.id}`}>
                <span className={`muse-sc-dot ${st === 'done' ? 'ok' : st === 'failed' || st === 'stopped' ? 'fail' : st === 'running' ? 'run' : ''}`} aria-hidden />
                <span className="muse-conn-text">
                  <strong>{r.title}</strong>
                  <small>{[r.influencerName, ago(r.createdAt), r.credits ? `~${r.credits} credits` : '', st === 'failed' || st === 'stopped' ? r.error : ''].filter(Boolean).join(' · ')}</small>
                </span>
                <span className={`muse-status${st === 'review' ? ' ready' : ''}`}>{RUN_LABEL[st] || st}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Gallery() {
  const [raw] = useLocalJSON(RUNS_KEY, [])
  const runs = normalizeRuns(raw)
  return (
    <div className="muse-page">
      <header className="muse-page-head">
        <div>
          <h1>Workflows</h1>
          <p>Templates that chain the steps you repeat: photo, caption, voice, clip, post.</p>
        </div>
      </header>
      <div className="muse-template-grid">
        {TEMPLATES.map(t => {
          const st = templateStatus(t)
          const can = runnable(t)
          return (
            <Link key={t.id} to={`/workflows/${t.id}`} className={`muse-template${t.featured ? ' featured' : ''}`}>
              <Chain t={t} />
              <h2>{t.title}</h2>
              <p>{t.blurb}</p>
              <div className="muse-template-foot">
                <span className="muse-app-stack">{st.apps.map(a => <AppMark key={a} app={a} />)}</span>
                <span className={`muse-status${!runMissing(t).length && can.ok ? ' ready' : ''}`}>{!can.ok ? 'Planning only' : !runMissing(t).length ? 'Ready' : `Connect ${runMissing(t).length}`}</span>
              </div>
            </Link>
          )
        })}
      </div>
      <RunList runs={runs} />
    </div>
  )
}

function StepCard({ n, step, rs }) {
  const app = INTEGRATIONS[step.app]
  const connected = app.isConnected()
  const status = rs?.status
  return (
    <li className={`muse-flow-step${status ? ` is-${status}` : ''}`}>
      <span className="muse-flow-rail" aria-hidden><span className="muse-flow-dot">{status === 'done' ? '✓' : n}</span></span>
      <div className={`muse-flow-card${connected ? '' : ' needs'}`}>
        <span className="muse-flow-icon"><Icon d={STEP_KINDS[step.kind].icon} /></span>
        <div className="muse-flow-text">
          <span className="muse-flow-kicker">{STEP_KINDS[step.kind].label} · {app.name}</span>
          <strong>{step.title}</strong>
          <span className="muse-flow-detail">{rs?.error || rs?.note || step.detail}</span>
          {rs?.status === 'running' && rs.progress > 0 && <div className="muse-wf-prog" role="progressbar" aria-valuenow={rs.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${rs.progress}%` }} /></div>}
          {rs?.text && <p className="muse-wf-out">{rs.text}</p>}
        </div>
        {rs?.url && (isVideo(rs.url)
          ? <video className="muse-wf-thumb" src={rs.url} muted playsInline loop autoPlay aria-label="Result" />
          : <img className="muse-wf-thumb" src={rs.url} alt="Result" />)}
        {rs
          ? <span className={`muse-status${status === 'done' || status === 'review' ? ' ready' : ''}${status === 'failed' ? ' failed' : ''}`}>{STEP_LABEL[status]}</span>
          : connected
            ? <span className="muse-status ready">Ready</span>
            : app.available
              ? <Link to={app.connectTo} className="muse-btn muse-btn-tonal muse-btn-sm">{step.kind === 'post' ? 'Connect to send' : 'Connect'}</Link>
              : <span className="muse-status">Not available yet</span>}
      </div>
    </li>
  )
}

// What a run needs before it starts: influencer, plus the template's own inputs.
function Setup({ t, onRun }) {
  const [influencers] = useInfluencers()
  const [deals] = useBrandDeals()
  const list = influencers || []
  const library = useMemo(() => collectLibrary(list), [list])
  const cfg = t.setup || {}
  const [infId, setInfId] = useState(() => list[list.length - 1]?.id || '')
  const [scene, setScene] = useState(cfg.defaultScene || '')
  const [motion, setMotion] = useState(cfg.defaultMotion || '')
  const [startPhoto, setStartPhoto] = useState('')
  const [reference, setReference] = useState('')
  const [dealId, setDealId] = useState('')
  const [picking, setPicking] = useState('') // 'start' | 'ref'
  const inf = list.find(i => i.id === infId)
  const deal = (deals || []).find(d => d.id === dealId)
  const photos = library.filter(it => it.kind === 'photo' && (!infId || it.influencerId === infId)).slice(0, 24)
  const setup = { scene: scene.trim(), motion: motion.trim(), startPhoto: startPhoto || undefined, reference: (deal?.image || reference) || undefined, brand: deal?.brand, ratio: cfg.ratio }
  const credits = estimateRun(t, setup)
  const needsClaude = t.steps.some(s => s.app === 'claude')
  const missing = !inf ? 'Pick an influencer.' : cfg.deal && !deal ? 'Pick a brand deal.' : cfg.reference && !reference ? 'Pick a reference photo.' : cfg.scene && !startPhoto && !scene.trim() ? 'Describe the scene.' : ''

  const Picker = ({ value, onPick }) => (
    <div className="muse-picker"><div className="muse-picker-grid">
      {photos.length === 0 && <p className="muse-muted">No photos{inf ? ` for ${inf.name}` : ''} in Media yet.</p>}
      {photos.map(it => (
        <button key={it.id} type="button" className={`muse-thumb${value === it.url ? ' on' : ''}`} aria-pressed={value === it.url} style={{ backgroundImage: `url(${it.url})` }} title={it.label} onClick={() => { onPick(value === it.url ? '' : it.url); setPicking('') }} />
      ))}
    </div></div>
  )

  return (
    <section className="muse-wf-setup" aria-label="Run setup">
      <label className="muse-field">
        <span className="muse-field-label">Influencer</span>
        <select className="muse-input" value={infId} onChange={e => { setInfId(e.target.value); setStartPhoto(''); setReference('') }}>
          <option value="">Pick one</option>
          {list.map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
        </select>
      </label>
      {cfg.deal && (
        <label className="muse-field">
          <span className="muse-field-label">Brand deal</span>
          <select className="muse-input" value={dealId} onChange={e => setDealId(e.target.value)}>
            <option value="">Pick one</option>
            {(deals || []).map(d => <option key={d.id} value={d.id}>{d.brand || 'Untitled'}{d.category ? ` · ${d.category}` : ''}</option>)}
          </select>
          {!(deals || []).length && <span className="muse-field-hint">No deals yet. <Link to="/brand-deals">Add one</Link>.</span>}
        </label>
      )}
      {cfg.startPhoto && (
        <div className="muse-field">
          <span className="muse-field-label">Start photo</span>
          <div className="muse-chip-row">
            <button type="button" className={`muse-chip${!startPhoto ? ' on' : ''}`} aria-pressed={!startPhoto} onClick={() => setStartPhoto('')}>Generate a new one</button>
            <button type="button" className={`muse-chip${startPhoto ? ' on' : ''}`} aria-expanded={picking === 'start'} onClick={() => setPicking(p => (p === 'start' ? '' : 'start'))}>{startPhoto ? 'Picked from Media' : 'Pick from Media'}</button>
          </div>
          {picking === 'start' && <Picker value={startPhoto} onPick={setStartPhoto} />}
        </div>
      )}
      {cfg.reference && (
        <div className="muse-field">
          <span className="muse-field-label">Reference photo</span>
          <div className="muse-chip-row">
            <button type="button" className={`muse-chip${reference ? ' on' : ''}`} aria-expanded={picking === 'ref'} onClick={() => setPicking(p => (p === 'ref' ? '' : 'ref'))}>{reference ? 'Picked' : 'Pick from Media'}</button>
            {reference && <img src={reference} alt="" className="muse-wf-mini" />}
          </div>
          {picking === 'ref' && <Picker value={reference} onPick={setReference} />}
        </div>
      )}
      {cfg.scene && !startPhoto && (
        <label className="muse-field">
          <span className="muse-field-label">Scene</span>
          <textarea className="muse-input" rows={2} value={scene} onChange={e => setScene(e.target.value)} />
        </label>
      )}
      {cfg.motion && (
        <label className="muse-field">
          <span className="muse-field-label">Motion</span>
          <input className="muse-input" value={motion} onChange={e => setMotion(e.target.value)} placeholder="How she moves in the clip" />
        </label>
      )}
      <div className="muse-wf-run-row">
        <span className="muse-flow-bar-note">
          {missing || [credits ? `Uses ~${credits} Higgsfield credits` : 'No Higgsfield credits', needsClaude ? 'one short Claude reply' : ''].filter(Boolean).join(' and ') + '. Nothing posts until you review it.'}
        </span>
        <button type="button" className="muse-btn muse-btn-filled" disabled={!!missing} onClick={() => onRun(inf, setup)}>{credits ? `Run · ~${credits} credits` : 'Run'}</button>
      </div>
    </section>
  )
}

function Review({ run, onDone }) {
  const [influencers] = useInfluencers()
  const [accounts] = useWorkspaceStore('muse_accounts')
  const [posts, setPosts] = useWorkspaceStore('muse_posts')
  const [caption, setCaption] = useState(run.caption || '')
  const [error, setError] = useState('')
  const inf = (influencers || []).find(i => i.id === run.influencerId)
  const platform = run.steps.find(s => s.kind === 'post' && s.status === 'review')?.platform
  const hasAccount = (accounts || []).some(a => a.influencerId === inf?.id)
  function queue() {
    try {
      const post = queueRunPost(run.id, { influencer: inf, accounts: accounts || [], posts: posts || [], caption })
      setPosts(l => [post, ...l])
      onDone(post)
    } catch (e) { setError(e.message) }
  }
  return (
    <section className="muse-wf-review" aria-label="Review before posting">
      <span className="muse-field-label">Review before it goes to the queue</span>
      <div className="muse-wf-review-body">
        {run.media && (isVideo(run.media) ? <video src={run.media} controls playsInline className="muse-wf-review-media" /> : <img src={run.media} alt="Result" className="muse-wf-review-media" />)}
        <div className="muse-wf-review-side">
          <label className="muse-field">
            <span className="muse-field-label">Caption</span>
            <textarea className="muse-input" rows={6} value={caption} onChange={e => setCaption(e.target.value)} />
          </label>
          <p className="muse-field-hint">
            {inf?.postingSchedule ? `Goes into ${inf.name}’s next free slot as a planned post.` : 'Saved as a draft (no posting schedule set).'}
            {' '}{hasAccount ? `Uses ${inf?.name}’s ${platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : ''} account if linked.` : <>{inf?.name || 'This influencer'} has no linked accounts yet. <Link to="/settings?section=accounts">Link one</Link>.</>}
            {' '}You send it from Content.
          </p>
          {error && <p className="muse-error" role="alert">{error}</p>}
          <div className="muse-chip-row">
            <button type="button" className="muse-btn muse-btn-text" onClick={() => discardRunPost(run.id)}>Don’t queue</button>
            <button type="button" className="muse-btn muse-btn-filled" onClick={queue}>Add to queue</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Detail({ t }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [raw] = useLocalJSON(RUNS_KEY, [])
  const runs = normalizeRuns(raw)
  const [queued, setQueued] = useState(null)
  const run = runs.find(r => r.id === params.get('run') && r.templateId === t.id)
  const can = runnable(t)
  const status = run && liveStatus(run)
  const busy = status === 'running'
  const missing = runMissing(t)
  const unavailable = missing.filter(a => !INTEGRATIONS[a].available)
  const myRuns = runs.filter(r => r.templateId === t.id)

  async function onRun(inf, setup) {
    setQueued(null)
    const id = await startRun(t, { influencer: inf, setup })
    setParams({ run: id })
  }

  return (
    <div className="muse-page muse-flow-page">
      <button type="button" className="muse-btn muse-btn-text muse-back" onClick={() => navigate('/workflows')}>← Workflows</button>
      <header className="muse-page-head">
        <div>
          <h1>{t.title}</h1>
          <p>{t.blurb}</p>
        </div>
      </header>

      {run && (
        <div className={`muse-notice muse-wf-runhead${status === 'failed' || status === 'stopped' ? ' bad' : ''}`} role="status">
          <span>
            <strong>{RUN_LABEL[status]}</strong> · {run.influencerName} · {ago(run.createdAt)}{run.credits ? ` · ~${run.credits} credits` : ''}
            {(status === 'failed' || status === 'stopped') && run.error && <><br />{run.error}</>}
            {status === 'running' && <><br />You can leave this page; it keeps running until you close or reload the app.</>}
          </span>
          <span className="muse-chip-row">
            {busy && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => cancelRun(run.id)}>Stop</button>}
            {!busy && <button type="button" className="muse-btn muse-btn-tonal" onClick={() => { setParams({}); setQueued(null) }}>New run</button>}
          </span>
        </div>
      )}

      <ol className="muse-flow">
        <li className="muse-flow-step trigger">
          <span className="muse-flow-rail" aria-hidden><span className="muse-flow-dot"><Icon d={TRIGGERS[t.trigger].icon} size={14} /></span></span>
          <div className="muse-flow-card trigger">
            <div className="muse-flow-text">
              <span className="muse-flow-kicker">Trigger</span>
              <strong>{run ? 'Started by you' : TRIGGERS[t.trigger].label}</strong>
              {!run && t.trigger !== 'manual' && <span>Starting automatically isn’t built yet. Run it by hand for now.</span>}
            </div>
          </div>
        </li>
        {t.steps.map((s, i) => <StepCard key={i} n={i + 1} step={s} rs={run?.steps[i]} />)}
      </ol>

      {run && status === 'review' && <Review key={run.id} run={run} onDone={setQueued} />}
      {run && (queued || run.postId) && status === 'done' && (
        <p className="muse-notice" role="status">Added to the queue as a {queued?.scheduledAt ? 'planned post' : 'post'}. <Link to={`/content?view=queue&open=${queued?.id || run.postId}`}>Open it in Content</Link></p>
      )}

      {!run && (
        !can.ok
          ? <p className="muse-notice">{can.blocked.map(s => STEP_KINDS[s.kind].label).join(' and ')} steps can’t run yet, so this template is for planning only.</p>
          : missing.length
            ? <div className="muse-notice"><span>{unavailable.length ? `${unavailable.map(a => INTEGRATIONS[a].name).join(', ')} ${unavailable.length === 1 ? 'isn’t' : 'aren’t'} available yet.` : `Connect ${missing.map(a => INTEGRATIONS[a].name).join(' and ')} to run this.`}</span>{!unavailable.length && <Link className="muse-btn muse-btn-tonal" to="/settings?section=connections">Connections</Link>}</div>
            : <Setup t={t} onRun={onRun} />
      )}

      {!run && <RunList runs={myRuns} />}
    </div>
  )
}

export default function Workflows() {
  const { id } = useParams()
  const t = id && TEMPLATES.find(x => x.id === id)
  return t ? <Detail t={t} /> : <Gallery />
}
