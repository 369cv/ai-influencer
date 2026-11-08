// Workflow templates: data only. The gallery and the trigger → steps view render
// these; utils/workflowRun.js runs them. `setup` says what a run asks for first.
//
// An integration is "connected" only when the app can actually reach it today.
// Anything else shows a Connect step — never a fake result.

import { isHFConnected } from './higgsfieldAuth'
import { isPublishingConnected, getApiKeys } from './connections'
const hasKey = service => getApiKeys().some(k => k.service === service)

export const INTEGRATIONS = {
  higgsfield: { name: 'Higgsfield', mono: 'Hf', isConnected: () => isHFConnected(), connectTo: '/settings?section=connections', available: true },
  claude:     { name: 'Claude',     mono: 'Cl', isConnected: () => { try { return !!localStorage.getItem('claude_api_key') } catch { return false } }, connectTo: '/settings?section=connections', available: true },
  // ElevenLabs / HeyGen: your own key can be saved in Settings → Connections; the steps that use it aren't built yet.
  elevenlabs: { name: 'ElevenLabs', mono: 'El', isConnected: () => hasKey('elevenlabs'), connectTo: '/settings?section=connections', available: false },
  heygen:     { name: 'HeyGen',     mono: 'Hg', isConnected: () => hasKey('heygen'), connectTo: '/settings?section=connections', available: false },
  // Posting goes through the posting service you connect (Ayrshare or a webhook).
  tiktok:     { name: 'TikTok',     mono: 'Tt', isConnected: () => isPublishingConnected(), connectTo: '/settings?section=connections', available: true },
  instagram:  { name: 'Instagram',  mono: 'Ig', isConnected: () => isPublishingConnected(), connectTo: '/settings?section=connections', available: true },
  muse:       { name: 'Muse Studio', mono: 'M', isConnected: () => true, available: true },
}

export const STEP_KINDS = {
  photo:   { label: 'Photo',        icon: 'M4 6h16v12H4zM4 15l5-5 4 4 3-3 4 4' },
  video:   { label: 'Video',        icon: 'M4 6h11v12H4zM15 10l5-3v10l-5-3' },
  caption: { label: 'Caption',      icon: 'M4 6h16M4 11h16M4 16h10' },
  voice:   { label: 'Voice',        icon: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3' },
  talking: { label: 'Talking clip', icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 21a7 7 0 0 1 14 0' },
  post:    { label: 'Post',         icon: 'M4 12l16-8-6 16-3-7z' },
  save:    { label: 'Save',         icon: 'M6 3h12v18l-6-4-6 4z' },
}

export const TRIGGERS = {
  manual:   { label: 'When you tap Run',            icon: 'M8 5l11 7-11 7z' },
  schedule: { label: 'Every day at 9:00',           icon: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  deal:     { label: 'When a brand deal is added',  icon: 'M20 7H4v12h16zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2' },
  inspo:    { label: 'When you save inspiration',   icon: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z' },
}

export const TEMPLATES = [
  {
    id: 'talking-clip',
    title: 'Photo to talking clip',
    blurb: 'A fresh photo, a caption, a voiceover and a talking clip, posted to TikTok.',
    trigger: 'manual',
    featured: true,
    setup: {},
    steps: [
      { kind: 'photo',   app: 'higgsfield', title: 'Generate a photo',          detail: 'Photo Studio, using the influencer’s saved look' },
      { kind: 'caption', app: 'claude',     title: 'Write caption and script',  detail: 'In the influencer’s voice, 1–2 sentences' },
      { kind: 'voice',   app: 'elevenlabs', title: 'Record the voiceover',      detail: 'Text to speech from the script' },
      { kind: 'talking', app: 'heygen',     title: 'Make a talking clip',       detail: 'Lip-synced to the voiceover, 9:16' },
      { kind: 'post',    app: 'tiktok',     title: 'Post to TikTok',            detail: 'With the caption and hashtags' },
    ],
  },
  {
    id: 'daily-post',
    title: 'Daily photo post',
    blurb: 'Every morning: one new photo with a caption, posted to Instagram.',
    trigger: 'schedule',
    setup: { scene: true, ratio: '4:5', defaultScene: 'Morning coffee at a sunny café table, candid, natural light' },
    steps: [
      { kind: 'photo',   app: 'higgsfield', title: 'Generate a photo',  detail: 'Random scene from the influencer’s niche' },
      { kind: 'caption', app: 'claude',     title: 'Write a caption',   detail: 'Short, with 3–5 hashtags' },
      { kind: 'post',    app: 'instagram',  title: 'Post to Instagram', detail: 'Feed post, 4:5 crop, after you review it' },
    ],
  },
  {
    id: 'brand-deal',
    title: 'Brand deal shoot',
    blurb: 'Turn a new brand deal into a product photo and a ready-to-post caption.',
    trigger: 'deal',
    setup: { deal: true, scene: true, defaultScene: 'Holding the product toward the camera, bright home setting, natural daylight' },
    steps: [
      { kind: 'photo',   app: 'higgsfield', title: 'Shoot with the product', detail: 'Photo Studio, product as a prop' },
      { kind: 'caption', app: 'claude',     title: 'Write a sponsored caption', detail: 'Includes #ad and the brand handle' },
      { kind: 'save',    app: 'muse',       title: 'Save to Library',        detail: 'For review before posting' },
    ],
  },
  {
    id: 'reel',
    title: 'Photo to video reel',
    blurb: 'Animate a photo into a short reel, caption it and post it.',
    trigger: 'manual',
    setup: { startPhoto: true, scene: true, motion: true, defaultScene: 'Walking through a sunny street market, candid, golden hour', defaultMotion: 'She turns toward the camera and smiles, slow push-in, natural movement' },
    steps: [
      { kind: 'photo',   app: 'higgsfield', title: 'Pick or generate a photo', detail: 'Used as the start frame' },
      { kind: 'video',   app: 'higgsfield', title: 'Animate it',              detail: 'Seedance 2.0, 5 seconds, 720p' },
      { kind: 'caption', app: 'claude',     title: 'Write a caption',         detail: 'Hook first, then hashtags' },
      { kind: 'post',    app: 'tiktok',     title: 'Post to TikTok',          detail: 'With the caption, after you review it' },
    ],
  },
  {
    id: 'inspo-look',
    title: 'Inspiration to new look',
    blurb: 'When you save an outfit you like, try it on your influencer.',
    trigger: 'inspo',
    setup: { reference: true, scene: true, defaultScene: 'Full-body photo wearing the outfit from the reference, city street, golden hour' },
    steps: [
      { kind: 'photo', app: 'higgsfield', title: 'Try on the outfit', detail: 'Inspiration image as the style reference' },
      { kind: 'save',  app: 'muse',       title: 'Save to Library',   detail: 'Tagged with the inspiration board' },
    ],
  },
]

export function templateStatus(t) {
  const apps = [...new Set(t.steps.map(s => s.app))]
  const missing = apps.filter(a => !INTEGRATIONS[a].isConnected())
  return { apps, missing, ready: missing.length === 0 }
}
