import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Field, Empty, Dialog, InfluencerSelect } from './ui'
import { PLATFORMS, platformName } from '../utils/publishing'
import { getPublishing, isPublishingConnected } from '../utils/connections'
import { newId } from '../utils/localJson'

// Social accounts (per workspace). Lives in Settings → Social accounts.
export default function SocialAccounts() {
  const [influencers] = useInfluencers()
  const [accounts, setAccounts] = useWorkspaceStore('muse_accounts')
  const [draft, setDraft] = useState(null)
  const pub = getPublishing()
  const connected = isPublishingConnected(pub)

  return (
    <div className="muse-stack">
      <p className="muse-muted">
        {connected
          ? pub.provider === 'ayrshare'
            ? 'Posts go out through Ayrshare. Each account here must also be linked in your Ayrshare dashboard, or in the Ayrshare profile you set on the account.'
            : 'Posts go out through your webhook. Your automation receives the platform and handle for each account.'
          : <>Add the accounts each influencer posts to. To post directly, connect a posting service in <Link to="/settings?section=connections">Connections</Link>.</>}
      </p>

      {accounts.length === 0 ? (
        <Empty title="No social accounts yet" action={<button type="button" className="muse-btn muse-btn-filled" onClick={() => setDraft({})}>Add account</button>}>Add an Instagram, TikTok, YouTube or other account and link it to an influencer.</Empty>
      ) : (
        <div className="muse-intg">
          {accounts.map(a => {
            const who = (influencers || []).find(i => i.id === a.influencerId)
            return (
              <div key={a.id} className="muse-intg-row">
                <span className="muse-intg-mark" aria-hidden>{platformName(a.platform).slice(0, 2)}</span>
                <span className="muse-list-main"><strong>{a.handle}</strong><small>{platformName(a.platform)}{who ? ` · ${who.name}` : ''}{a.profileKey ? ' · own Ayrshare profile' : ''}</small></span>
                <span className={`muse-badge ${connected ? 'posted' : 'draft'}`}>{connected ? 'Ready' : 'Not connected'}</span>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => setDraft(a)}>Edit</button>
              </div>
            )
          })}
          <button type="button" className="muse-intg-row muse-intg-add" onClick={() => setDraft({})}>＋ Add account</button>
        </div>
      )}

      {draft && (
        <Dialog title={draft.id ? 'Edit account' : 'Add social account'} onClose={() => setDraft(null)} actions={<>
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
              <select className="muse-input" value={draft.platform || 'instagram'} onChange={e => setDraft({ ...draft, platform: e.target.value })}>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Handle"><input className="muse-input" autoFocus value={draft.handle || ''} onChange={e => setDraft({ ...draft, handle: e.target.value })} placeholder="@handle" /></Field>
          </div>
          <Field label="Influencer"><InfluencerSelect value={draft.influencerId} onChange={v => setDraft({ ...draft, influencerId: v })} /></Field>
          {pub.provider === 'ayrshare' && (
            <Field label="Ayrshare profile key" hint="Only if this account sits in its own Ayrshare profile (Business plan). Leave empty to use your main profile.">
              <input className="muse-input" type="password" value={draft.profileKey || ''} onChange={e => setDraft({ ...draft, profileKey: e.target.value })} autoComplete="off" />
            </Field>
          )}
        </Dialog>
      )}
    </div>
  )
}
