// Create: one request → a plan (free, editable) → results.
//
// A session is stored in this browser ('muse_create_sessions') so the Create page can
// list recent requests and reopen them. Nothing is generated until the plan is run.
// Photos are made with the same code Studio uses and also land in Content → Media.
import { readJSON, writeJSON, newId } from './localJson'
import { generateNImages } from './higgsfieldGenerate'
import { getClaudeKey } from './connections'
import { ASSIST_MODEL, influencerContext } from './claudeAssist'
import { DEFAULTS, addToMediaHistory, uploadable, buildStudioPrompt, SESSION } from './studio'
import { estimateImageCredits, MODEL_LABELS } from './creditEstimate'

export const SESSIONS_KEY = 'muse_create_sessions'
const MAX = 40
export const RATIOS = ['9:16', '4:5', '1:1', '16:9']
export const MAX_SHOTS = 8

// Shot variations used when Claude isn't connected (or doesn't answer).
const FALLBACK_SHOTS = [
  'standing, weight on one hip, relaxed smile, full body',
  'walking toward the camera mid-stride, candid',
  'seated, leaning forward, close medium shot',
  'over-the-shoulder glance, soft natural light',
]

// ── storage ──────────────────────────────────────────────────
export const normalizeSessions = list => (list || []).map(s => (s.status === 'running' && s.sessionId !== SESSION
  ? { ...s, status: Object.keys(s.results || {}).length ? 'done' : 'stopped', error: s.error || 'Stopped: the page was closed or reloaded while it ran.' }
  : s))
export const readSessions = () => normalizeSessions(readJSON(SESSIONS_KEY, []))
const save = list => writeJSON(SESSIONS_KEY, list.slice(0, MAX))
export function patchSession(id, patch) {
  save(readSessions().map(s => (s.id === id ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch), updatedAt: Date.now() } : s)))
}
export const getSession = id => readSessions().find(s => s.id === id)
export function deleteSession(id) { save(readSessions().filter(s => s.id !== id)) }

export const planCredits = plan => estimateImageCredits(plan.model, plan.resolution, plan.shots.length) || 0
export const modelLabel = id => MODEL_LABELS[id] || id

// Test hook: in development the browser tests can swap the generators.
const deps = () => (import.meta.env?.DEV && typeof window !== 'undefined' && window.__museRunDeps) || { generateNImages }

// ── planning ─────────────────────────────────────────────────
const shot = text => ({ id: newId('shot'), text: String(text).trim() })

function fallbackPlan(request, count = 4) {
  const scene = request.trim().replace(/\s+/g, ' ')
  return { title: scene.length > 48 ? `${scene.slice(0, 46).trim()}…` : scene, scene, shots: FALLBACK_SHOTS.slice(0, count).map(shot), source: 'template' }
}

// Asks Claude for a short shot list; returns null if it can't (no key, error, bad JSON).
async function claudePlan(request, influencer, { previous, change } = {}) {
  const key = getClaudeKey()
  if (!key) return null
  const brief = previous
    ? `Current plan:\n${JSON.stringify({ title: previous.title, scene: previous.scene, shots: previous.shots.map(s => s.text) })}\n\nChange requested: ${change}\nApply only that change; keep everything else the same.`
    : `Request: ${request}`
  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: ASSIST_MODEL, max_tokens: 700,
        system: 'You plan photoshoots for an AI influencer. Reply with JSON only: {"title": short title, "scene": one sentence describing setting, outfit and light shared by every shot, "shots": [2 to 6 short shot descriptions: pose, framing, action]}. No markdown.',
        messages: [{ role: 'user', content: [influencerContext(influencer), brief].filter(Boolean).join('\n\n') }],
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return null
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim()
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    const shots = (json.shots || []).filter(s => typeof s === 'string' && s.trim()).slice(0, MAX_SHOTS)
    if (!shots.length) return null
    return { title: String(json.title || '').slice(0, 80) || request.slice(0, 48), scene: String(json.scene || request).slice(0, 400), shots: shots.map(shot), source: 'claude' }
  } catch { return null }
}

// New session with a plan. Never generates anything.
export async function startSession({ request, influencer, ratio = '9:16' }) {
  const draft = (await claudePlan(request, influencer)) || fallbackPlan(request)
  const s = {
    id: newId('cs'), kind: 'photoshoot', request, influencerId: influencer?.id || null, influencerName: influencer?.name || '',
    status: 'plan', createdAt: Date.now(), updatedAt: Date.now(), results: {},
    plan: { ...draft, ratio, model: DEFAULTS.photo.model, resolution: DEFAULTS.photo.resolution },
  }
  save([s, ...readSessions()])
  return s.id
}

// "Change something" on the plan. Uses Claude when connected; otherwise returns false.
export async function revisePlan(id, change) {
  const s = getSession(id)
  if (!s) return false
  const next = await claudePlan(s.request, null, { previous: s.plan, change })
  if (!next) return false
  patchSession(id, x => ({ plan: { ...x.plan, title: next.title, scene: next.scene, shots: next.shots } }))
  return true
}

// ── running ──────────────────────────────────────────────────
const cancelled = {}
export const stopSession = id => { cancelled[id] = true }

// Makes every shot in the plan, or only `onlyShotIds` (Redo one shot).
export async function runSession(id, influencer, { onlyShotIds } = {}) {
  const s = getSession(id)
  if (!s) throw new Error('Request not found.')
  const shots = s.plan.shots.filter(x => !onlyShotIds || onlyShotIds.includes(x.id))
  if (!shots.length) throw new Error('Add at least one shot.')
  cancelled[id] = false
  patchSession(id, x => ({ status: 'running', sessionId: SESSION, error: '', progress: 2, running: shots.map(sh => sh.id), results: onlyShotIds ? x.results : {} }))
  const face = influencer?.mainImage ? uploadable(influencer.mainImage) : null
  const closeUps = [influencer?.closeUpImage1, influencer?.closeUpImage2].filter(Boolean).map(uploadable)
  const base = { prompt: s.plan.scene, influencer, refCount: 0, hasFace: !!face, closeUps: closeUps.length }
  let i = 0
  try {
    await deps().generateNImages({
      prompt: shots.map(sh => buildStudioPrompt({ ...base, shot: sh.text })), count: shots.length,
      aspectRatio: s.plan.ratio, resolution: s.plan.resolution, model: s.plan.model,
      referenceImage: face, outfitImage: null, propImages: closeUps,
      onProgress: p => patchSession(id, { progress: Math.max(2, Math.round(p)) }),
      isCancelled: () => cancelled[id],
      onResult: url => {
        const sh = shots[Math.min(i++, shots.length - 1)]
        patchSession(id, x => ({ results: { ...x.results, [sh.id]: url }, running: (x.running || []).filter(r => r !== sh.id) }))
        addToMediaHistory({ url, influencer, ratio: s.plan.ratio, jobId: id, recipe: { mode: 'photo', prompt: `${s.plan.scene}. ${sh.text}`, model: s.plan.model, ratio: s.plan.ratio, influencerId: influencer?.id } })
      },
    })
    patchSession(id, x => ({ status: Object.keys(x.results).length ? 'done' : 'failed', running: [], progress: 100, error: Object.keys(x.results).length ? '' : 'Nothing came back. Check your Higgsfield dashboard.' }))
  } catch (e) {
    const stop = /CANCELLED/.test(e?.message || '') || cancelled[id]
    patchSession(id, x => ({ status: Object.keys(x.results).length ? 'done' : stop ? 'plan' : 'failed', running: [], error: stop ? '' : e?.message || 'Failed' }))
  } finally { delete cancelled[id] }
}
