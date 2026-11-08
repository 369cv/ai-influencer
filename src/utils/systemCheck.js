// Settings → System check. One small real request per connection, so "connected"
// means "works". None of these spend Higgsfield credits or ElevenLabs characters;
// the Claude check uses a few tokens. Results are kept in this browser.
import { isHFConnected } from './higgsfieldAuth'
import { checkHiggsfield } from './higgsfieldGenerate'
import { getClaudeKey, connectedRoutes, POSTING_ROUTES } from './connections'
import { getElevenKey, listVoices } from './elevenlabs'
import { ASSIST_MODEL } from './claudeAssist'
import { testPublishing } from './publishing'
import { readJSON, writeJSON } from './localJson'

export const CHECK_KEY = 'muse_system_check' // { [id]: { state: 'ok'|'fail', detail, at } }

async function checkClaude() {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': getClaudeKey(), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: ASSIST_MODEL, max_tokens: 5, messages: [{ role: 'user', content: 'Reply with OK.' }] }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || `Claude answered ${res.status}.`)
  return 'Replied.'
}

// Every check Muse knows about. `connected()` decides whether it runs or shows "Not connected".
export function systemChecks() {
  const routes = connectedRoutes()
  return [
    { id: 'higgsfield', name: 'Higgsfield', what: 'Sign-in and tool list · no credits', connected: isHFConnected,
      run: async () => `Signed in · ${await checkHiggsfield()} tools available.` },
    { id: 'claude', name: 'Claude', what: 'One five-token reply', connected: () => !!getClaudeKey(), run: checkClaude },
    { id: 'elevenlabs', name: 'ElevenLabs', what: 'List voices · no characters', connected: () => !!getElevenKey(),
      run: async () => { const v = await listVoices(); return `${v.length} voice${v.length === 1 ? '' : 's'} on the account.` } },
    ...POSTING_ROUTES.map(r => ({
      id: r.id, name: r.name,
      what: r.kind === 'ayrshare' ? 'Linked accounts · posts nothing' : 'Sends a muse.test event · posts nothing',
      connected: () => routes.includes(r.id),
      run: async () => { const d = await testPublishing(r.id); return d.accounts?.length ? `Works · linked: ${d.accounts.join(', ')}.` : 'Works.' },
    })),
  ]
}

export const readCheckResults = () => readJSON(CHECK_KEY, {})
export function saveCheckResult(id, result) {
  writeJSON(CHECK_KEY, { ...readCheckResults(), [id]: result })
}
