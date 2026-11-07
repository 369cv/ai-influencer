// One registry of every connector Muse Studio knows about, grouped by what the
// Muse agent uses it for. Settings → Connections renders from this. Statuses
// are honest: "Connected" only when a feature actually uses the service.
//
// auth:  oauth   — Higgsfield sign-in
//        claude  — Anthropic key (CLAUDE_KEY)
//        key     — bring-your-own key in API_KEYS_KEY under `service` (live: a feature uses it)
//        posting — posting provider in PUBLISHING_KEY (`provider`)
//        mcp     — saved as a remote MCP server (MCP_KEY), prefilled `mcpUrl`
//        soon    — listed so you can see where Muse is heading; not built
// Logo: `logo` = mark in connectorLogos.js (white on brand colour), `asset` =
// full-colour SVG in src/assets/connectors/, `image` = file in public/, else
// `mono` letters on `color`.
import { isHFConnected } from './higgsfieldAuth'
import { getClaudeKey, getApiKeys, getPublishing, isPublishingConnected, getMcpServers } from './connections'

export const CATEGORIES = [
  { id: 'think', label: 'Think & write' },
  { id: 'create', label: 'Create · photo & video' },
  { id: 'edit', label: 'Edit & design' },
  { id: 'voice', label: 'Voice & music' },
  { id: 'publish', label: 'Publish' },
  { id: 'engage', label: 'Messages & community' },
  { id: 'research', label: 'Research & trends' },
  { id: 'grow', label: 'Grow & monetize' },
  { id: 'files', label: 'Files & data' },
]

const soon = (id, name, category, use, logo = {}) => ({ id, name, category, auth: 'soon', use, ...logo })

