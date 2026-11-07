// One registry of every connector Muse Studio knows about, grouped by what the
// Muse agent uses it for. Settings → Connections renders from this; Workflows
// can read it too. Statuses are honest: a connector only reads "Connected"
// when a feature actually uses it.
//
// auth:  oauth   — Higgsfield sign-in
//        claude  — Anthropic key (CLAUDE_KEY)
//        key     — bring-your-own key, stored in API_KEYS_KEY under `service`
//        posting — posting provider in PUBLISHING_KEY (`provider`)
//        mcp     — saved as a remote MCP server (MCP_KEY), prefilled `mcpUrl`
//        soon    — not built yet
import { isHFConnected } from './higgsfieldAuth'
import { getClaudeKey, getApiKeys, getPublishing, isPublishingConnected, getMcpServers } from './connections'

export const CATEGORIES = [
  { id: 'think', label: 'Think & write', sub: 'The agent’s brain: prompts, captions, ideas and remixes.' },
  { id: 'create', label: 'Create', sub: 'Photos and videos of your influencer.' },
  { id: 'voice', label: 'Voice', sub: 'How your influencer sounds.' },
  { id: 'publish', label: 'Publish', sub: 'Post and schedule from Content.' },
  { id: 'research', label: 'Research & trends', sub: 'What’s working for other creators.' },
  { id: 'grow', label: 'Grow & monetize', sub: 'Links, products and sales.' },
  { id: 'files', label: 'Files', sub: 'Bring in and save assets.' },
]

export const CONNECTORS = [
  // Think & write
  { id: 'claude', name: 'Claude', by: 'Anthropic', category: 'think', auth: 'claude', logo: 'claude', featured: true,
    use: 'Captions, weekly ideas, remixes and prompt Enhance.',
    usedBy: [{ label: 'Weekly ideas', to: '/' }, { label: 'Remix a video', to: '/studio' }, { label: 'Captions', to: '/content?compose=1' }, { label: 'Skills', to: '/settings?section=skills' }],
    docs: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…' },

  // Create
  { id: 'higgsfield', name: 'Higgsfield', category: 'create', auth: 'oauth', image: '/hf-icon.png', featured: true,
    use: 'Photos and videos with your own Higgsfield credits.',
    usedBy: [{ label: 'Studio', to: '/studio' }, { label: 'Create', to: '/create' }, { label: 'Influencer studios', to: '/influencers' }] },
  { id: 'heygen', name: 'HeyGen', category: 'create', auth: 'key', service: 'heygen', mono: 'Hg', color: '#2F2F2F',
    use: 'Talking avatars. Your key is saved for workflows; the steps that use it aren’t built yet.', docs: 'https://app.heygen.com/settings?nav=API' },
  { id: 'openai', name: 'OpenAI', category: 'create', auth: 'key', service: 'openai', mono: 'Ai', color: '#111111',
    use: 'Images and text. Saved for skills and workflows.', docs: 'https://platform.openai.com/api-keys' },
  { id: 'fal', name: 'Fal.ai', category: 'create', auth: 'key', service: 'fal', mono: 'Fa', color: '#3C3C3C',
    use: 'Image and video models. Saved for workflows.', docs: 'https://fal.ai/dashboard/keys' },
  { id: 'replicate', name: 'Replicate', category: 'create', auth: 'key', service: 'replicate', logo: 'replicate',
    use: 'Open models. Saved for workflows.', docs: 'https://replicate.com/account/api-tokens' },
  { id: 'runway', name: 'Runway', category: 'create', auth: 'key', service: 'runway', mono: 'Rw', color: '#111111',
    use: 'Video. Saved for workflows.', docs: 'https://dev.runwayml.com/' },

  // Voice
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'voice', auth: 'key', service: 'elevenlabs', logo: 'elevenlabs', featured: true, live: true,
    use: 'One consistent voice per influencer, with previews.',
    usedBy: [{ label: 'Persona voice', to: '/influencers' }], docs: 'https://elevenlabs.io/app/settings/api-keys' },

  // Publish
  { id: 'ayrshare', name: 'Ayrshare', category: 'publish', auth: 'posting', provider: 'ayrshare', mono: 'Ay', color: '#1A73E8',
    use: 'One key posts to Instagram, TikTok, YouTube, X, LinkedIn, Facebook, Threads and Pinterest.',
    usedBy: [{ label: 'Content', to: '/content' }], docs: 'https://www.ayrshare.com/docs/apis/post/overview' },
  { id: 'webhook', name: 'Zapier, Make or n8n', category: 'publish', auth: 'posting', provider: 'webhook', logos: ['make', 'n8n'],
    use: 'Sends each post to your automation, which does the posting.',
    usedBy: [{ label: 'Content', to: '/content' }], docs: 'https://zapier.com/apps/webhook/integrations' },

  // Research & trends
  { id: 'blueprint', name: 'Blueprint', category: 'research', auth: 'mcp', mcpUrl: 'https://mcp.blueprintforcreators.com/mcp', mono: 'Bp', color: '#1F2937',
    use: 'Outlier videos and tracked creators. Saved as an MCP server for Claude and workflows; nothing in the app reads it yet.', docs: 'https://blueprintforcreators.com' },

  // Grow & monetize
  { id: 'linkme', name: 'link.me', category: 'grow', auth: 'soon', mono: 'lm', color: '#111111', use: 'Link in bio, auto-DMs and lead capture.' },
  { id: 'linktree', name: 'Linktree', category: 'grow', auth: 'soon', logo: 'linktree', use: 'Link in bio.' },
  { id: 'stripe', name: 'Stripe', category: 'grow', auth: 'soon', logo: 'stripe', use: 'Payments for brand deals and products.' },
  { id: 'gumroad', name: 'Gumroad', category: 'grow', auth: 'soon', logo: 'gumroad', use: 'Sell prompt packs and guides.' },
  { id: 'shopify', name: 'Shopify', category: 'grow', auth: 'soon', logo: 'shopify', use: 'Products for UGC and ads.' },

  // Files
  { id: 'googledrive', name: 'Google Drive', category: 'files', auth: 'soon', logo: 'googledrive', use: 'Import references, save exports.' },
  { id: 'dropbox', name: 'Dropbox', category: 'files', auth: 'soon', logo: 'dropbox', use: 'Import references, save exports.' },
  { id: 'notion', name: 'Notion', category: 'files', auth: 'soon', logo: 'notion', use: 'Persona bibles and content calendars.' },
]

// Platforms reached through the posting service (shown under Publish).
export const PLATFORM_LOGOS = ['instagram', 'tiktok', 'youtube', 'x', 'threads', 'facebook', 'pinterest']

// 'connected' | 'saved' (key or server stored, not used by a feature yet) | 'off' | 'soon'
export function statusOf(c) {
  switch (c.auth) {
    case 'oauth': return isHFConnected() ? 'connected' : 'off'
    case 'claude': return getClaudeKey() ? 'connected' : 'off'
    case 'key': {
      const has = getApiKeys().some(k => k.service === c.service && k.key)
      return has ? (c.live ? 'connected' : 'saved') : 'off'
    }
    case 'posting': {
      const p = getPublishing()
      return p.provider === c.provider && isPublishingConnected(p) ? 'connected' : 'off'
    }
    case 'mcp': return getMcpServers().some(m => m.url === c.mcpUrl) ? 'saved' : 'off'
    default: return 'soon'
  }
}

export const STATUS_LABEL = { connected: 'Connected', saved: 'Saved', off: 'Not connected', soon: 'Coming soon' }
