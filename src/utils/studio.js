// Studio: settings, task templates and the job feed.
// One template list feeds Home, New → From a template and the Studio's empty state.
import { MODEL_LABELS, DEFAULT_RESOLUTION, estimateImageCredits, estimateVideoCredits } from './creditEstimate'

export const PHOTO_MODELS = ['soul_2', 'gpt_image_2', 'nano_banana_2', 'nano_banana_flash'].map(id => ({ id, label: MODEL_LABELS[id] || id }))
export const VIDEO_MODELS = [{ id: 'seedance_2_0', label: MODEL_LABELS.seedance_2_0 || 'Seedance 2.0' }]
export const PHOTO_RATIOS = ['9:16', '4:5', '3:4', '1:1', '16:9']
export const VIDEO_RATIOS = ['9:16', '1:1', '16:9']
export const PHOTO_RES = ['1k', '2k', '4k']
export const VIDEO_RES = ['480p', '720p', '1080p']
export const VIDEO_SECONDS = [5, 8, 10]
export const MAX_SHOTS = 8

export const DEFAULTS = {
  photo: { model: 'soul_2', ratio: '4:5', resolution: DEFAULT_RESOLUTION.soul_2 || '2k', count: 4 },
  video: { model: 'seedance_2_0', ratio: '9:16', resolution: '720p', seconds: 5, count: 1 },
}

export function estimate(s) {
  if (s.mode === 'video') return estimateVideoCredits(s.model, s.resolution, s.seconds, s.count)
  return estimateImageCredits(s.model, s.resolution, s.count)
}

// Task templates that fit influencer work.
export const STUDIO_TEMPLATES = [
  { id: 'poses', label: 'New poses', hint: 'Same look, four fresh poses', mode: 'photo', count: 4,
    shots: ['standing, weight on one hip, relaxed smile', 'walking toward camera mid-stride', 'seated, leaning forward, elbows on knees', 'over-the-shoulder glance, soft surprise'],
    prompt: 'Candid lifestyle photo, natural light, same outfit and setting in every shot' },
  { id: 'angles', label: 'Different angles', hint: 'Front, three-quarter, profile, low angle', mode: 'photo', count: 4,
    shots: ['straight-on front view, eye level', 'three-quarter view from the left', 'side profile facing right', 'slight low angle looking up'],
    prompt: 'Clean studio portrait on a plain light background, consistent lighting' },
  { id: 'tryon', label: 'Virtual try-on', hint: 'Add an outfit photo; see it worn', mode: 'photo', count: 2, needs: 'outfit',
    prompt: 'Full-body photo wearing the outfit from the reference image exactly, city street, golden hour' },
  { id: 'ugc', label: 'UGC product ad', hint: 'Add a product photo; holding it to camera', mode: 'photo', count: 3, needs: 'product',
    shots: ['holding the product up to the camera, excited expression', 'using the product, close-up of hands and face', 'product on a table beside them, pointing at it'],
    prompt: 'Phone-shot UGC style, bedroom or kitchen, natural daylight, authentic and unpolished' },
  { id: 'talking', label: 'Talking video', hint: 'A short selfie video to camera', mode: 'video', seconds: 8, ratio: '9:16',
    prompt: 'Selfie video talking to camera, relaxed and friendly, natural hand gestures, soft window light' },
]

// ── Job feed (this browser only) ─────────────────────────────
export const JOBS_KEY = 'muse_studio_jobs'
const MAX_JOBS = 60
export function readJobs() {
  try {
    const list = JSON.parse(localStorage.getItem(JOBS_KEY) || '[]')
    // Jobs still "running" from an earlier page load can't be resumed here.
    return list.map(j => (j.status === 'running' && j.sessionId !== SESSION ? { ...j, status: j.urls?.length ? 'done' : 'interrupted' } : j))
  } catch { return [] }
}
export function writeJobs(list) {
  try { localStorage.setItem(JOBS_KEY, JSON.stringify(list.slice(0, MAX_JOBS))) } catch (e) { console.warn('studio jobs not saved', e) }
}
export const SESSION = `${Date.now().toString(36)}`

// Results also go to the shared photo history ('photo_studio_history') so Content → Media shows them.
// `recipe` is the exact Studio settings that produced this item, so the
// viewer can show them and "Recreate" can reopen Studio with them.
export const RECIPE_KEYS = ['mode', 'prompt', 'motion', 'model', 'ratio', 'resolution', 'seconds', 'count', 'influencerId', 'refs']
export function toRecipe(settings, credits) {
  const r = {}
  RECIPE_KEYS.forEach(k => { if (settings?.[k] != null) r[k] = settings[k] })
  if (Array.isArray(r.refs)) r.refs = r.refs.filter(x => typeof x === 'string' && !x.startsWith('data:'))
  if (credits != null) r.credits = credits
  return r
}

export function addToMediaHistory({ url, influencer, ratio, jobId, recipe }) {
  try {
    const key = 'photo_studio_history'
    const prev = JSON.parse(localStorage.getItem(key) || '[]')
    const item = { histId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url, batchId: jobId, influencerId: influencer?.id, influencerName: influencer?.name, aspectRatio: ratio, createdAt: Date.now(), settings: { aspectRatio: ratio, source: 'studio', ...(recipe ? { recipe } : {}) } }
    localStorage.setItem(key, JSON.stringify([item, ...prev].slice(0, 200)))
    window.dispatchEvent(new CustomEvent('photo_studio_history_updated'))
  } catch {}
}

// Remote Higgsfield/OpenAI images go through the existing image proxy so the
// upload step can read them; data URLs are used as they are.
export function uploadable(url) {
  if (!url || url.startsWith('data:') || url.startsWith('/')) return url
  return `/api/img-proxy?url=${encodeURIComponent(url)}`
}

// Builds the final prompt with @imageN tags in the order the refs are uploaded:
// face, outfit/style refs, close-ups.
export function buildStudioPrompt({ prompt, shot, influencer, refCount, hasFace, closeUps }) {
  let i = 0
  const parts = []
  if (hasFace && influencer) parts.push(`@image${++i} is ${influencer.name}: keep this exact face, identity, skin tone and hair.`)
  const refTags = Array.from({ length: refCount }, () => `@image${++i}`)
  if (refTags.length) parts.push(`Use ${refTags.join(', ')} as reference for outfit, product or style; reproduce what they show exactly.`)
  const cuTags = Array.from({ length: closeUps }, () => `@image${++i}`)
  if (cuTags.length) parts.push(`${cuTags.join(' and ')} show facial detail for consistency.`)
  const scene = [prompt, shot].filter(Boolean).join('. ')
  return [parts.join(' '), scene, 'Photorealistic, natural skin texture, not airbrushed.'].filter(Boolean).join('\n')
}
