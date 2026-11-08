import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { readSkills, skillsFor } from '../utils/skills'
import { runSkill, hasClaude } from '../utils/claudeAssist'

// Small shared building blocks for the Plan, Content, Tracking and Settings pages.

export function Page({ title, sub, actions, children, wide }) {
  return (
    <div className="muse-page">
      <div className={`muse-page-inner${wide ? ' wide' : ''}`}>
        <header className="muse-page-head">
          <div>
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="muse-page-actions">{actions}</div>}
        </header>
        {children}
      </div>
    </div>
  )
}

export function Seg({ options, value, onChange, label }) {
  return (
    <div className="muse-seg" role="tablist" aria-label={label}>
      {options.map(o => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Panel({ title, onClose, children, footer }) {
  return (
    <>
      <div className="muse-panel-scrim" onClick={onClose} aria-hidden />
      <aside className="muse-sidepanel" role="dialog" aria-label={title}>
        <div className="muse-sidepanel-head">
          {typeof title === 'string' ? <h3>{title}</h3> : title}
          <button type="button" className="muse-btn muse-btn-text" onClick={onClose} aria-label="Close panel">✕</button>
        </div>
        <div className="muse-sidepanel-body">{children}</div>
        {footer && <div className="muse-sidepanel-foot">{footer}</div>}
      </aside>
    </>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="muse-tabs" role="tablist">
      {tabs.map(t => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}{t.count != null && <span className="muse-tabs-count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="muse-field">
      <span className="muse-field-label">{label}</span>
      {children}
      {hint && <span className="muse-field-hint">{hint}</span>}
    </label>
  )
}

export function Empty({ title, children, action }) {
  return (
    <div className="muse-empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Dialog({ title, sub, onClose, children, actions, wide }) {
  return (
    <div className="muse-sheet-backdrop" onClick={onClose}>
      <div className={`muse-sheet${wide ? ' muse-sheet-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="muse-plan">
          <div className="muse-plan-head">
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <div className="muse-dialog-body">{children}</div>
          {actions && <div className="muse-plan-actions">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

export function InfluencerSelect({ value, onChange, allowNone = true }) {
  const [influencers] = useInfluencers()
  return (
    <select className="muse-input" value={value || ''} onChange={e => onChange(e.target.value || null)}>
      {allowNone && <option value="">No influencer</option>}
      {(influencers || []).map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
    </select>
  )
}

// "Draft with a skill": pick one of your skills, Claude runs it, you insert the result.
export function SkillAssist({ use, task, context, onResult, label = 'Draft with a skill' }) {
  const skills = skillsFor(use, readSkills())
  const [skillId, setSkillId] = useState(skills[0]?.id || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  if (!hasClaude()) {
    return (
      <div className="muse-assist muse-assist-off">
        <span>Add your Anthropic key to draft with your skills.</span>
        <Link to="/settings?section=connections" className="muse-text-btn">Connect</Link>
      </div>
    )
  }

  async function run() {
    setBusy(true); setError(''); setResult('')
    try {
      const skill = skills.find(s => s.id === skillId)
      setResult(await runSkill({ skill, task: typeof task === 'function' ? task() : task, context: typeof context === 'function' ? context() : context }))
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="muse-assist">
      <div className="muse-assist-row">
        <select className="muse-input" value={skillId} onChange={e => setSkillId(e.target.value)} aria-label="Skill">
          {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="button" className="muse-btn muse-btn-tonal" onClick={run} disabled={busy || !skillId}>{busy ? 'Drafting…' : label}</button>
      </div>
      {error && <p className="muse-error">{error}</p>}
      {result && (
        <div className="muse-assist-result">
          <pre>{result}</pre>
          <div className="muse-assist-row">
            <button type="button" className="muse-btn muse-btn-filled" onClick={() => { onResult(result); setResult('') }}>Use this</button>
            <button type="button" className="muse-btn muse-btn-text" onClick={() => setResult('')}>Discard</button>
          </div>
        </div>
      )}
      <Link to="/settings?section=skills" className="muse-assist-manage">Manage skills</Link>
    </div>
  )
}
