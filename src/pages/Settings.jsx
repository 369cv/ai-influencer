import { useState, useEffect, useRef } from 'react'
import SocialAccounts from '../components/SocialAccounts'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { startHiggsfieldOAuthPopup, disconnectHF, isHFConnected } from '../utils/higgsfieldAuth'
import { useWorkspace } from '../context/workspace'
import { useLocalJSON, newId } from '../utils/localJson'
import {
  CLAUDE_KEY, API_KEYS_KEY, MCP_KEY, PUBLISHING_KEY,
  API_SERVICES, isPublishingConnected, mask,
} from '../utils/connections'
import { CATEGORIES, CONNECTORS, PLATFORM_LOGOS, STATUS_LABEL } from '../utils/connectors'
import { LOGOS } from '../utils/connectorLogos'
import ConnectorLogo from '../components/ConnectorLogo'
import { testPublishing } from '../utils/publishing'
import { SKILLS_KEY, BUILTIN_SKILLS, readSkills, parseSkillMarkdown, skillToMarkdown } from '../utils/skills'
import { Page, Field, Dialog, Seg } from '../components/ui'

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

const STATUS_CLASS = { connected: 'posted', saved: 'scheduled', off: 'draft', soon: 'draft' }
const ConnStatus = ({ s }) => <span className={`muse-badge ${STATUS_CLASS[s]}`}>{STATUS_LABEL[s]}</span>

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
  const [q, setQ] = useState('')
  const [view, setView] = useState('all')
  const [openId, setOpenId] = useState(null)

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

  // Status from this component's state so cards update the moment something changes.
  const status = c => {
    switch (c.auth) {
      case 'oauth': return hf ? 'connected' : 'off'
      case 'claude': return claudeKey ? 'connected' : 'off'
      case 'key': return keys.some(k => k.service === c.service && k.key) ? (c.live ? 'connected' : 'saved') : 'off'
      case 'posting': return pub.provider === c.provider && isPublishingConnected(pub) ? 'connected' : 'off'
      case 'mcp': return mcps.some(m => m.url === c.mcpUrl) ? 'saved' : 'off'
      default: return 'soon'
    }
  }
  const presetUrls = CONNECTORS.filter(c => c.mcpUrl).map(c => c.mcpUrl)
  const catalogServices = CONNECTORS.filter(c => c.service).map(c => c.service)
  const otherKeys = keys.filter(k => !catalogServices.includes(k.service))
  const otherMcps = mcps.filter(m => !presetUrls.includes(m.url))
  const term = q.trim().toLowerCase()
  const matches = c => (!term || `${c.name} ${c.by || ''} ${c.use} ${CATEGORIES.find(x => x.id === c.category)?.label}`.toLowerCase().includes(term))
    && (view === 'all' || ['connected', 'saved'].includes(status(c)))
  const connectedCount = CONNECTORS.filter(c => ['connected', 'saved'].includes(status(c))).length + otherKeys.length + otherMcps.length
  const featured = CONNECTORS.filter(c => c.featured)
  const open = CONNECTORS.find(c => c.id === openId)

  const card = c => (
    <button key={c.id} type="button" className="muse-conn-card" onClick={() => setOpenId(c.id)} aria-label={`${c.name}, ${STATUS_LABEL[status(c)]}`}>
      <ConnectorLogo c={c} />
      <span className="muse-conn-text">
        <strong>{c.name}</strong>
        <small>{c.use}</small>
        <ConnStatus s={status(c)} />
      </span>
    </button>
  )

  return (
    <Section id="connections" title="Connections" sub="Everything here is optional and stays in this browser. Keys go only to the service they belong to.">
      <div className="muse-conn-toolbar">
        <input className="muse-input muse-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search connectors" aria-label="Search connectors" />
        <Seg options={[{ id: 'all', label: 'All' }, { id: 'connected', label: `Connected · ${connectedCount}` }]} value={view} onChange={setView} label="Show" />
      </div>

      {view === 'all' && !term && (
        <>
          <h3 className="muse-group-title">Featured</h3>
          <div className="muse-conn-featured">
            {featured.map(c => (
              <button key={c.id} type="button" className="muse-conn-feature" onClick={() => setOpenId(c.id)} aria-label={`${c.name}, ${STATUS_LABEL[status(c)]}`}>
                <ConnectorLogo c={c} size={48} />
                <strong>{c.name}</strong>
                <small>{c.use}</small>
                <ConnStatus s={status(c)} />
              </button>
            ))}
          </div>
        </>
      )}

      {CATEGORIES.map(cat => {
        const list = CONNECTORS.filter(c => c.category === cat.id && matches(c))
        if (!list.length) return null
        return (
          <section key={cat.id} className="muse-conn-cat" aria-labelledby={`conn-${cat.id}`}>
            <h3 className="muse-group-title" id={`conn-${cat.id}`}>{cat.label}</h3>
            <p className="muse-muted muse-conn-cat-sub">{cat.sub}</p>
            <div className="muse-conn-grid">{list.map(card)}</div>
            {cat.id === 'publish' && (
              <div className="muse-conn-platforms">
                <span className="muse-muted">Posts reach</span>
                {PLATFORM_LOGOS.map(p => <span key={p} title={LOGOS[p]?.title}><ConnectorLogo slug={p} size={28} /></span>)}
                <span className="muse-muted">through your posting service. <Link to="/settings?section=accounts">Social accounts</Link></span>
              </div>
            )}
          </section>
        )
      })}

      {(view === 'all' || otherKeys.length || otherMcps.length) && !term && (
        <section className="muse-conn-cat" aria-labelledby="conn-custom">
          <h3 className="muse-group-title" id="conn-custom">Custom</h3>
          <p className="muse-muted muse-conn-cat-sub">Anything not listed: your own keys and remote MCP servers. Saved for skills and workflows.</p>
          <div className="muse-conn-grid">
            <button type="button" className="muse-conn-card" onClick={() => setOpenId('custom-keys')}>
              <ConnectorLogo c={{ name: 'Key', mono: '⌘', color: 'var(--accent)' }} />
              <span className="muse-conn-text"><strong>Other API keys</strong><small>{otherKeys.length ? `${otherKeys.length} saved` : 'Any service with an API key.'}</small><ConnStatus s={otherKeys.length ? 'saved' : 'off'} /></span>
            </button>
            <button type="button" className="muse-conn-card" onClick={() => setOpenId('custom-mcp')}>
              <ConnectorLogo c={{ name: 'MCP', mono: '⇄', color: 'var(--accent)' }} />
              <span className="muse-conn-text"><strong>MCP servers</strong><small>{otherMcps.length ? `${otherMcps.length} saved` : 'Remote tools over MCP (HTTPS).'}</small><ConnStatus s={otherMcps.length ? 'saved' : 'off'} /></span>
            </button>
            {view === 'all' && (
              <div className="muse-conn-card is-static">
                <ConnectorLogo c={{ name: 'Muse', image: '/icon.svg' }} />
                <span className="muse-conn-text"><strong>Use Muse from other AI apps</strong><small>Muse Studio’s own MCP server, for Claude, ChatGPT and Cursor. Built in a separate update, not live yet.</small><ConnStatus s="soon" /></span>
              </div>
            )}
          </div>
        </section>
      )}

      {view === 'connected' && connectedCount === 0 && <p className="muse-muted">Nothing connected yet. Start with Higgsfield for photos and video, or Claude for captions and ideas.</p>}
      {term && !CONNECTORS.some(matches) && <p className="muse-muted">No connectors match “{q}”. Add it as a custom API key or MCP server.</p>}

      {open && (
        <Dialog title={open.name} sub={open.use} onClose={() => { setOpenId(null); setPubTest('') }} actions={<button type="button" className="muse-btn muse-btn-tonal" onClick={() => { setOpenId(null); setPubTest('') }}>Done</button>}>
          <div className="muse-conn-sheet-head">
            <ConnectorLogo c={open} size={48} />
            <ConnStatus s={status(open)} />
            {open.docs && <a href={open.docs} target="_blank" rel="noopener noreferrer" className="muse-text-btn">{open.auth === 'posting' || open.auth === 'mcp' ? 'Docs ↗' : 'Get a key ↗'}</a>}
          </div>
          {open.usedBy?.length > 0 && (
            <div className="muse-chip-row" aria-label="Used by">
              <span className="muse-muted">Used by</span>
              {open.usedBy.map(u => <a key={u.label} href={u.to} className="muse-pchip">{u.label}</a>)}
            </div>
          )}

          {open.auth === 'oauth' && (hf
            ? <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { if (confirm('Disconnect your Higgsfield account?')) { disconnectHF(); setHf(false) } }}>Disconnect</button>
            : <button type="button" className="muse-btn muse-btn-filled" onClick={connectHF} disabled={hfBusy}>{hfBusy ? 'Connecting…' : 'Connect Higgsfield'}</button>)}

          {open.auth === 'claude' && (claudeKey
            ? <Row title="API key" sub={mask(claudeKey)}><button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { localStorage.removeItem(CLAUDE_KEY); setClaudeKey('') }}>Remove</button></Row>
            : <SecretInput placeholder={open.keyHint} onSave={saveClaude} />)}

          {open.auth === 'key' && (
            <>
              {keys.filter(k => k.service === open.service).map(k => (
                <Row key={k.id} title={k.label || 'API key'} sub={mask(k.key)}>
                  <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setKeys(l => l.filter(x => x.id !== k.id))}>Remove</button>
                </Row>
              ))}
              <SecretInput placeholder={`${open.name} API key`} cta={keys.some(k => k.service === open.service) ? 'Add another' : 'Save'}
                onSave={v => setKeys(l => [...l, { id: newId('key'), service: open.service, label: '', key: v, addedAt: Date.now() }])} />
            </>
          )}

          {open.auth === 'posting' && (
            <>
              {pub.provider && pub.provider !== open.provider && <p className="muse-muted">You’re posting through {CONNECTORS.find(c => c.provider === pub.provider)?.name}. Saving here switches to {open.name}.</p>}
              {open.provider === 'ayrshare' && (
                <>
                  {pub.provider === 'ayrshare' && pub.apiKey
                    ? <Row title="API key" sub={mask(pub.apiKey)}><button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setPub({ ...pub, apiKey: '' })}>Remove</button></Row>
                    : <SecretInput placeholder="Ayrshare API key" onSave={k => setPub({ ...pub, provider: 'ayrshare', apiKey: k })} />}
                  {pub.provider === 'ayrshare' && (
                    <Field label="Default profile key" hint="Optional (Business plan). Accounts can also set their own.">
                      <input className="muse-input mono" type="password" autoComplete="off" value={pub.profileKey || ''} onChange={e => setPub({ ...pub, profileKey: e.target.value })} />
                    </Field>
                  )}
                </>
              )}
              {open.provider === 'webhook' && (
                <>
                  <Field label="Webhook URL" hint="A public https URL from Zapier (Catch Hook), Make (Custom webhook) or n8n (Webhook node).">
                    <input className="muse-input mono" value={pub.provider === 'webhook' ? pub.webhookUrl || '' : ''} onChange={e => setPub({ ...pub, provider: 'webhook', webhookUrl: e.target.value.trim() })} placeholder="https://hooks.zapier.com/…" />
                  </Field>
                  <Field label="Signing secret" hint="Optional. Each request carries X-Muse-Signature: sha256=HMAC(body).">
                    <input className="muse-input mono" type="password" autoComplete="off" value={pub.provider === 'webhook' ? pub.webhookSecret || '' : ''} onChange={e => setPub({ ...pub, provider: 'webhook', webhookSecret: e.target.value })} />
                  </Field>
                </>
              )}
              {pub.provider === open.provider && (
                <div className="muse-assist-row">
                  <button type="button" className="muse-btn muse-btn-tonal" onClick={runPubTest} disabled={!isPublishingConnected(pub)}>Test connection</button>
                  <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { setPub({ provider: '' }); setPubTest('') }}>Disconnect</button>
                  {pubTest && <span className="muse-muted">{pubTest}</span>}
                </div>
              )}
            </>
          )}

          {open.auth === 'mcp' && (() => {
            const saved = mcps.find(m => m.url === open.mcpUrl)
            return saved
              ? <Row title="MCP server" sub={`${saved.url}${saved.token ? ` · token ${mask(saved.token)}` : ''}`} status={<Status on={saved.enabled !== false} label={saved.enabled !== false ? 'On' : 'Off'} />}>
                  <button type="button" className="muse-btn muse-btn-text" onClick={() => setMcps(l => l.map(x => x.id === saved.id ? { ...x, enabled: x.enabled === false } : x))}>{saved.enabled === false ? 'Turn on' : 'Turn off'}</button>
                  <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setMcps(l => l.filter(x => x.id !== saved.id))}>Remove</button>
                </Row>
              : <>
                  <p className="muse-muted mono">{open.mcpUrl}</p>
                  <button type="button" className="muse-btn muse-btn-filled" onClick={() => setMcps(l => [...l, { id: newId('mcp'), name: open.name, url: open.mcpUrl, token: '', enabled: true, addedAt: Date.now() }])}>Save MCP server</button>
                </>
          })()}

          {open.auth === 'soon' && <p className="muse-muted">Not built yet. It’s listed so you can see where Muse Studio is heading.</p>}
        </Dialog>
      )}

      {openId === 'custom-keys' && (
        <Dialog title="Other API keys" sub="Keys for services not listed above. Saved for skills and workflows." onClose={() => setOpenId(null)} actions={<>
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setOpenId(null)}>Done</button>
          <button type="button" className="muse-btn muse-btn-filled" onClick={() => { setOpenId(null); setKeyDraft({ service: 'other' }) }}>Add API key</button>
        </>}>
          {otherKeys.length === 0 && <p className="muse-muted">None yet.</p>}
          {otherKeys.map(k => (
            <Row key={k.id} title={k.label || API_SERVICES.find(s => s.id === k.service)?.name || k.service} sub={mask(k.key)}>
              <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setKeys(l => l.filter(x => x.id !== k.id))}>Remove</button>
            </Row>
          ))}
        </Dialog>
      )}
      {openId === 'custom-mcp' && (
        <Dialog title="MCP servers" sub="Remote MCP over HTTPS (Streamable HTTP). Saved for Claude and workflows." onClose={() => setOpenId(null)} actions={<>
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setOpenId(null)}>Done</button>
          <button type="button" className="muse-btn muse-btn-filled" onClick={() => { setOpenId(null); setMcpDraft({}) }}>Add MCP server</button>
        </>}>
          {otherMcps.length === 0 && <p className="muse-muted">None yet.</p>}
          {otherMcps.map(m => (
            <Row key={m.id} title={m.name} sub={`${m.url}${m.token ? ` · token ${mask(m.token)}` : ''}`} status={<Status on={m.enabled !== false} label={m.enabled !== false ? 'On' : 'Off'} />}>
              <button type="button" className="muse-btn muse-btn-text" onClick={() => setMcps(l => l.map(x => x.id === m.id ? { ...x, enabled: x.enabled === false } : x))}>{m.enabled === false ? 'Turn on' : 'Turn off'}</button>
              <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => setMcps(l => l.filter(x => x.id !== m.id))}>Remove</button>
            </Row>
          ))}
        </Dialog>
      )}

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
          <Field label="Name"><input className="muse-input" autoFocus value={mcpDraft.name || ''} onChange={e => setMcpDraft({ ...mcpDraft, name: e.target.value })} placeholder="e.g. Virlo, your own tools" /></Field>
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
