import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Page, Tabs, Field, Empty, Dialog, InfluencerSelect, SkillAssist } from '../components/ui'
import { IDEA_STATUSES, PROJECT_STATUSES, PROJECT_TEMPLATES, stepsFromTemplate, progress } from '../utils/planning'
import { influencerContext } from '../utils/claudeAssist'
import { newId } from '../utils/localJson'

// Plan: capture ideas, turn them into projects, and work each project through
// its steps. Stored per workspace.

export default function Plan() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tab = params.get('tab') === 'projects' ? 'projects' : 'ideas'
  const [ideas, setIdeas] = useWorkspaceStore('muse_ideas')
  const [projects, setProjects] = useWorkspaceStore('muse_projects')
  const [newProject, setNewProject] = useState(null) // { fromIdea? }
  const openId = params.get('open')

  // Home composer → new idea
  useEffect(() => {
    const t = location.state?.newIdea
    if (t) {
      setIdeas(l => [{ id: newId('idea'), title: t.slice(0, 200), notes: '', status: 'inbox', createdAt: Date.now() }, ...l])
      navigate('/plan', { replace: true, state: {} })
    }
  }, [location.state?.newIdea]) // eslint-disable-line

  useEffect(() => {
    if (params.get('new') === 'project') { setNewProject({}); setParams(p => { p.delete('new'); return p }, { replace: true }) }
  }, [params]) // eslint-disable-line

  const setTab = t => setParams(t === 'ideas' ? {} : { tab: t })
  const open = projects.find(p => p.id === openId)

  return (
    <Page
      title="Plan"
      sub="Ideas, projects and every step from concept to posted."
      actions={<button type="button" className="muse-btn muse-btn-filled" onClick={() => setNewProject({})}>New project</button>}
    >
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'ideas', label: 'Ideas', count: ideas.filter(i => i.status !== 'archived').length },
        { id: 'projects', label: 'Projects', count: projects.filter(p => p.status !== 'done').length },
      ]} />
      <div className="muse-tab-links">
        <Link to="/tracking" className="muse-chip">Tracked creators</Link>
        <Link to="/brand-deals" className="muse-chip">Brand deals</Link>
        <Link to="/inspiration" className="muse-chip">Inspiration boards</Link>
      </div>

      {tab === 'ideas'
        ? <Ideas ideas={ideas} setIdeas={setIdeas} onMakeProject={idea => setNewProject({ fromIdea: idea })} autoFocus={params.get('new') === 'idea'} />
        : open
          ? <ProjectDetail project={open} setProjects={setProjects} onBack={() => setParams({ tab: 'projects' })} />
          : <Projects projects={projects} onOpen={id => setParams({ tab: 'projects', open: id })} onNew={() => setNewProject({})} />}

      {newProject && (
        <NewProjectDialog
          fromIdea={newProject.fromIdea}
          onClose={() => setNewProject(null)}
          onCreate={p => {
            setProjects(l => [p, ...l])
            if (newProject.fromIdea) setIdeas(l => l.map(i => i.id === newProject.fromIdea.id ? { ...i, status: 'project', projectId: p.id } : i))
            setNewProject(null)
            setParams({ tab: 'projects', open: p.id })
          }}
        />
      )}
    </Page>
  )
}

