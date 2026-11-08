import { Link } from 'react-router-dom'
import { useWorkspaceStore } from '../context/workspace'
import { isHFConnected } from '../utils/higgsfieldAuth'

// Home → setup steps for the selected influencer (HeyGen's "Step 3: Finish your avatar").
// Every step is read from real data; the first unfinished one gets the big card.
export function stepsFor(inf, accounts = []) {
  if (!inf) return []
  return [
    { id: 'hf', label: 'Connect Higgsfield', done: isHFConnected(), to: '/settings?section=connections', cta: 'Connect Higgsfield', why: 'Photos and videos use your own Higgsfield account.' },
    { id: 'face', label: 'Main photo', done: !!(inf.mainImage || inf.image), to: '/influencers', state: { selectId: inf.id }, cta: 'Add her main photo', why: 'Every look and video starts from it.' },
    { id: 'element', label: 'Consistent face', done: inf.hfElement?.status === 'completed', to: '/influencers', state: { selectId: inf.id }, cta: 'Turn on consistent face', why: 'Saves her face as a Higgsfield Element so every photo keeps it.' },
    { id: 'voice', label: 'Her voice', done: !!inf.voiceProfile?.voiceId, to: '/influencers', state: { selectId: inf.id }, cta: 'Give her a voice', why: 'Design or pick one for talking videos.' },
    { id: 'sched', label: 'Posting schedule', done: !!inf.postingSchedule, to: '/settings?section=accounts', cta: 'Set her posting schedule', why: 'Empty slots show up in the queue.' },
    { id: 'acct', label: 'Social account', done: accounts.some(a => a.influencerId === inf.id), to: '/settings?section=accounts', cta: 'Link a social account', why: 'So posts know where to go.' },
  ]
}

export default function SetupSteps({ influencer }) {
  const [accounts] = useWorkspaceStore('muse_accounts')
  const steps = stepsFor(influencer, accounts || [])
  const next = steps.findIndex(s => !s.done)
  if (!influencer || next < 0) return null
  const done = steps.filter(s => s.done).slice(-2)
  const n = steps[next]
  const pic = influencer.mainImage || influencer.image
  return (
    <section className="muse-setup" aria-label={`Setting up ${influencer.name || 'this influencer'}`}>
      {done.map(s => (
        <div key={s.id} className="muse-step-done"><span className="muse-step-ok" aria-hidden>✓</span><b>{s.label}</b><small>Step {steps.indexOf(s) + 1} done</small></div>
      ))}
      <div className="muse-step-next">
        <span className="muse-step-av" style={{ backgroundImage: pic ? `url(${pic})` : undefined }} aria-hidden>{!pic && (influencer.name || '?').slice(0, 1)}</span>
        <div className="muse-step-text">
          <span><span className="muse-muted">Step {next + 1} of {steps.length}:</span> <b className="muse-step-name">{n.cta}</b></span>
          <strong>{influencer.name || 'Untitled'}</strong>
          <small className="muse-muted">{n.why}</small>
        </div>
        <Link to={n.to} state={n.state} className="muse-btn muse-btn-filled">{n.cta}</Link>
      </div>
    </section>
  )
}