export const CONNECTORS = [
  // Think & write
  { id: 'claude', name: 'Claude', by: 'Anthropic', category: 'think', auth: 'claude', logo: 'claude', featured: true,
    use: 'Captions, weekly ideas, remixes and prompt Enhance.',
    usedBy: [{ label: 'Weekly ideas', to: '/' }, { label: 'Remix a video', to: '/studio' }, { label: 'Captions', to: '/content?compose=1' }, { label: 'Skills', to: '/settings?section=skills' }],
    docs: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…' },
  { id: 'openai', name: 'OpenAI', category: 'think', auth: 'key', service: 'openai', logo: 'openai',
    use: 'GPT models and GPT Image. Saved for skills and workflows.', docs: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Gemini', by: 'Google', category: 'think', auth: 'key', service: 'gemini', logo: 'googlegemini',
    use: 'Gemini models. Saved for skills and workflows.', docs: 'https://aistudio.google.com/apikey' },
  { id: 'perplexity', name: 'Perplexity', category: 'think', auth: 'key', service: 'perplexity', logo: 'perplexity',
    use: 'Web-grounded research. Saved for skills and workflows.', docs: 'https://www.perplexity.ai/settings/api' },
  { id: 'mistral', name: 'Mistral', category: 'think', auth: 'key', service: 'mistral', logo: 'mistralai',
    use: 'Mistral models. Saved for skills and workflows.', docs: 'https://console.mistral.ai/api-keys' },

  // Create · photo & video
  { id: 'higgsfield', name: 'Higgsfield', category: 'create', auth: 'oauth', image: '/hf-icon.png', tile: '#D7F94B', featured: true,
    use: 'Photos and videos with your own Higgsfield credits.',
    usedBy: [{ label: 'Studio', to: '/studio' }, { label: 'Create', to: '/create' }, { label: 'Influencer studios', to: '/influencers' }] },
  { id: 'heygen', name: 'HeyGen', category: 'create', auth: 'key', service: 'heygen', mono: 'H', color: '#2F2F2F',
    use: 'Talking avatars. Saved for workflows; the steps that use it aren’t built yet.', docs: 'https://app.heygen.com/settings?nav=API' },
  { id: 'runway', name: 'Runway', category: 'create', auth: 'key', service: 'runway', logo: 'runway',
    use: 'Video generation. Saved for workflows.', docs: 'https://dev.runwayml.com/' },
  { id: 'kling', name: 'Kling', category: 'create', auth: 'key', service: 'kling', asset: 'kling',
    use: 'Video generation. Saved for workflows.', docs: 'https://app.klingai.com/global/dev' },
  { id: 'luma', name: 'Luma', category: 'create', auth: 'key', service: 'luma', asset: 'luma',
    use: 'Dream Machine video. Saved for workflows.', docs: 'https://lumalabs.ai/api/keys' },
  { id: 'minimax', name: 'MiniMax Hailuo', category: 'create', auth: 'key', service: 'minimax', asset: 'minimax',
    use: 'Hailuo video. Saved for workflows.', docs: 'https://www.minimax.io/platform' },
  { id: 'ideogram', name: 'Ideogram', category: 'create', auth: 'key', service: 'ideogram', logo: 'ideogram',
    use: 'Images with text and typography. Saved for workflows.', docs: 'https://ideogram.ai/manage-api' },
  { id: 'stability', name: 'Stability AI', category: 'create', auth: 'key', service: 'stability', asset: 'stability',
    use: 'Stable Diffusion images. Saved for workflows.', docs: 'https://platform.stability.ai/account/keys' },
  { id: 'fal', name: 'Fal.ai', category: 'create', auth: 'key', service: 'fal', asset: 'fal',
    use: 'Image and video models. Saved for workflows.', docs: 'https://fal.ai/dashboard/keys' },
  { id: 'replicate', name: 'Replicate', category: 'create', auth: 'key', service: 'replicate', logo: 'replicate',
    use: 'Open models. Saved for workflows.', docs: 'https://replicate.com/account/api-tokens' },
  soon('midjourney', 'Midjourney', 'create', 'Images. No public API yet.', { logo: 'midjourney' }),
  soon('pika', 'Pika', 'create', 'Short video effects.', { logo: 'pika' }),

  // Edit & design
  soon('canva', 'Canva', 'edit', 'Carousels, thumbnails and brand kits.', { asset: 'canva' }),
  soon('capcut', 'CapCut', 'edit', 'Edit and caption Reels.', { mono: 'Cc', color: '#111111' }),
  soon('photoshop', 'Photoshop', 'edit', 'Retouch and composite.', { asset: 'photoshop' }),
  soon('aftereffects', 'After Effects', 'edit', 'Motion graphics.', { asset: 'aftereffects' }),
  soon('figma', 'Figma', 'edit', 'Templates and brand assets.', { logo: 'figma' }),

  // Voice & music
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'voice', auth: 'key', service: 'elevenlabs', logo: 'elevenlabs', featured: true, live: true,
    use: 'One consistent voice per influencer, with previews.',
    usedBy: [{ label: 'Persona voice', to: '/influencers' }], docs: 'https://elevenlabs.io/app/settings/api-keys' },
  soon('suno', 'Suno', 'voice', 'Original music for Reels.', { logo: 'suno' }),
  soon('udio', 'Udio', 'voice', 'Original music for Reels.', { asset: 'udio' }),

  // Publish
  { id: 'ayrshare', name: 'Ayrshare', category: 'publish', auth: 'posting', provider: 'ayrshare', mono: 'Ay', color: '#1A73E8',
    use: 'One key posts to Instagram, TikTok, YouTube, X, LinkedIn, Facebook, Threads and Pinterest.',
    usedBy: [{ label: 'Content', to: '/content' }], docs: 'https://www.ayrshare.com/docs/apis/post/overview' },
  { id: 'webhook', name: 'Zapier, Make or n8n', category: 'publish', auth: 'posting', provider: 'webhook', logo: 'zapier', logos: ['zapier', 'make', 'n8n'],
    use: 'Sends each post to your automation, which does the posting.',
    usedBy: [{ label: 'Content', to: '/content' }], docs: 'https://zapier.com/apps/webhook/integrations' },
  soon('buffer', 'Buffer', 'publish', 'Schedule through your Buffer queue.', { logo: 'buffer' }),
  soon('hootsuite', 'Hootsuite', 'publish', 'Schedule through Hootsuite.', { logo: 'hootsuite' }),
  soon('postiz', 'Postiz', 'publish', 'Open-source scheduler.', { logo: 'postiz' }),

  // Messages & community
  soon('manychat', 'ManyChat', 'engage', 'Comment keyword → auto-DM.', { mono: 'Mc', color: '#0084FF' }),
  soon('whatsapp', 'WhatsApp', 'engage', 'Fan and brand messages.', { logo: 'whatsapp' }),
  soon('telegram', 'Telegram', 'engage', 'Channel posts and alerts.', { logo: 'telegram' }),
  soon('discord', 'Discord', 'engage', 'Community server updates.', { logo: 'discord' }),
  soon('slack', 'Slack', 'engage', 'Team alerts for approvals.', { asset: 'slack' }),

  // Research & trends
  { id: 'blueprint', name: 'Blueprint', category: 'research', auth: 'mcp', mcpUrl: 'https://mcp.blueprintforcreators.com/mcp', mono: 'Bp', color: '#1F2937',
    use: 'Outlier videos and tracked creators. Saved as an MCP server for Claude and workflows; nothing in the app reads it yet.', docs: 'https://blueprintforcreators.com' },
  soon('virlo', 'Virlo', 'research', 'Short-form trends, hooks and sounds.', { mono: 'Vi', color: '#6D28D9' }),
  soon('similarweb', 'Similarweb', 'research', 'Audience and traffic insights.', { logo: 'similarweb' }),
  soon('semrush', 'Semrush', 'research', 'Search trends for content ideas.', { logo: 'semrush' }),

  // Grow & monetize
  soon('linkme', 'link.me', 'grow', 'Link in bio, auto-DMs and lead capture.', { mono: 'lm', color: '#111111' }),
  soon('linktree', 'Linktree', 'grow', 'Link in bio.', { logo: 'linktree' }),
  soon('stripe', 'Stripe', 'grow', 'Payments for brand deals and products.', { logo: 'stripe' }),
  soon('shopify', 'Shopify', 'grow', 'Products for UGC and ads.', { logo: 'shopify' }),
  soon('gumroad', 'Gumroad', 'grow', 'Sell prompt packs and guides.', { logo: 'gumroad' }),
  soon('whop', 'Whop', 'grow', 'Memberships and digital products.', { asset: 'whop' }),
  soon('patreon', 'Patreon', 'grow', 'Paid memberships.', { logo: 'patreon' }),
  soon('kofi', 'Ko-fi', 'grow', 'Tips and shop.', { logo: 'kofi' }),
  soon('substack', 'Substack', 'grow', 'Newsletter.', { logo: 'substack' }),
  soon('mailchimp', 'Mailchimp', 'grow', 'Email list.', { logo: 'mailchimp' }),
  soon('kit', 'Kit', 'grow', 'Creator email (ConvertKit).', { logo: 'kit' }),

  // Files & data
  soon('googledrive', 'Google Drive', 'files', 'Import references, save exports.', { logo: 'googledrive' }),
  soon('dropbox', 'Dropbox', 'files', 'Import references, save exports.', { logo: 'dropbox' }),
  soon('onedrive', 'OneDrive', 'files', 'Import references, save exports.', { asset: 'onedrive' }),
  soon('box', 'Box', 'files', 'Shared brand folders.', { logo: 'box' }),
  soon('notion', 'Notion', 'files', 'Persona bibles and content calendars.', { logo: 'notion' }),
  soon('airtable', 'Airtable', 'files', 'Content and brand-deal tracking.', { logo: 'airtable' }),
  soon('googlesheets', 'Google Sheets', 'files', 'Export calendars and stats.', { logo: 'googlesheets' }),
]

// Platforms reached through the posting service (shown under Publish).
export const PLATFORMS = [
  { logo: 'instagram' }, { logo: 'tiktok' }, { logo: 'youtube' }, { logo: 'x' }, { logo: 'threads' },
  { logo: 'facebook' }, { logo: 'pinterest' }, { asset: 'linkedin', name: 'LinkedIn' }, { logo: 'bluesky' },
]

// 'connected' | 'saved' (stored, no feature uses it yet) | 'off' | 'soon'
export function statusOf(c) {
  switch (c.auth) {
    case 'oauth': return isHFConnected() ? 'connected' : 'off'
    case 'claude': return getClaudeKey() ? 'connected' : 'off'
    case 'key': return getApiKeys().some(k => k.service === c.service && k.key) ? (c.live ? 'connected' : 'saved') : 'off'
    case 'posting': { const p = getPublishing(); return p.provider === c.provider && isPublishingConnected(p) ? 'connected' : 'off' }
    case 'mcp': return getMcpServers().some(m => m.url === c.mcpUrl) ? 'saved' : 'off'
    default: return 'soon'
  }
}

export const STATUS_LABEL = { connected: 'Connected', saved: 'Saved', off: 'Not connected', soon: 'Coming soon' }
