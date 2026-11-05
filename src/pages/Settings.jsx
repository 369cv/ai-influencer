import { useState, useEffect, useRef } from 'react'
import SocialAccounts from '../components/SocialAccounts'
import { useLocation, useSearchParams } from 'react-router-dom'
import { startHiggsfieldOAuthPopup, disconnectHF, isHFConnected } from '../utils/higgsfieldAuth'
import { useWorkspace } from '../context/workspace'
import { useLocalJSON, newId } from '../utils/localJson'
import {
  CLAUDE_KEY, API_KEYS_KEY, MCP_KEY, PUBLISHING_KEY,
  API_SERVICES, PUBLISHING_PROVIDERS, isPublishingConnected, mask,
} from '../utils/connections'
import { testPublishing } from '../utils/publishing'
import { SKILLS_KEY, BUILTIN_SKILLS, readSkills, parseSkillMarkdown, skillToMarkdown } from '../utils/skills'
import { Page, Field, Dialog } from '../components/ui'

// Settings: Workspace · Connections (Higgsfield, Claude, posting, your own API keys,
// MCP servers) · Skills. Connections are optional and live here, not in onboarding.

const SECTIONS = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'connections', label: 'Connections' },
  { id: 'accounts', label: 'Social accounts' },
  { id: 'skills', label: 'Skills' },
]

function Section({ id, title, sub, children }) {
  return (
    <section id={`settings-${id}`} className="muse-settings-section">
      <div className="muse-settings-head">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </section>
  )
}

function Row({ title, sub, status, children }) {
  return (
    <div className="muse-settings-row">
      <div className="muse-list-main">
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
      </div>
      {status}
      <div className="muse-settings-row-actions">{children}</div>
    </div>
  )
}

const Status = ({ on, label }) => <span className={`muse-badge ${on ? 'posted' : 'draft'}`}>{label || (on ? 'Connected' : 'Not connected')}</span>

export default function Settings() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const section = SECTIONS.some(x => x.id === params.get('section')) ? params.get('section') : 'connections'

  return (
    <Page title="Settings">
      <div className="muse-settings">
        <nav className="muse-subnav" aria-label="Settings sections">
          {SECTIONS.map(x => (
            <button key={x.id} type="button" className={section === x.id ? 'on' : ''} aria-current={section === x.id ? 'page' : undefined} onClick={() => setParams({ section: x.id })}>{x.label}</button>
          ))}
        </nav>
        <div className="muse-settings-body">
          {section === 'workspace' && <WorkspaceSection />}
          {section === 'connections' && <ConnectionsSection connectedParam={new URLSearchParams(location.search).get('connected') === '1'} />}
          {section === 'accounts' && <Section id="accounts" title="Social accounts" sub="Where each influencer posts, per workspace."><SocialAccounts /></Section>}
          {section === 'skills' && <SkillsSection />}
        </div>
      </div>
    </Page>
  )
}

function WorkspaceSection() {
  const { workspaces, active, setActiveId, addWorkspace, renameWorkspace, removeWorkspace } = useWorkspace()
  const [name, setName] = useState('')
  return (
    <Section id="workspace" title="Workspace" sub="One workspace per brand or client. Plans, posts, social accounts and tracked creators are kept per workspace; influencers and the Library are shared.">
      {workspaces.map(w => (
        <Row key={w.id} title={<input className="muse-input muse-input-inline" value={w.name} onChange={e => renameWorkspace(w.id, e.target.value)} aria-label="Workspace name" />} status={w.id === active.id ? <Status on label="Active" /> : null}>
          {w.id !== active.id && <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setActiveId(w.id)}>Switch</button>}
          {workspaces.length > 1 && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { if (confirm(`Remove workspace “${w.name}”? Its plans and posts stay in this browser but won’t be shown.`)) removeWorkspace(w.id) }}>Remove</button>}
        </Row>
      ))}
      <form className="muse-assist-row" onSubmit={e => { e.preventDefault(); if (name.trim()) { addWorkspace(name); setName('') } }}>
        <input className="muse-input" value={name} onChange={e => setName(e.target.value)} placeholder="New workspace name, e.g. a client brand" aria-label="New workspace name" />
        <button type="submit" className="muse-btn muse-btn-tonal" disabled={!name.trim()}>Add workspace</button>
      </form>
    </Section>
  )
}

function SecretInput({ placeholder, onSave, cta = 'Save' }) {
  const [v, setV] = useState('')
  return (
    <form className="muse-assist-row" onSubmit={e => { e.preventDefault(); if (v.trim()) { onSave(v.trim()); setV('') } }}>
      <input className="muse-input mono" type="password" autoComplete="off" value={v} onChange={e => setV(e.target.value)} placeholder={placeholder} />
      <button type="submit" className="muse-btn muse-btn-filled" disabled={!v.trim()}>{cta}</button>
    </form>
  )
}

