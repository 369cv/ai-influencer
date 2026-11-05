import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfluencers, useInspirationBoards } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Page, Seg, Field, Empty, Dialog, Panel, InfluencerSelect, SkillAssist } from '../components/ui'
import { TrackingView } from './Tracking'
import Inspiration from './Inspiration'
import { PROJECT_STATUSES, PROJECT_TEMPLATES, normalizeStatus, stepsFromTemplate, progress } from '../utils/planning'
import { influencerContext } from '../utils/claudeAssist'
import { newId } from '../utils/localJson'

// Plan: one board (Ideas · To do · Doing · Done). Ideas and projects open in a
// side panel. Creators and Inspiration are the other two views. Per workspace.

const VIEWS = [{ id: 'board', label: 'Board' }, { id: 'creators', label: 'Creators' }, { id: 'inspiration', label: 'Inspiration' }]
const tplName = id => PROJECT_TEMPLATES.find(t => t.id === id)?.name || 'Project'
const shortDate = d => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })

export default function Plan() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const view = VIEWS.some(v => v.id === params.get('view')) ? params.get('view') : 'board'
  const [ideas, setIdeas] = useWorkspaceStore('muse_ideas')
  const [projects, setProjects] = useWorkspaceStore('muse_projects')
  const [type, setType] = useState('all')
  const [newProject, setNewProject] = useState(null)
  const [focusCapture, setFocusCapture] = useState(false)
  const open = params.get('open')

  // Home composer → new idea
  useEffect(() => {
    const t = location.state?.newIdea
    if (t) {
      setIdeas(l => [{ id: newId('idea'), title: t.slice(0, 300), notes: '', status: 'inbox', createdAt: Date.now() }, ...l])
      navigate('/plan', { replace: true, state: {} })
    }
  }, [location.state?.newIdea]) // eslint-disable-line

  useEffect(() => {
    const n = params.get('new')
    if (!n) return
    if (n === 'project') setNewProject({})
    if (n === 'idea') setFocusCapture(true)
    setParams(p => { p.delete('new'); p.delete('view'); return p }, { replace: true })
  }, [params]) // eslint-disable-line

  const setView = v => setParams(v === 'board' ? {} : { view: v })
  const openItem = id => setParams(q => { q.set('open', id); return q })
  const closeItem = () => setParams(q => { q.delete('open'); return q })
  const openProject = projects.find(p => p.id === open)
  const openIdea = ideas.find(i => i.id === open)

  return (
    <Page
      title="Plan"
      wide
      actions={<>
        <Seg options={VIEWS} value={view} onChange={setView} label="View" />
        {view === 'board' && <>
          <select className="muse-input muse-input-sm" value={type} onChange={e => setType(e.target.value)} aria-label="Filter by project type">
            <option value="all">All types</option>
            {PROJECT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="button" className="muse-btn muse-btn-filled" onClick={() => setNewProject({})}>New project</button>
        </>}
      </>}
    >
      {view === 'board' && (
        <Board
          ideas={ideas} setIdeas={setIdeas} projects={projects} setProjects={setProjects}
          type={type} onOpen={openItem} focusCapture={focusCapture} onCaptured={() => setFocusCapture(false)}
        />
      )}
      {view === 'creators' && <TrackingView />}
      {view === 'inspiration' && <Inspiration embedded />}

      {openProject && <ProjectPanel project={openProject} setProjects={setProjects} onClose={closeItem} />}
      {openIdea && !openProject && (
        <IdeaPanel
          idea={openIdea} setIdeas={setIdeas} onClose={closeItem}
          onMakeProject={() => setNewProject({ fromIdea: openIdea })}
          onOpenProject={id => openItem(id)}
        />
      )}

      {newProject && (
        <NewProjectDialog
          fromIdea={newProject.fromIdea}
          onClose={() => setNewProject(null)}
          onCreate={p => {
            setProjects(l => [p, ...l])
            if (newProject.fromIdea) setIdeas(l => l.map(i => i.id === newProject.fromIdea.id ? { ...i, status: 'project', projectId: p.id } : i))
            setNewProject(null)
            setParams({ open: p.id })
          }}
        />
      )}
    </Page>
  )
}