function Ideas({ ideas, setIdeas, onMakeProject, autoFocus }) {
  const [influencers] = useInfluencers()
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('active')
  const [influencerId, setInfluencerId] = useState(null)
  const inf = (influencers || []).find(i => i.id === influencerId)
  const shown = ideas.filter(i => filter === 'active' ? i.status !== 'archived' : i.status === filter)

  const add = (title, extra = {}) => {
    const t = title.trim()
    if (!t) return
    setIdeas(l => [{ id: newId('idea'), title: t.slice(0, 300), notes: '', status: 'inbox', influencerId, createdAt: Date.now(), ...extra }, ...l])
  }
  const update = (id, patch) => setIdeas(l => l.map(i => i.id === id ? { ...i, ...patch } : i))

  return (
    <div className="muse-stack">
      <form className="muse-panel muse-capture" onSubmit={e => { e.preventDefault(); add(text); setText('') }}>
        <input className="muse-input" autoFocus={autoFocus} value={text} onChange={e => setText(e.target.value)} placeholder="Capture an idea, a hook, a trend…" aria-label="New idea" />
        <InfluencerSelect value={influencerId} onChange={setInfluencerId} />
        <button type="submit" className="muse-btn muse-btn-filled" disabled={!text.trim()}>Save idea</button>
      </form>

      <details className="muse-panel muse-details">
        <summary>Brainstorm ideas with a skill</summary>
        <SkillAssist
          use="ideas"
          label="Brainstorm"
          task={() => `Give content ideas${inf ? ` for ${inf.name}` : ''}.${text ? ` Theme: ${text}` : ''}`}
          context={() => influencerContext(inf)}
          onResult={r => r.split(/\n(?=\s*(?:\d+[.)]|[-•*])\s)/).map(s => s.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean).slice(0, 12).forEach(s => add(s.split('\n')[0], { notes: s }))}
        />
      </details>

      <div className="muse-filter-row">
        {[{ id: 'active', label: 'All active' }, ...IDEA_STATUSES].map(s => (
          <button key={s.id} type="button" className={`muse-chip${filter === s.id ? ' on' : ''}`} onClick={() => setFilter(s.id)}>{s.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty title="No ideas here yet">Ideas you capture from Home, the Plan composer or a brainstorm land in the Inbox.</Empty>
      ) : (
        <ul className="muse-idea-grid">
          {shown.map(i => {
            const who = (influencers || []).find(x => x.id === i.influencerId)
            return (
              <li key={i.id} className="muse-panel muse-idea">
                <textarea className="muse-idea-title" value={i.title} onChange={e => update(i.id, { title: e.target.value })} rows={2} aria-label="Idea" />
                {i.notes && i.notes !== i.title && <p className="muse-idea-notes">{i.notes}</p>}
                <div className="muse-idea-meta">
                  {who && <span className="muse-badge">{who.name}</span>}
                  <select className="muse-input muse-input-sm" value={i.status} onChange={e => update(i.id, { status: e.target.value })} aria-label="Status">
                    {IDEA_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="muse-idea-actions">
                  {i.projectId
                    ? <Link className="muse-btn muse-btn-text" to={`/plan?tab=projects&open=${i.projectId}`}>Open project</Link>
                    : <button type="button" className="muse-btn muse-btn-tonal" onClick={() => onMakeProject(i)}>Make project</button>}
                  <Link className="muse-btn muse-btn-text" to="/content?compose=1" state={{ prefillCaption: i.title }}>Draft post</Link>
                  <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setIdeas(l => l.filter(x => x.id !== i.id))} aria-label="Delete idea">Delete</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Projects({ projects, onOpen, onNew }) {
  const [influencers] = useInfluencers()
  if (!projects.length) {
    return <Empty title="No projects yet" action={<button type="button" className="muse-btn muse-btn-filled" onClick={onNew}>New project</button>}>A project holds the steps for one piece of work: a post, a series, a brand deal or a launch.</Empty>
  }
  return (
    <div className="muse-board">
      {PROJECT_STATUSES.map(col => {
        const items = projects.filter(p => (p.status || 'planning') === col.id)
        return (
          <section key={col.id} className="muse-board-col" aria-label={col.label}>
            <h3>{col.label} <span>{items.length}</span></h3>
            {items.map(p => {
              const who = (influencers || []).find(x => x.id === p.influencerId)
              const next = p.steps?.find(s => !s.done)
              return (
                <button key={p.id} type="button" className="muse-panel muse-project-card" onClick={() => onOpen(p.id)}>
                  <strong>{p.name}</strong>
                  <small>{PROJECT_TEMPLATES.find(t => t.id === p.template)?.name || 'Project'}{who ? ` · ${who.name}` : ''}{p.due ? ` · due ${new Date(p.due).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}</small>
                  <span className="muse-progress"><span style={{ width: `${progress(p)}%` }} /></span>
                  <small className="muse-next">{next ? `Next: ${next.label}` : 'All steps done'}</small>
                </button>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}

function ProjectDetail({ project: p, setProjects, onBack }) {
  const [influencers] = useInfluencers()
  const [stepText, setStepText] = useState('')
  const [assistFor, setAssistFor] = useState(null)
  const inf = (influencers || []).find(i => i.id === p.influencerId)
  const update = patch => setProjects(l => l.map(x => x.id === p.id ? { ...x, ...patch, updatedAt: Date.now() } : x))
  const setStep = (id, patch) => update({ steps: p.steps.map(s => s.id === id ? { ...s, ...patch } : s) })
  const pct = progress(p)

  return (
    <div className="muse-stack">
      <button type="button" className="muse-btn muse-btn-text muse-back" onClick={onBack}>← All projects</button>
      <div className="muse-panel muse-project-head">
        <input className="muse-input muse-input-title" value={p.name} onChange={e => update({ name: e.target.value })} aria-label="Project name" />
        <div className="muse-form-grid">
          <Field label="Status">
            <select className="muse-input" value={p.status || 'planning'} onChange={e => update({ status: e.target.value })}>
              {PROJECT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Influencer"><InfluencerSelect value={p.influencerId} onChange={v => update({ influencerId: v })} /></Field>
          <Field label="Due"><input className="muse-input" type="date" value={p.due || ''} onChange={e => update({ due: e.target.value })} /></Field>
        </div>
        <Field label="Brief and notes">
          <textarea className="muse-input" rows={3} value={p.notes || ''} onChange={e => update({ notes: e.target.value })} placeholder="Goal, audience, references, deliverables…" />
        </Field>
        <div className="muse-progress-row"><span className="muse-progress"><span style={{ width: `${pct}%` }} /></span><small>{pct}% · {p.steps.filter(s => s.done).length} of {p.steps.length} steps</small></div>
      </div>

      <div className="muse-panel">
        <h3 className="muse-panel-title">Steps</h3>
        <ol className="muse-steps">
          {p.steps.map((s, idx) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <label className="muse-check">
                <input type="checkbox" checked={!!s.done} onChange={e => setStep(s.id, { done: e.target.checked })} />
                <span>{idx + 1}. {s.label}</span>
              </label>
              <span className="muse-step-actions">
                {s.assist && <button type="button" className="muse-btn muse-btn-text" onClick={() => setAssistFor(assistFor === s.id ? null : s.id)}>Draft</button>}
                {s.to && <Link className="muse-btn muse-btn-text" to={s.to} state={inf ? { selectId: inf.id } : undefined}>Open</Link>}
                <button type="button" className="muse-btn muse-btn-text muse-danger" aria-label={`Remove step ${s.label}`} onClick={() => update({ steps: p.steps.filter(x => x.id !== s.id) })}>✕</button>
              </span>
              {assistFor === s.id && (
                <div className="muse-step-assist">
                  <SkillAssist
                    use={s.assist === 'caption' ? 'caption' : 'ideas'}
                    task={() => `${s.label} for this project: ${p.name}. ${p.notes || ''}`}
                    context={() => influencerContext(inf)}
                    onResult={r => { update({ notes: `${p.notes ? p.notes + '\n\n' : ''}${s.label}:\n${r}` }); setAssistFor(null) }}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
        <form className="muse-assist-row" onSubmit={e => { e.preventDefault(); if (!stepText.trim()) return; update({ steps: [...p.steps, { id: newId('st'), label: stepText.trim(), done: false }] }); setStepText('') }}>
          <input className="muse-input" value={stepText} onChange={e => setStepText(e.target.value)} placeholder="Add a step" aria-label="New step" />
          <button type="submit" className="muse-btn muse-btn-tonal" disabled={!stepText.trim()}>Add</button>
        </form>
      </div>

      <div className="muse-row-end">
        <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { if (confirm(`Delete “${p.name}”?`)) { setProjects(l => l.filter(x => x.id !== p.id)); onBack() } }}>Delete project</button>
      </div>
    </div>
  )
}

function NewProjectDialog({ fromIdea, onClose, onCreate }) {
  const [name, setName] = useState(fromIdea?.title?.slice(0, 80) || '')
  const [tpl, setTpl] = useState('content-piece')
  const [influencerId, setInfluencerId] = useState(fromIdea?.influencerId || null)
  const [due, setDue] = useState('')
  const t = useMemo(() => PROJECT_TEMPLATES.find(x => x.id === tpl), [tpl])

  return (
    <Dialog
      title="New project"
      sub="Pick a template. Its steps are a starting point; edit them any time."
      onClose={onClose}
      wide
      actions={<>
        <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Cancel</button>
        <button type="button" className="muse-btn muse-btn-filled" disabled={!name.trim()} onClick={() => onCreate({
          id: newId('prj'), name: name.trim(), template: tpl, status: 'planning', influencerId, due,
          notes: fromIdea?.notes && fromIdea.notes !== fromIdea.title ? fromIdea.notes : '', ideaId: fromIdea?.id || null,
          steps: stepsFromTemplate(tpl), createdAt: Date.now(),
        })}>Create project</button>
      </>}
    >
      <Field label="Name"><input className="muse-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer GRWM series" /></Field>
      <div className="muse-tile-grid two" role="radiogroup" aria-label="Template">
        {PROJECT_TEMPLATES.map(x => (
          <button key={x.id} type="button" role="radio" aria-checked={tpl === x.id} className={`muse-tile wide${tpl === x.id ? ' on' : ''}`} onClick={() => setTpl(x.id)}>
            <span className="muse-tile-label">{x.name}</span>
            <span className="muse-tile-sub">{x.blurb}</span>
          </button>
        ))}
      </div>
      {t?.steps.length > 0 && <p className="muse-field-hint">{t.steps.length} steps: {t.steps.map(s => s.label).slice(0, 4).join(' → ')}{t.steps.length > 4 ? ' → …' : ''}</p>}
      <div className="muse-form-grid">
        <Field label="Influencer"><InfluencerSelect value={influencerId} onChange={setInfluencerId} /></Field>
        <Field label="Due date"><input className="muse-input" type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
      </div>
    </Dialog>
  )
}