function ConnectionsSection({ connectedParam }) {
  const [hf, setHf] = useState(isHFConnected)
  const [hfBusy, setHfBusy] = useState(false)
  const [claudeKey, setClaudeKey] = useState(() => { try { return localStorage.getItem(CLAUDE_KEY) || '' } catch { return '' } })
  const [pub, setPub] = useLocalJSON(PUBLISHING_KEY, { provider: '' })
  const [keys, setKeys] = useLocalJSON(API_KEYS_KEY, [])
  const [mcps, setMcps] = useLocalJSON(MCP_KEY, [])
  const [pubTest, setPubTest] = useState('')
  const [keyDraft, setKeyDraft] = useState(null)
  const [mcpDraft, setMcpDraft] = useState(null)

  useEffect(() => { if (connectedParam) setHf(true) }, [connectedParam])

  async function connectHF() {
    setHfBusy(true)
    try { await startHiggsfieldOAuthPopup(); setHf(true) }
    catch (e) { if (e.message !== 'cancelled') alert('Failed to connect Higgsfield: ' + e.message) }
    finally { setHfBusy(false) }
  }
  const saveClaude = k => { localStorage.setItem(CLAUDE_KEY, k); setClaudeKey(k) }

  async function runPubTest() {
    setPubTest('Testing…')
    try {
      const r = await testPublishing()
      setPubTest(r.accounts?.length ? `Works. Linked: ${r.accounts.join(', ')}` : 'Works.')
    } catch (e) { setPubTest(e.message) }
  }

  return (
    <Section id="connections" title="Connections" sub="Everything here is optional and stays in this browser. Keys go only to the service they belong to.">
      <h3 className="muse-group-title">Generation</h3>
      <Row title="Higgsfield" sub="Photos and videos with your own Higgsfield credits." status={<Status on={hf} />}>
        {hf
          ? <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { if (confirm('Disconnect your Higgsfield account?')) { disconnectHF(); setHf(false) } }}>Disconnect</button>
          : <button type="button" className="muse-btn muse-btn-filled" onClick={connectHF} disabled={hfBusy}>{hfBusy ? 'Connecting…' : 'Connect'}</button>}
      </Row>
      <Row title="Claude (Anthropic)" sub={claudeKey ? `Key ${mask(claudeKey)}. Smarter prompts, skills, captions and brainstorms.` : 'Smarter prompts, skills, captions and brainstorms.'} status={<Status on={!!claudeKey} />}>
        {claudeKey && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { localStorage.removeItem(CLAUDE_KEY); setClaudeKey('') }}>Remove</button>}
      </Row>
      {!claudeKey && <SecretInput placeholder="sk-ant-…" onSave={saveClaude} />}

      <h3 className="muse-group-title">Posting</h3>
      <Row title="Posting service" sub="Bring your own posting API. It does the posting and scheduling; Muse Studio keeps the queue." status={<Status on={isPublishingConnected(pub)} />}>
        <select className="muse-input" value={pub.provider || ''} onChange={e => setPub({ ...pub, provider: e.target.value })} aria-label="Posting provider">
          <option value="">None</option>
          {PUBLISHING_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Row>
      {pub.provider && (
        <div className="muse-subpanel">
          <p className="muse-muted">{PUBLISHING_PROVIDERS.find(p => p.id === pub.provider)?.blurb} <a href={PUBLISHING_PROVIDERS.find(p => p.id === pub.provider)?.docs} target="_blank" rel="noopener noreferrer">Docs</a></p>
          {pub.provider === 'ayrshare' && (
            <>
              {pub.apiKey
                ? <Row title="API key" sub={mask(pub.apiKey)}><button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setPub({ ...pub, apiKey: '' })}>Remove</button></Row>
                : <SecretInput placeholder="Ayrshare API key" onSave={k => setPub({ ...pub, apiKey: k })} />}
              <Field label="Default profile key" hint="Optional (Business plan). Accounts can also set their own.">
                <input className="muse-input mono" type="password" autoComplete="off" value={pub.profileKey || ''} onChange={e => setPub({ ...pub, profileKey: e.target.value })} />
              </Field>
            </>
          )}
          {pub.provider === 'webhook' && (
            <>
              <Field label="Webhook URL" hint="A public https URL from Zapier (Catch Hook), Make (Custom webhook) or n8n (Webhook node).">
                <input className="muse-input mono" value={pub.webhookUrl || ''} onChange={e => setPub({ ...pub, webhookUrl: e.target.value.trim() })} placeholder="https://hooks.zapier.com/…" />
              </Field>
              <Field label="Signing secret" hint="Optional. Each request carries X-Muse-Signature: sha256=HMAC(body).">
                <input className="muse-input mono" type="password" autoComplete="off" value={pub.webhookSecret || ''} onChange={e => setPub({ ...pub, webhookSecret: e.target.value })} />
              </Field>
            </>
          )}
          <div className="muse-assist-row">
            <button type="button" className="muse-btn muse-btn-tonal" onClick={runPubTest} disabled={!isPublishingConnected(pub)}>Test connection</button>
            {pubTest && <span className="muse-muted">{pubTest}</span>}
          </div>
        </div>
      )}

      <h3 className="muse-group-title">Your API keys</h3>
      <p className="muse-muted">Bring your own key for other AI services. Saved keys are available to skills, workflows and future integrations.</p>
      {keys.map(k => (
        <Row key={k.id} title={k.label || API_SERVICES.find(s => s.id === k.service)?.name} sub={`${API_SERVICES.find(s => s.id === k.service)?.name || k.service} · ${mask(k.key)}`} status={<Status on />}>
          <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setKeys(l => l.filter(x => x.id !== k.id))}>Remove</button>
        </Row>
      ))}
      <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setKeyDraft({ service: 'openai' })}>Add API key</button>

      <h3 className="muse-group-title">MCP servers</h3>
      <p className="muse-muted">Add remote MCP servers (connector URLs) you use, e.g. your own tools or a community knowledge server. Muse Studio’s own MCP server is at <code>/api/mcp</code>.</p>
      {mcps.map(m => (
        <Row key={m.id} title={m.name} sub={`${m.url}${m.token ? ` · token ${mask(m.token)}` : ''}`} status={<Status on={m.enabled !== false} label={m.enabled !== false ? 'On' : 'Off'} />}>
          <button type="button" className="muse-btn muse-btn-text" onClick={() => setMcps(l => l.map(x => x.id === m.id ? { ...x, enabled: x.enabled === false } : x))}>{m.enabled === false ? 'Turn on' : 'Turn off'}</button>
          <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setMcps(l => l.filter(x => x.id !== m.id))}>Remove</button>
        </Row>
      ))}
      <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setMcpDraft({})}>Add MCP server</button>

      {keyDraft && (
        <Dialog title="Add API key" onClose={() => setKeyDraft(null)} actions={<>
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setKeyDraft(null)}>Cancel</button>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!keyDraft.key?.trim()} onClick={() => { setKeys(l => [...l, { id: newId('key'), service: keyDraft.service, label: keyDraft.label?.trim() || '', key: keyDraft.key.trim(), addedAt: Date.now() }]); setKeyDraft(null) }}>Save</button>
        </>}>
          <Field label="Service">
            <select className="muse-input" value={keyDraft.service} onChange={e => setKeyDraft({ ...keyDraft, service: e.target.value })}>
              {API_SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} · {s.hint}</option>)}
            </select>
          </Field>
          <Field label="Label" hint="Optional, e.g. “Client A ElevenLabs”."><input className="muse-input" value={keyDraft.label || ''} onChange={e => setKeyDraft({ ...keyDraft, label: e.target.value })} /></Field>
          <Field label="API key"><input className="muse-input mono" type="password" autoComplete="off" autoFocus value={keyDraft.key || ''} onChange={e => setKeyDraft({ ...keyDraft, key: e.target.value })} /></Field>
        </Dialog>
      )}
      {mcpDraft && (
        <Dialog title="Add MCP server" sub="Remote MCP over HTTPS (Streamable HTTP)." onClose={() => setMcpDraft(null)} actions={<>
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setMcpDraft(null)}>Cancel</button>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!mcpDraft.name?.trim() || !/^https:\/\//i.test(mcpDraft.url || '')} onClick={() => { setMcps(l => [...l, { id: newId('mcp'), name: mcpDraft.name.trim(), url: mcpDraft.url.trim(), token: mcpDraft.token?.trim() || '', enabled: true, addedAt: Date.now() }]); setMcpDraft(null) }}>Save</button>
        </>}>
          <Field label="Name"><input className="muse-input" autoFocus value={mcpDraft.name || ''} onChange={e => setMcpDraft({ ...mcpDraft, name: e.target.value })} placeholder="e.g. Notion, Community knowledge" /></Field>
          <Field label="Server URL"><input className="muse-input mono" value={mcpDraft.url || ''} onChange={e => setMcpDraft({ ...mcpDraft, url: e.target.value })} placeholder="https://example.com/mcp" /></Field>
          <Field label="Bearer token" hint="Optional. Sent as Authorization: Bearer …"><input className="muse-input mono" type="password" autoComplete="off" value={mcpDraft.token || ''} onChange={e => setMcpDraft({ ...mcpDraft, token: e.target.value })} /></Field>
        </Dialog>
      )}
    </Section>
  )
}

