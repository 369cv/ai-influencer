// Runs a workflow template step by step with the same generation code Studio uses.
//
// A run lives in localStorage (RUNS_KEY) so Workflows can show progress and history.
// It keeps going while you move around the app; closing or reloading the page stops
// it (marked "Stopped" on the next load, like Studio jobs). Nothing is ever posted
// automatically: a Post step waits for you to review, then adds a planned post to
// Content's queue, where you send it as usual.
import { readJSON, writeJSON, newId } from './localJson'
import { generateNImages, generateVideo, elementFor } from './higgsfieldGenerate'
import { runSkill, influencerContext } from './claudeAssist'
import { skillsFor } from './skills'
import { DEFAULTS, addToMediaHistory, uploadable, buildStudioPrompt, SESSION } from './studio'
import { estimateImageCredits, estimateVideoCredits } from './creditEstimate'
import { nextFreeSlot } from './schedule'
import { INTEGRATIONS } from './workflows'

export const RUNS_KEY = 'muse_workflow_runs'
const MAX_RUNS = 40

const PHOTO = { model: DEFAULTS.photo.model, resolution: DEFAULTS.photo.resolution, ratio: '9:16' }
const VIDEO = { model: 'seedance_2_0', resolution: '720p', seconds: 5, ratio: '9:16' }

// Step kinds the engine can run. Voice and talking clips aren't built yet.
const RUNNABLE = new Set(['photo', 'video', 'caption', 'post', 'save'])
export function runnable(t) {
  const bad = t.steps.filter(s => !RUNNABLE.has(s.kind) || !INTEGRATIONS[s.app]?.available)
  return { ok: bad.length === 0, blocked: bad }
}

// Credits a run will use, given the setup (a picked start photo skips generating one).
export function estimateRun(t, setup = {}) {
  let credits = 0
  for (const s of t.steps) {
    if (s.kind === 'photo' && !setup.startPhoto) credits += estimateImageCredits(PHOTO.model, PHOTO.resolution, 1) || 0
    if (s.kind === 'video') credits += estimateVideoCredits(VIDEO.model, VIDEO.resolution, VIDEO.seconds, 1) || 0
  }
  return credits
}

// ── storage ──────────────────────────────────────────────────
// A run still "running" from an earlier page load can't continue here.
export const normalizeRuns = list => (list || []).map(r => (r.status === 'running' && r.sessionId !== SESSION
    ? { ...r, status: 'stopped', error: 'Stopped: the page was closed or reloaded while it ran.', steps: r.steps.map(s => (s.status === 'running' ? { ...s, status: 'stopped' } : s)) }
    : r))
export function readRuns() { return normalizeRuns(readJSON(RUNS_KEY, [])) }
function saveRun(id, patch) {
  const list = readRuns()
  const next = list.map(r => (r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch), updatedAt: Date.now() } : r))
  writeJSON(RUNS_KEY, next.slice(0, MAX_RUNS))
}
const setStep = (id, i, patch) => saveRun(id, r => ({ steps: r.steps.map((s, n) => (n === i ? { ...s, ...patch } : s)) }))

// Test hook: in development the browser tests can swap the generators.
const deps = () => (import.meta.env?.DEV && typeof window !== 'undefined' && window.__museRunDeps) || { generateNImages, generateVideo, runSkill }

const cancelled = {}
export function cancelRun(id) { cancelled[id] = true }

// ── steps ────────────────────────────────────────────────────
async function photoStep(step, ctx, onProgress) {
  if (ctx.setup.startPhoto) return { url: ctx.setup.startPhoto, note: 'Used the photo you picked' }
  const inf = ctx.influencer
  const ref = ctx.setup.reference ? uploadable(ctx.setup.reference) : null
  const face = inf?.mainImage ? uploadable(inf.mainImage) : null
  const closeUps = [inf?.closeUpImage1, inf?.closeUpImage2].filter(Boolean).map(uploadable)
  const prompt = buildStudioPrompt({ prompt: ctx.setup.scene, influencer: inf, refCount: ref ? 1 : 0, hasFace: !!face, closeUps: closeUps.length })
  let url = null
  await deps().generateNImages({
    prompt: [prompt], count: 1, aspectRatio: ctx.setup.ratio || PHOTO.ratio, resolution: PHOTO.resolution, model: PHOTO.model,
    referenceImage: face, outfitImage: ref, propImages: closeUps, elementId: elementFor(inf),
    onProgress, isCancelled: () => cancelled[ctx.runId],
    onResult: u => { url = url || u },
  })
  if (!url) throw new Error('No photo came back. Check your Higgsfield dashboard.')
  const ratio = ctx.setup.ratio || PHOTO.ratio
  addToMediaHistory({ url, influencer: inf, ratio, jobId: ctx.runId, recipe: { mode: 'photo', prompt: ctx.setup.scene, model: PHOTO.model, ratio, influencerId: inf?.id } })
  return { url }
}

async function videoStep(step, ctx, onProgress) {
  const inf = ctx.influencer
  if (!ctx.out.photo) throw new Error('The video step needs a photo from the step before.')
  const result = await deps().generateVideo({
    prompt: [inf && `The person is ${inf.name}; keep their exact face and look.`, ctx.setup.motion || 'Subtle natural movement, a slow push-in, relaxed and candid.'].filter(Boolean).join(' '),
    aspectRatio: VIDEO.ratio, duration: VIDEO.seconds, count: 1, model: VIDEO.model, resolution: VIDEO.resolution,
    referenceImages: [ctx.out.photo, inf?.mainImage].filter(Boolean).slice(0, 4).map(uploadable),
    onProgress, isCancelled: () => cancelled[ctx.runId],
  })
  const url = (result?.urls || []).find(Boolean)
  if (!url) throw new Error('No video came back. Check your Higgsfield dashboard.')
  addToMediaHistory({ url, influencer: inf, ratio: VIDEO.ratio, jobId: ctx.runId, recipe: { mode: 'video', model: VIDEO.model, seconds: VIDEO.seconds, influencerId: inf?.id } })
  return { url }
}

