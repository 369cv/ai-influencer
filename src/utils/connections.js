// Connections live in Settings → Connections (never in onboarding).
// Everything is stored in this browser only. Keys are sent only to the service
// they belong to, through this app's own /api proxies.
import { readJSON } from './localJson'

export const CLAUDE_KEY = 'claude_api_key'          // read by existing Claude features
export const API_KEYS_KEY = 'muse_api_keys'           // [{ id, service, label, key, addedAt }]
export const MCP_KEY = 'muse_mcp_servers'             // [{ id, name, url, token, enabled, addedAt }]
export const PUBLISHING_KEY = 'muse_publishing'       // see POSTING_ROUTES below

// Services people commonly bring their own key for. "Other" covers anything else.
export const API_SERVICES = [
  { id: 'openai', name: 'OpenAI', hint: 'Images, captions' },
  { id: 'elevenlabs', name: 'ElevenLabs', hint: 'Voiceovers' },
  { id: 'heygen', name: 'HeyGen', hint: 'Talking avatars' },
  { id: 'fal', name: 'Fal.ai', hint: 'Image & video models' },
  { id: 'replicate', name: 'Replicate', hint: 'Open models' },
  { id: 'runway', name: 'Runway', hint: 'Video' },
  { id: 'other', name: 'Other', hint: 'Any API' },
]

// Posting routes. Several can be connected at once; each social account picks one
// (Settings → Social accounts), otherwise the default route is used.
//   PUBLISHING_KEY = { version: 2, defaultRoute, routes: { ayrshare: { apiKey, profileKey },
//                      zapier|make|n8n|webhook: { url, secret } } }
export const POSTING_ROUTES = [
  { id: 'ayrshare', name: 'Ayrshare', kind: 'ayrshare' },
  { id: 'zapier', name: 'Zapier', kind: 'webhook', step: 'Webhooks by Zapier → Catch Hook', placeholder: 'https://hooks.zapier.com/hooks/catch/…' },
  { id: 'make', name: 'Make', kind: 'webhook', step: 'Webhooks → Custom webhook', placeholder: 'https://hook.eu1.make.com/…' },
  { id: 'n8n', name: 'n8n', kind: 'webhook', step: 'Webhook node (POST, production URL)', placeholder: 'https://your-n8n.example.com/webhook/…' },
  { id: 'webhook', name: 'Custom webhook', kind: 'webhook', step: 'Any https endpoint that accepts JSON', placeholder: 'https://example.com/muse-posts' },
]
export const routeName = id => POSTING_ROUTES.find(r => r.id === id)?.name || id

// Reads the posting settings, upgrading the old single-provider shape.
export function normalizePublishing(p = {}) {
  if (p.version === 2) return { defaultRoute: '', routes: {}, ...p }
  const routes = {}
  if (p.provider === 'ayrshare' && p.apiKey) routes.ayrshare = { apiKey: p.apiKey, profileKey: p.profileKey || '' }
  if (p.provider === 'webhook' && p.webhookUrl) routes.webhook = { url: p.webhookUrl, secret: p.webhookSecret || '' }
  return { version: 2, defaultRoute: routes[p.provider] ? p.provider : '', routes }
}
export function getPublishing() {
  return normalizePublishing(readJSON(PUBLISHING_KEY, {}))
}
export function isRouteConnected(id, p = getPublishing()) {
  const r = normalizePublishing(p).routes[id]
  if (!r) return false
  return id === 'ayrshare' ? !!r.apiKey : /^https:\/\//i.test(r.url || '')
}
export const connectedRoutes = (p = getPublishing()) => POSTING_ROUTES.filter(r => isRouteConnected(r.id, p)).map(r => r.id)
export const isPublishingConnected = (p = getPublishing()) => connectedRoutes(p).length > 0
// The route an account posts through: its own choice, else the default, else the first connected.
export function routeForAccount(account, p = getPublishing()) {
  const live = connectedRoutes(p)
  if (account?.route && live.includes(account.route)) return account.route
  if (live.includes(p.defaultRoute)) return p.defaultRoute
  return live[0] || ''
}
export function getClaudeKey() {
  try { return localStorage.getItem(CLAUDE_KEY) || '' } catch { return '' }
}
export function getApiKeys() { return readJSON(API_KEYS_KEY, []) }
export function getMcpServers() { return readJSON(MCP_KEY, []) }

export const mask = k => (k ? `···${String(k).slice(-4)}` : '')
