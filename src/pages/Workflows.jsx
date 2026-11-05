import { Link, useNavigate, useParams } from 'react-router-dom'
import { TEMPLATES, INTEGRATIONS, STEP_KINDS, TRIGGERS, templateStatus } from '../utils/workflows'

// Workflow template gallery (/workflows) and the trigger → steps view (/workflows/:id).
// UI first: steps whose app isn't connected show a Connect action instead of results.

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)
const AppMark = ({ app }) => <span className="muse-app-mark" title={INTEGRATIONS[app].name}>{INTEGRATIONS[app].mono}</span>

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

function Gallery() {
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
          return (
            <Link key={t.id} to={`/workflows/${t.id}`} className={`muse-template${t.featured ? ' featured' : ''}`}>
              <Chain t={t} />
              <h2>{t.title}</h2>
              <p>{t.blurb}</p>
              <div className="muse-template-foot">
                <span className="muse-app-stack">{st.apps.map(a => <AppMark key={a} app={a} />)}</span>
                <span className={`muse-status${st.ready ? ' ready' : ''}`}>{st.ready ? 'Ready' : `Connect ${st.missing.length}`}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StepCard({ n, step }) {
  const app = INTEGRATIONS[step.app]
  const connected = app.isConnected()
  return (
    <li className="muse-flow-step">
      <span className="muse-flow-rail" aria-hidden><span className="muse-flow-dot">{n}</span></span>
      <div className={`muse-flow-card${connected ? '' : ' needs'}`}>
        <span className="muse-flow-icon"><Icon d={STEP_KINDS[step.kind].icon} /></span>
        <div className="muse-flow-text">
          <span className="muse-flow-kicker">{STEP_KINDS[step.kind].label} · {app.name}</span>
          <strong>{step.title}</strong>
          <span>{step.detail}</span>
        </div>
        {connected
          ? <span className="muse-status ready">Ready</span>
          : app.available
            ? <Link to={app.connectTo} className="muse-btn muse-btn-tonal muse-btn-sm">Connect</Link>
            : <button type="button" className="muse-btn muse-btn-tonal muse-btn-sm" disabled title="This integration isn’t available yet">Connect</button>}
      </div>
    </li>
  )
}

function Detail({ t }) {
  const navigate = useNavigate()
  const st = templateStatus(t)
  const unavailable = st.missing.filter(a => !INTEGRATIONS[a].available)
  return (
    <div className="muse-page muse-flow-page">
      <button type="button" className="muse-btn muse-btn-text muse-back" onClick={() => navigate('/workflows')}>← Workflows</button>
      <header className="muse-page-head">
        <div>
          <h1>{t.title}</h1>
          <p>{t.blurb}</p>
        </div>
      </header>

      <ol className="muse-flow">
        <li className="muse-flow-step trigger">
          <span className="muse-flow-rail" aria-hidden><span className="muse-flow-dot"><Icon d={TRIGGERS[t.trigger].icon} size={14} /></span></span>
          <div className="muse-flow-card trigger">
            <div className="muse-flow-text">
              <span className="muse-flow-kicker">Trigger</span>
              <strong>{TRIGGERS[t.trigger].label}</strong>
            </div>
          </div>
        </li>
        {t.steps.map((s, i) => <StepCard key={i} n={i + 1} step={s} />)}
      </ol>

      <div className="muse-wizard-bar">
        <div className="muse-wizard-bar-inner muse-flow-bar">
          <span className="muse-flow-bar-note">
            {st.ready
              ? 'All apps connected. Running workflows arrives in the next update.'
              : unavailable.length
                ? `${unavailable.map(a => INTEGRATIONS[a].name).join(', ')} ${unavailable.length === 1 ? 'isn’t' : 'aren’t'} available yet.`
                : `Connect ${st.missing.map(a => INTEGRATIONS[a].name).join(' and ')} to run this.`}
          </span>
          <button type="button" className="muse-btn muse-btn-filled" disabled>{st.ready ? 'Run' : `Connect ${st.missing.length} to run`}</button>
        </div>
      </div>
    </div>
  )
}

export default function Workflows() {
  const { id } = useParams()
  const t = id && TEMPLATES.find(x => x.id === id)
  return t ? <Detail t={t} /> : <Gallery />
}