async function captionStep(step, ctx) {
  const skill = skillsFor('caption')[0]
  const text = await deps().runSkill({
    skill,
    task: `${step.title}. ${step.detail}. ${ctx.setup.scene ? `The post shows: ${ctx.setup.scene}.` : ''} ${ctx.setup.brand ? `This is a paid partnership with ${ctx.setup.brand}: include #ad and their handle.` : ''} Reply with the caption only.`,
    context: influencerContext(ctx.influencer),
    maxTokens: 500,
  })
  if (!text?.trim()) throw new Error('Claude returned an empty caption.')
  return { text: text.trim() }
}


// Runs a template for one influencer. Resolves the run id; progress is in storage.
export async function startRun(t, { influencer, setup }) {
  const id = newId('run')
  const run = {
    id, sessionId: SESSION, templateId: t.id, title: t.title, influencerId: influencer?.id, influencerName: influencer?.name,
    status: 'running', createdAt: Date.now(), credits: estimateRun(t, setup), setup,
    steps: t.steps.map(s => ({ kind: s.kind, app: s.app, title: s.title, status: 'waiting' })),
  }
  writeJSON(RUNS_KEY, [run, ...readRuns()].slice(0, MAX_RUNS))
  const ctx = { runId: id, influencer, setup, out: {} }
  ;(async () => {
    for (let i = 0; i < t.steps.length; i++) {
      const step = t.steps[i]
      if (cancelled[id]) { saveRun(id, r => ({ status: 'cancelled', steps: r.steps.map((s, n) => (n >= i ? { ...s, status: 'skipped' } : s)) })); return }
      setStep(id, i, { status: 'running', progress: 0, startedAt: Date.now() })
      const onProgress = p => setStep(id, i, { progress: Math.round(p) })
      try {
        if (step.kind === 'photo') { const r = await photoStep(step, ctx, onProgress); ctx.out.photo = r.url; setStep(id, i, { status: 'done', url: r.url, note: r.note }) }
        else if (step.kind === 'video') { const r = await videoStep(step, ctx, onProgress); ctx.out.video = r.url; setStep(id, i, { status: 'done', url: r.url }) }
        else if (step.kind === 'caption') { const r = await captionStep(step, ctx); ctx.out.caption = r.text; setStep(id, i, { status: 'done', text: r.text }) }
        else if (step.kind === 'save') { setStep(id, i, { status: 'done', note: 'In Content → Media' }) }
        else if (step.kind === 'post') {
          // Stop here for review; Add to queue finishes the run (see queueRunPost).
          setStep(id, i, { status: 'review', platform: step.app })
          saveRun(id, { status: 'review', media: ctx.out.video || ctx.out.photo, caption: ctx.out.caption || '' })
          return
        }
      } catch (e) {
        const stop = /CANCELLED/.test(e?.message || '') || cancelled[id]
        setStep(id, i, { status: stop ? 'skipped' : 'failed', error: stop ? '' : e?.message || 'Failed' })
        saveRun(id, r => ({ status: stop ? 'cancelled' : 'failed', error: stop ? '' : `${step.title}: ${e?.message || 'Failed'}`, steps: r.steps.map((s, n) => (n > i ? { ...s, status: 'skipped' } : s)) }))
        return
      }
    }
    saveRun(id, { status: 'done', media: ctx.out.video || ctx.out.photo, caption: ctx.out.caption || '' })
  })().finally(() => { delete cancelled[id] })
  return id
}

// Review → "Add to queue": a planned post for this influencer's accounts on the step's
// platform, in her next free slot (or a draft with no date). Sending stays in Content.
export function queueRunPost(runId, { influencer, accounts, posts, caption }) {
  const run = readRuns().find(r => r.id === runId)
  if (!run) throw new Error('Run not found.')
  const i = run.steps.findIndex(s => s.kind === 'post' && s.status === 'review')
  const platform = run.steps[i]?.platform
  const mine = accounts.filter(a => a.influencerId === influencer?.id)
  const target = mine.filter(a => a.platform === platform)
  const slot = influencer?.postingSchedule ? nextFreeSlot(influencer.postingSchedule, posts, influencer.id) : null
  const post = {
    id: newId('post'), influencerId: influencer?.id || null, caption: caption ?? run.caption ?? '', mediaUrls: run.media ? [run.media] : [],
    accountIds: (target.length ? target : mine).map(a => a.id), scheduledAt: slot ? slot.at.toISOString() : '',
    status: slot ? 'planned' : 'draft', createdAt: Date.now(), updatedAt: Date.now(), source: { workflow: run.templateId, runId },
    ...(platform === 'instagram' && /\.(mp4|webm|mov)(\?|$)/i.test(run.media || '') ? { igFormat: 'reel' } : {}),
  }
  setStep(runId, i, { status: 'done', postId: post.id })
  saveRun(runId, { status: 'done', postId: post.id })
  return post
}

export function discardRunPost(runId) {
  const run = readRuns().find(r => r.id === runId)
  const i = run?.steps.findIndex(s => s.kind === 'post' && s.status === 'review')
  if (i >= 0) setStep(runId, i, { status: 'skipped', note: 'Not queued' })
  saveRun(runId, { status: 'done' })
}