function Board({ ideas, setIdeas, projects, setProjects, type, onOpen, focusCapture, onCaptured }) {
  const [influencers] = useInfluencers()
  const [text, setText] = useState('')
  const [brainstorm, setBrainstorm] = useState(false)
  const [dragId, setDragId] = useState(null)
  const inputRef = useRef(null)
  const who = id => (influencers || []).find(i => i.id === id)

  useEffect(() => { if (focusCapture) { inputRef.current?.focus(); onCaptured() } }, [focusCapture]) // eslint-disable-line

  const openIdeas = ideas.filter(i => i.status !== 'archived' && !i.projectId)
  const shown = projects.filter(p => type === 'all' || p.template === type)
  const add = (title, extra = {}) => {
    const t = title.trim()
    if (t) setIdeas(l => [{ id: newId('idea'), title: t.slice(0, 300), notes: '', status: 'inbox', createdAt: Date.now(), ...extra }, ...l])
  }
  const drop = status => {
    if (!dragId) return
    setProjects(l => l.map(p => p.id === dragId ? { ...p, status, updatedAt: Date.now() } : p))
    setDragId(null)
  }

  return (
    <div className="muse-board">
      <section className="muse-board-col" aria-label="Ideas">
        <h3>Ideas <span>{openIdeas.length}</span></h3>
        <form className="muse-board-capture" onSubmit={e => { e.preventDefault(); add(text); setText('') }}>
          <input ref={inputRef} className="muse-input muse-input-sm" value={text} onChange={e => setText(e.target.value)} placeholder="Capture an idea…" aria-label="New idea" />
        </form>
        {openIdeas.map(i => (
          <button key={i.id} type="button" className="muse-panel muse-project-card" onClick={() => onOpen(i.id)}>
            <strong>{i.title}</strong>
            {(who(i.influencerId) || i.images?.length) && <small>{[who(i.influencerId)?.name, i.images?.length && `${i.images.length} image${i.images.length > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}</small>}
          </button>
        ))}
        <button type="button" className="muse-btn muse-btn-text muse-board-more" onClick={() => setBrainstorm(true)}>✦ Brainstorm ideas</button>
      </section>

      {PROJECT_STATUSES.map(col => {
        const items = shown.filter(p => normalizeStatus(p.status) === col.id)
        return (
          <section key={col.id} className={`muse-board-col${dragId ? ' droppable' : ''}`} aria-label={col.label} onDragOver={e => e.preventDefault()} onDrop={() => drop(col.id)}>
            <h3>{col.label} <span>{items.length}</span></h3>
            {items.length === 0 && <p className="muse-board-empty">{col.id === 'todo' ? 'Turn an idea into a project, or start one from New project.' : 'Drag a project here.'}</p>}
            {items.map(p => {
              const next = p.steps?.find(s => !s.done)
              return (
                <button key={p.id} type="button" draggable className="muse-panel muse-project-card" onDragStart={() => setDragId(p.id)} onDragEnd={() => setDragId(null)} onClick={() => onOpen(p.id)}>
                  <strong>{p.name}</strong>
                  <small>{[tplName(p.template), who(p.influencerId)?.name, p.fee && `$${p.fee}`, p.due && `due ${shortDate(p.due)}`].filter(Boolean).join(' · ')}</small>
                  {p.steps?.length > 0 && <span className="muse-progress"><span style={{ width: `${progress(p)}%` }} /></span>}
                  {col.id !== 'done' && <small className="muse-next">{next ? `Next: ${next.label}` : 'All steps done'}</small>}
                </button>
              )
            })}
          </section>
        )
      })}

      {brainstorm && (
        <Dialog title="Brainstorm ideas" sub="Claude runs one of your skills and adds the results to Ideas." onClose={() => setBrainstorm(false)} actions={<button type="button" className="muse-btn muse-btn-tonal" onClick={() => setBrainstorm(false)}>Done</button>}>
          <BrainstormForm onAdd={list => { list.forEach(x => add(x.title, { notes: x.notes, influencerId: x.influencerId })); setBrainstorm(false) }} />
        </Dialog>
      )}
    </div>
  )
}

function BrainstormForm({ onAdd }) {
  const [influencers] = useInfluencers()
  const [influencerId, setInfluencerId] = useState(null)
  const [theme, setTheme] = useState('')
  const inf = (influencers || []).find(i => i.id === influencerId)
  return (
    <>
      <div className="muse-form-grid">
        <Field label="Influencer"><InfluencerSelect value={influencerId} onChange={setInfluencerId} /></Field>
        <Field label="Theme (optional)"><input className="muse-input" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. morning routines" /></Field>
      </div>
      <SkillAssist
        use="ideas"
        label="Brainstorm"
        task={() => `Give content ideas${inf ? ` for ${inf.name}` : ''}.${theme ? ` Theme: ${theme}` : ''}`}
        context={() => influencerContext(inf)}
        onResult={r => onAdd(r.split(/\n(?=\s*(?:\d+[.)]|[-•*])\s)/).map(s => s.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean).slice(0, 12).map(s => ({ title: s.split('\n')[0], notes: s, influencerId })))}
      />
    </>
  )
}

function IdeaPanel({ idea: i, setIdeas, onClose, onMakeProject, onOpenProject }) {
  const update = patch => setIdeas(l => l.map(x => x.id === i.id ? { ...x, ...patch } : x))
  return (
    <Panel title="Idea" onClose={onClose} footer={<>
      <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { setIdeas(l => l.filter(x => x.id !== i.id)); onClose() }}>Delete</button>
      <button type="button" className="muse-btn muse-btn-tonal" onClick={() => { update({ status: 'archived' }); onClose() }}>Archive</button>
    </>}>
      <textarea className="muse-input muse-input-title" rows={2} value={i.title} onChange={e => update({ title: e.target.value })} aria-label="Idea" />
      <Field label="Influencer"><InfluencerSelect value={i.influencerId} onChange={v => update({ influencerId: v })} /></Field>
      <Field label="Notes"><textarea className="muse-input" rows={5} value={i.notes || ''} onChange={e => update({ notes: e.target.value })} placeholder="Hook, format, references…" /></Field>
      <ImageAttach images={i.images || []} onChange={images => update({ images })} />
      <div className="muse-assist-row">
        {i.projectId
          ? <button type="button" className="muse-btn muse-btn-filled" onClick={() => onOpenProject(i.projectId)}>Open project</button>
          : <button type="button" className="muse-btn muse-btn-filled" onClick={onMakeProject}>Make project</button>}
        <Link className="muse-btn muse-btn-tonal" to="/content?compose=1" state={{ prefillCaption: i.title }}>Draft post</Link>
      </div>
    </Panel>
  )
}

// Attach reference images to an idea (upload, or pick from Inspiration boards).
function ImageAttach({ images, onChange }) {
  const fileRef = useRef(null)
  const [boards] = useInspirationBoards()
  const fromBoards = useMemo(() => (boards || []).flatMap(b => (b.images || []).map(x => (typeof x === 'string' ? x : x?.url || x?.src || x?.dataUrl)).filter(Boolean)).slice(0, 40), [boards])
  const [picking, setPicking] = useState(false)
  function upload(e) {
    const files = [...(e.target.files || [])].slice(0, 6)
    e.target.value = ''
    Promise.all(files.map(f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })))
      .then(urls => onChange([...images, ...urls].slice(0, 8)))
  }
  return (
    <Field label="References">
      <div className="muse-media-row">
        {images.map(u => (
          <span key={u.slice(0, 80)} className="muse-thumb lg" style={{ backgroundImage: `url(${u})` }}>
            <button type="button" aria-label="Remove image" onClick={() => onChange(images.filter(x => x !== u))}>✕</button>
          </span>
        ))}
        <button type="button" className="muse-thumb lg muse-thumb-add" onClick={() => fileRef.current?.click()}>Upload</button>
        {fromBoards.length > 0 && <button type="button" className="muse-thumb lg muse-thumb-add" onClick={() => setPicking(v => !v)}>{picking ? 'Close' : 'From Inspiration'}</button>}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={upload} />
      </div>
      {picking && (
        <div className="muse-picker-grid">
          {fromBoards.map(u => {
            const on = images.includes(u)
            return <button key={u.slice(0, 80)} type="button" className={`muse-thumb${on ? ' on' : ''}`} style={{ backgroundImage: `url(${u})` }} aria-pressed={on} onClick={() => onChange(on ? images.filter(x => x !== u) : [...images, u].slice(0, 8))} />
          })}
        </div>
      )}
    </Field>
  )
}

function ProjectPanel({ project: p, setProjects, onClose }) {
  const [influencers] = useInfluencers()
  const [stepText, setStepText] = useState('')
  const [assistFor, setAssistFor] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inf = (influencers || []).find(i => i.id === p.influencerId)
  const update = patch => setProjects(l => l.map(x => x.id === p.id ? { ...x, ...patch, updatedAt: Date.now() } : x))
  const setStep = (id, patch) => update({ steps: p.steps.map(s => s.id === id ? { ...s, ...patch } : s) })
  const pct = progress(p)
  const deal = p.template === 'brand-deal'

  return (
    <Panel
      title={<input className="muse-input muse-input-title" value={p.name} onChange={e => update({ name: e.target.value })} aria-label="Project name" />}
      onClose={onClose}
      footer={confirmDelete
        ? <><span className="muse-muted">Delete this project?</span><button type="button" className="muse-btn muse-btn-tonal" onClick={() => setConfirmDelete(false)}>Keep</button><button type="button" className="muse-btn muse-btn-filled muse-btn-danger" onClick={() => { setProjects(l => l.filter(x => x.id !== p.id)); onClose() }}>Delete</button></>
        : <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setConfirmDelete(true)}>Delete project</button>}
    >
      <div className="muse-form-grid">
        <Field label="Status">
          <select className="muse-input" value={normalizeStatus(p.status)} onChange={e => update({ status: e.target.value })}>
            {PROJECT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Due"><input className="muse-input" type="date" value={p.due || ''} onChange={e => update({ due: e.target.value })} /></Field>
      </div>
      <Field label="Influencer"><InfluencerSelect value={p.influencerId} onChange={v => update({ influencerId: v })} /></Field>
      {deal && (
        <div className="muse-form-grid">
          <Field label="Brand"><input className="muse-input" value={p.brand || ''} onChange={e => update({ brand: e.target.value })} /></Field>
          <Field label="Fee (USD)"><input className="muse-input" inputMode="decimal" value={p.fee || ''} onChange={e => update({ fee: e.target.value.replace(/[^0-9.]/g, '') })} /></Field>
          <Field label="Paid">
            <select className="muse-input" value={p.paid ? 'yes' : 'no'} onChange={e => update({ paid: e.target.value === 'yes' })}><option value="no">Not yet</option><option value="yes">Paid</option></select>
          </Field>
        </div>
      )}
      {deal && <Field label="Deliverables"><input className="muse-input" value={p.deliverables || ''} onChange={e => update({ deliverables: e.target.value })} placeholder="e.g. 1 Reel + 3 Stories" /></Field>}
      <Field label="Brief and notes"><textarea className="muse-input" rows={3} value={p.notes || ''} onChange={e => update({ notes: e.target.value })} placeholder="Goal, audience, references…" /></Field>

      <div className="muse-progress-row"><span className="muse-progress"><span style={{ width: `${pct}%` }} /></span><small>{p.steps.filter(s => s.done).length} of {p.steps.length} steps</small></div>
      <ol className="muse-steps">
        {p.steps.map(s => (
          <li key={s.id} className={s.done ? 'done' : ''}>
            <label className="muse-check">
              <input type="checkbox" checked={!!s.done} onChange={e => setStep(s.id, { done: e.target.checked })} />
              <span>{s.label}</span>
            </label>
            <span className="muse-step-actions">
              {s.assist && <button type="button" className="muse-btn muse-btn-text" onClick={() => setAssistFor(assistFor === s.id ? null : s.id)}>Draft</button>}
              {s.to && <Link className="muse-btn muse-btn-text" to={s.to} state={inf ? { selectId: inf.id } : undefined}>Open</Link>}
              <button type="button" className="muse-btn muse-btn-text muse-step-remove" aria-label={`Remove step ${s.label}`} onClick={() => update({ steps: p.steps.filter(x => x.id !== s.id) })}>✕</button>
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
    </Panel>
  )
}

function NewProjectDialog({ fromIdea, onClose, onCreate }) {
  const [name, setName] = useState(fromIdea?.title?.slice(0, 80) || '')
  const [tpl, setTpl] = useState('content-piece')
  const [influencerId, setInfluencerId] = useState(fromIdea?.influencerId || null)
  const [due, setDue] = useState('')
  const t = PROJECT_TEMPLATES.find(x => x.id === tpl)

  return (
    <Dialog
      title="New project"
      sub="Pick a template. Its steps are a starting point; edit them any time."
      onClose={onClose}
      wide
      actions={<>
        <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Cancel</button>
        <button type="button" className="muse-btn muse-btn-filled" disabled={!name.trim()} onClick={() => onCreate({
          id: newId('prj'), name: name.trim(), template: tpl, status: 'todo', influencerId, due,
          notes: fromIdea?.notes && fromIdea.notes !== fromIdea.title ? fromIdea.notes : '', ideaId: fromIdea?.id || null,
          images: fromIdea?.images || [], steps: stepsFromTemplate(tpl), createdAt: Date.now(),
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