function SkillsSection() {
  const [mine, setMine] = useLocalJSON(SKILLS_KEY, [])
  const [editing, setEditing] = useState(null)
  const fileRef = useRef(null)
  const all = readSkills()
  void mine // re-render when skills change

  const upsert = s => setMine(l => l.some(x => x.id === s.id) ? l.map(x => x.id === s.id ? s : x) : [...l, s])

  async function importFiles(files) {
    const added = []
    for (const f of files) {
      const text = await f.text()
      const parsed = parseSkillMarkdown(text, f.name.replace(/\.(md|markdown|txt)$/i, ''))
      if (parsed.instructions) added.push({ id: newId('skill'), ...parsed, enabled: true, uses: [], source: f.name, addedAt: Date.now() })
    }
    if (added.length) setMine(l => [...l, ...added])
  }

  function download(s) {
    const blob = new Blob([skillToMarkdown(s)], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${s.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'skill'}.md`
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <Section id="skills" title="Skills" sub="Your own instructions for content work: hooks, scripts, captions, prompts. Claude follows the skill you pick in Plan and Content. Import SKILL.md files or write one here.">
      {all.map(s => (
        <Row key={s.id} title={s.name} sub={[s.description, s.builtin ? 'Built in' : s.source && `Imported from ${s.source}`, s.uses?.length ? `Used for ${s.uses.join(', ')}` : 'Used everywhere'].filter(Boolean).join(' · ')} status={<Status on={s.enabled !== false} label={s.enabled !== false ? 'On' : 'Off'} />}>
          {s.builtin
            ? <button type="button" className="muse-btn muse-btn-text" onClick={() => setEditing({ ...s, id: newId('skill'), builtin: false, basedOn: s.id, name: s.name })}>Customize</button>
            : <>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => upsert({ ...s, enabled: s.enabled === false })}>{s.enabled === false ? 'Turn on' : 'Turn off'}</button>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => setEditing(s)}>Edit</button>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => download(s)}>Export</button>
                <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setMine(l => l.filter(x => x.id !== s.id))}>{s.basedOn ? 'Reset' : 'Delete'}</button>
              </>}
        </Row>
      ))}
      <div className="muse-assist-row">
        <button type="button" className="muse-btn muse-btn-filled" onClick={() => setEditing({ id: newId('skill'), name: '', description: '', instructions: '', enabled: true, uses: [] })}>New skill</button>
        <button type="button" className="muse-btn muse-btn-tonal" onClick={() => fileRef.current?.click()}>Import .md files</button>
        <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" multiple hidden onChange={e => { importFiles([...e.target.files]); e.target.value = '' }} />
      </div>
      <p className="muse-field-hint">{BUILTIN_SKILLS.length} built-in skills stay available; customizing one saves your copy in its place.</p>

      {editing && (
        <Dialog title={editing.name ? `Edit “${editing.name}”` : 'New skill'} onClose={() => setEditing(null)} wide actions={<>
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setEditing(null)}>Cancel</button>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!editing.name?.trim() || !editing.instructions?.trim()} onClick={() => { upsert({ ...editing, name: editing.name.trim(), updatedAt: Date.now() }); setEditing(null) }}>Save skill</button>
        </>}>
          <Field label="Name"><input className="muse-input" autoFocus value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Reality-scene script writer" /></Field>
          <Field label="Description" hint="When should this skill be used?"><input className="muse-input" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field>
          <Field label="Use it for">
            <div className="muse-chip-row">
              {[{ id: 'ideas', label: 'Ideas & planning' }, { id: 'caption', label: 'Captions & copy' }].map(u => {
                const on = editing.uses?.includes(u.id)
                return <button key={u.id} type="button" aria-pressed={on} className={`muse-chip${on ? ' on' : ''}`} onClick={() => setEditing({ ...editing, uses: on ? editing.uses.filter(x => x !== u.id) : [...(editing.uses || []), u.id] })}>{u.label}</button>
              })}
            </div>
          </Field>
          <Field label="Instructions" hint="Markdown. This becomes Claude’s instructions when the skill runs.">
            <textarea className="muse-input mono" rows={12} value={editing.instructions} onChange={e => setEditing({ ...editing, instructions: e.target.value })} />
          </Field>
        </Dialog>
      )}
    </Section>
  )
}
