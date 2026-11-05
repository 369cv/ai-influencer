// Connections live in Settings → Connections (never in onboarding).
// Everything is stored in this browser only. Keys are sent only to the service
// they belong to, through this app's own /api proxies.
import { readJSON } from './localJson'

export const CLAUDE_KEY = 'claude_api_key'          // read by existing Claude features
export const API_KEYS_KEY = 'muse_api_keys'           // [{ id, service, label, key, addedAt }]
export const MCP_KEY = 'muse_mcp_servers'             // [{ id, name, url, token, enabled, addedAt }]
export const PUBLISHING_KEY = 'muse_publishing'       // { provider, apiKey, profileKey, webhookUrl, webhookSecret }

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

export const PUBLISHING_PROVIDERS = [
  {
    id: 'ayrshare', name: 'Ayrshare',
    blurb: 'One API key posts to Instagram, TikTok, YouTube, X, LinkedIn, Facebook, Threads and Pinterest. Link the social accounts in your Ayrshare dashboard first.',
    docs: 'https://www.ayrshare.com/docs/apis/post/overview',
  },
  {
    id: 'webhook', name: 'Webhook (Zapier, Make, n8n)',
    blurb: 'Sends each post as JSON to your automation. Your Zap or scenario does the posting, so any network it supports works.',
    docs: 'https://zapier.com/apps/webhook/integrations',
  },
]

export function getClaudeKey() {
  try { return localStorage.getItem(CLAUDE_KEY) || '' } catch { return '' }
}
export function getPublishing() {
  return readJSON(PUBLISHING_KEY, { provider: '' })
}
export function isPublishingConnected(p = getPublishing()) {
  if (p.provider === 'ayrshare') return !!p.apiKey
  if (p.provider === 'webhook') return /^https:\/\//i.test(p.webhookUrl || '')
  return false
}
export function getApiKeys() { return readJSON(API_KEYS_KEY, []) }
export function getMcpServers() { return readJSON(MCP_KEY, []) }

export const mask = k => (k ? `···${String(k).slice(-4)}` : '')
