import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Field, Empty, Dialog, InfluencerSelect } from './ui'
import { PLATFORMS, platformName } from '../utils/publishing'
import { getPublishing, connectedRoutes, routeForAccount, routeName } from '../utils/connections'
import { CONNECTORS } from '../utils/connectors'
import ConnectorLogo from './ConnectorLogo'
import { newId } from '../utils/localJson'

const platformConnector = id => CONNECTORS.find(c => c.auth === 'social' && c.platform === id)

// Social accounts (per workspace). Lives in Settings → Social accounts, and on each
// platform's page in Settings → Connections (pass `platform` to show only that one).
// Each account can pick its own posting route; otherwise the default route is used.
export default function SocialAccounts({ platform }) {
  const [influencers] = useInfluencers()
  const [allAccounts, setAccounts] = useWorkspaceStore('muse_accounts')
  const [draft, setDraft] = useState(null)
  const pub = getPublishing()
  const routes = connectedRoutes(pub)
  const accounts = (allAccounts || []).filter(a => !platform || a.platform === platform)
  const pName = platform && platformName(platform)

  return (
    <div className="muse-stack">
      <p className="muse-muted">
        {routes.length
          ? <>Posts go out through {routes.map(routeName).join(', ')}{routes.length > 1 ? '. Each account can pick its route; the rest use the default' : ''}. Ayrshare accounts must also be linked in your Ayrshare dashboard.</>
          : <>To post directly, connect Ayrshare, Zapier, Make, n8n or a webhook in <Link to="/settings?section=connections">Connections</Link>. Until then, Content can download a post pack.</>}
      </p>

      {accounts.length === 0 ? (
        <Empty title={pName ? `No ${pName} accounts yet` : 'No social accounts yet'} action={<button type="button" className="muse-btn muse-btn-filled" onClick={() => setDraft({ platform: platform || 'instagram' })}>Add account</button>}>
          {pName ? `Add the ${pName} handle each influencer posts to.` : 'Add an Instagram, TikTok, YouTube or other account and link it to an influencer.'}
        </Empty>
      ) : (
        <div className="muse-intg">
          {accounts.map(a => {
            const who = (influencers || []).find(i => i.id === a.influencerId)
            const route = routeForAccount(a, pub)
            const pc = platformConnector(a.platform)
            return (
              <div key={a.id} className="muse-intg-row">
                {pc ? <ConnectorLogo c={pc} size={32} /> : <span className="muse-intg-mark" aria-hidden>{platformName(a.platform).slice(0, 2)}</span>}
                <span className="muse-list-main"><strong>{a.handle}</strong><small>{[platformName(a.platform), who?.name, route && `via ${routeName(route)}`, a.profileKey && 'own Ayrshare profile'].filter(Boolean).join(' · ')}</small></span>
                <span className={`muse-badge ${route ? 'posted' : 'draft'}`}>{route ? 'Ready' : 'No route'}</span>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => setDraft(a)}>Edit</button>
              </div>
            )
          })}
          <button type="button" className="muse-intg-row muse-intg-add" onClick={() => setDraft({ platform: platform || 'instagram' })}>＋ Add {pName || ''} account</button>
        </div>
      )}

      {draft && (
        <Dialog title={draft.id ? 'Edit account' : `Add ${pName || 'social'} account`} onClose={() => setDraft(null)} actions={<>
          {draft.id && <button type="button" className="muse-btn muse-btn-text muse-danger" onClick={() => { setAccounts(l => l.filter(x => x.id !== draft.id)); setDraft(null) }}>Remove</button>}
          <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setDraft(null)}>Cancel</button>
          <button type="button" className="muse-btn muse-btn-filled" disabled={!draft.handle?.trim()} onClick={() => {
            const h = draft.handle.trim()
            const a = { platform: 'instagram', ...draft, handle: h.startsWith('@') ? h : '@' + h, id: draft.id || newId('acct') }
            setAccounts(l => l.some(x => x.id === a.id) ? l.map(x => x.id === a.id ? a : x) : [...l, a]); setDraft(null)
          }}>Save</button>
        </>}>
          <div className="muse-form-grid">
            <Field label="Platform">
              <select className="muse-input" value={draft.platform || 'instagram'} onChange={e => setDraft({ ...draft, platform: e.target.value })} disabled={!!platform}>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Handle"><input className="muse-input" autoFocus value={draft.handle || ''} onChange={e => setDraft({ ...draft, handle: e.target.value })} placeholder="@handle" /></Field>
          </div>
          <Field label="Influencer"><InfluencerSelect value={draft.influencerId} onChange={v => setDraft({ ...draft, influencerId: v })} /></Field>
          {routes.length > 0 && (
            <Field label="Post through" hint="Which connected route sends this account’s posts.">
              <select className="muse-input" value={draft.route || ''} onChange={e => setDraft({ ...draft, route: e.target.value || undefined })}>
                <option value="">Default ({routeName(routeForAccount({}, pub))})</option>
                {routes.map(r => <option key={r} value={r}>{routeName(r)}</option>)}
              </select>
            </Field>
          )}
          {routeForAccount(draft, pub) === 'ayrshare' && (
            <Field label="Ayrshare profile key" hint="Only if this account sits in its own Ayrshare profile (Business plan). Leave empty to use your main profile.">
              <input className="muse-input" type="password" value={draft.profileKey || ''} onChange={e => setDraft({ ...draft, profileKey: e.target.value })} autoComplete="off" />
            </Field>
          )}
        </Dialog>
      )}
    </div>
  )
}
