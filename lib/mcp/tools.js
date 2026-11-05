// Tool registry for the AI Influencer Studio MCP server.
//
// Every tool is a plain object: { name, title, description, tier, annotations,
// inputSchema, handler }. `tier` drives the safety rails in server.js:
//
//   free  — read-only / pure. No auth, no cost. Safe to call freely.
//   auth  — needs the caller's Higgsfield Bearer token but spends nothing.
//   paid  — spends the caller's Higgsfield credits. Requires a Bearer token,
//           `confirmed: true`, an `idempotencyKey`, and an `estimateId` from
//           the matching preview tool.
//
// Handlers return a plain JSON object. server.js wraps it as MCP content.

import { createHash } from 'node:crypto'
import { buildThreeVariationPrompts, VIBE_PALETTE_MAP } from '../../src/utils/systemPrompt.js'
import {
  LOCATIONS, TIMES, VIBES, EXPRESSIONS, ASPECTS,
  POSES_FEMALE_STANDING, POSES_MALE_STANDING,
  OUTFIT_PRESETS_FEMALE, OUTFIT_PRESETS_MALE,
  buildPhotoStudioPrompt,
} from '../../src/utils/photoStudioPrompt.js'
import { callHiggsfieldTool, extractJobIds, extractImageUrls, unwrapContent } from './higgsfield.js'

export const SERVER_VERSION = '0.1.0'

// ── Shared definitions ───────────────────────────────────────────────────────

const MODELS = [
  { id: 'gpt_image_2',       kind: 'image', notes: 'Default. Best prompt adherence; detailed pose instructions work.' },
  { id: 'soul_2',            kind: 'image', notes: 'Higgsfield Soul. Uses the simplified pose set — struggles with detailed spatial pose text.' },
  { id: 'nano_banana_2',     kind: 'image', notes: 'Fast, good for edits with reference images.' },
  { id: 'nano_banana_flash', kind: 'image', notes: 'Fastest / cheapest image option.' },
  { id: 'seedance_2_0',      kind: 'video', notes: 'Video. Not exposed by this server yet — use the app Video Studio.' },
]
const IMAGE_MODELS = MODELS.filter(m => m.kind === 'image').map(m => m.id)

const PROFILE_SCHEMA = {
  type: 'object',
  description: 'Influencer profile. Same shape the app stores in localStorage (extra fields are ignored).',
  properties: {
    name:         { type: 'string', maxLength: 80 },
    gender:       { type: 'string', enum: ['Female', 'Male'] },
    age:          { type: ['integer', 'string'] },
    physicalDesc: { type: 'string', maxLength: 2000, description: 'Face, hair, skin, build — feeds the Subject block verbatim.' },
    backstory:    { type: 'string', maxLength: 4000, description: 'Profession/life detail. A detected profession locks one variation to a matching scene.' },
    personality:  { type: 'integer', minimum: 0, maximum: 100, description: '0 = introvert, 100 = extrovert. Drives wardrobe AND pose energy.' },
    vibeWords:    { type: 'array', items: { type: 'string' }, maxItems: 6 },
    niches:       { type: 'array', items: { type: 'string' }, maxItems: 6 },
    build:        { type: 'string', maxLength: 200 },
  },
  required: ['gender'],
}

const IDEMPOTENCY_KEY = {
  type: 'string', minLength: 8, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$',
  description: 'Deterministic key, e.g. "genimg-kayla-20261105-01". Retry with the SAME key on timeout — never a new one.',
}

const sha256 = s => createHash('sha256').update(s).digest('hex')

// Stable JSON (sorted keys) so the same params always hash the same.
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
  }
  return JSON.stringify(v)
}

// The estimateId is a hash of the exact params. Start tools recompute it, so a
// caller cannot preview one thing and then spend on another — and the server
// needs no storage to enforce that.
const estimateIdFor = params => `est_${sha256(`${SERVER_VERSION}:${canonical(params)}`).slice(0, 24)}`

function profileWarnings(p) {
  const w = []
  if (!p.physicalDesc?.trim()) w.push('physicalDesc is empty — the subject will be generic and drift between images.')
  if (p.personality === undefined) w.push('personality missing — defaulting to 50 (balanced).')
  if (!p.vibeWords?.length) w.push('no vibeWords — wardrobe falls back to personality-only selection.')
  const unknownVibes = (p.vibeWords || []).filter(v => !VIBE_PALETTE_MAP[v])
  if (unknownVibes.length) w.push(`unknown vibeWords (no palette): ${unknownVibes.join(', ')}`)
  return w
}

// Idempotency store. In-memory per server instance — fine for one region and
// dev; swap for Vercel KV / Upstash / Postgres in production (same interface).
const idempotency = new Map() // `${tokenHash}:${key}` -> { paramsHash, response }

// ── Tools ────────────────────────────────────────────────────────────────────

export const TOOLS = [
  {
    name: 'studio_get_server_info',
    title: 'Server info & rules',
    tier: 'free',
    description: 'Start here. Returns server version, the tool tiers (free vs credit-spending), the rules for paid calls, and the model catalog.',
    annotations: { readOnlyHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => ({
      server: 'ai-influencer-studio', version: SERVER_VERSION,
      tiers: {
        free: TOOLS.filter(t => t.tier === 'free').map(t => t.name),
        auth: TOOLS.filter(t => t.tier === 'auth').map(t => t.name),
        paid: TOOLS.filter(t => t.tier === 'paid').map(t => t.name),
      },
      paidCallRules: [
        'Call studio_preview_image_generation first and show the estimate to the user.',
        'Pass confirmed: true, the estimateId, and a deterministic idempotencyKey.',
        'On timeout or ambiguous failure, retry with the SAME idempotencyKey.',
        'Record every returned jobId before moving on.',
      ],
      auth: 'auth and paid tools need "Authorization: Bearer <Higgsfield access token>". Free tools need nothing.',
      models: MODELS,
    }),
  },

  {
    name: 'studio_list_catalog',
    title: 'List creative catalog',
    tier: 'free',
    description: 'List the creative options the prompt builders accept: locations, times, poses, vibes, expressions, outfit presets, aspect ratios, vibe words, models.',
    annotations: { readOnlyHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: ['all', 'locations', 'times', 'poses', 'vibes', 'expressions', 'outfits', 'aspects', 'vibeWords', 'models'] },
        gender:  { type: 'string', enum: ['Female', 'Male'], description: 'Poses and outfits differ by gender. Default Female.' },
      },
      additionalProperties: false,
    },
    handler: ({ section = 'all', gender = 'Female' }) => {
      const male = gender === 'Male'
      const all = {
        locations:   LOCATIONS.map(({ id, label }) => ({ id, label })),
        times:       TIMES,
        poses:       (male ? POSES_MALE_STANDING : POSES_FEMALE_STANDING).map(({ id, label }) => ({ id, label })),
        vibes:       VIBES,
        expressions: EXPRESSIONS.map(({ id, label }) => ({ id, label })),
        outfits:     (male ? OUTFIT_PRESETS_MALE : OUTFIT_PRESETS_FEMALE).map(({ id, label }) => ({ id, label })),
        aspects:     ASPECTS,
        vibeWords:   Object.keys(VIBE_PALETTE_MAP),
        models:      MODELS,
      }
      return section === 'all' ? all : { [section]: all[section] }
    },
  },

  {
    name: 'studio_validate_influencer',
    title: 'Validate influencer profile',
    tier: 'free',
    description: 'Check an influencer profile before building prompts. Returns errors (blocking) and dataWarnings (quality risks such as an empty physicalDesc that causes identity drift).',
    annotations: { readOnlyHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: { influencer: { ...PROFILE_SCHEMA, required: [] } },
      required: ['influencer'],
      additionalProperties: false,
    },
    handler: ({ influencer }) => {
      const errors = []
      if (!['Female', 'Male'].includes(influencer.gender)) errors.push('gender must be "Female" or "Male".')
      return { valid: errors.length === 0, errors, dataWarnings: profileWarnings(influencer) }
    },
  },

  {
    name: 'studio_build_portrait_prompts',
    title: 'Build 3 portrait prompts',
    tier: 'free',
    description: 'Build the three distinct iPhone-realism portrait prompts the Create wizard uses (front-facing, posed, candid/profession-locked). Pure text — spends nothing. Output is randomized within the profile constraints; call again for new variations.',
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        influencer:  PROFILE_SCHEMA,
        model:       { type: 'string', enum: ['gpt_image_2', 'soul_2'], description: 'Soul gets the simplified pose set.' },
        aspectRatio: { type: 'string', enum: ['9:16', '16:9'] },
      },
      required: ['influencer'],
      additionalProperties: false,
    },
    handler: ({ influencer, model = 'gpt_image_2', aspectRatio = '9:16' }) => ({
      model, aspectRatio,
      prompts: buildThreeVariationPrompts(influencer, aspectRatio, model),
      dataWarnings: profileWarnings(influencer),
    }),
  },

  {
    name: 'studio_build_photo_studio_prompt',
    title: 'Build Photo Studio prompt',
    tier: 'free',
    description: 'Build one Photo Studio prompt (location × time × pose × vibe × outfit × expression). Use studio_list_catalog for valid ids. Pure text — spends nothing.',
    annotations: { readOnlyHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        influencer:   PROFILE_SCHEMA,
        location:     { type: 'string', enum: LOCATIONS.map(l => l.id) },
        timeOfDay:    { type: 'string', enum: TIMES.map(t => t.id) },
        pose:         { type: 'string', maxLength: 40 },
        vibe:         { type: 'string', enum: VIBES.map(v => v.id) },
        expression:   { type: 'string', enum: EXPRESSIONS.map(e => e.id) },
        stance:       { type: 'string', enum: ['standing', 'sitting'] },
        outfitPreset: { type: 'string', maxLength: 40 },
        wardrobeText: { type: 'string', maxLength: 1000 },
        propText:     { type: 'string', maxLength: 300 },
        aspectRatio:  { type: 'string', enum: ASPECTS },
      },
      required: ['influencer'],
      additionalProperties: false,
    },
    handler: (args) => ({ prompt: buildPhotoStudioPrompt(args), dataWarnings: profileWarnings(args.influencer) }),
  },

  {
    name: 'studio_preview_image_generation',
    title: 'Preview image generation',
    tier: 'free',
    description: 'REQUIRED before studio_start_image_generation. Normalizes the params and returns an estimateId bound to them. Show the preview to the user and wait for approval — never chain straight into the start call.',
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        prompt:      { type: 'string', minLength: 20, maxLength: 12000 },
        model:       { type: 'string', enum: IMAGE_MODELS },
        aspectRatio: { type: 'string', enum: ['9:16', '16:9', '1:1', '4:5'] },
        count:       { type: 'integer', minimum: 1, maximum: 4 },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
    handler: ({ prompt, model = 'gpt_image_2', aspectRatio = '9:16', count = 1 }) => {
      const params = { prompt, model, aspectRatio, count }
      return {
        estimateId: estimateIdFor(params),
        params,
        cost: {
          unit: 'Higgsfield credits',
          estimatedCredits: null,
          note: 'Billed by Higgsfield on the caller\'s own plan. Exact per-image cost depends on their plan — check it in Higgsfield before confirming.',
        },
        next: 'Show this to the user. If approved, call studio_start_image_generation with confirmed: true, this estimateId, the same params, and an idempotencyKey.',
      }
    },
  },

  {
    name: 'studio_start_image_generation',
    title: 'Start image generation (spends credits)',
    tier: 'paid',
    description: 'Spends the caller\'s Higgsfield credits. Requires a prior preview: pass the same params, its estimateId, confirmed: true and a deterministic idempotencyKey. Returns jobIds — poll with studio_get_job_status.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        prompt:         { type: 'string', minLength: 20, maxLength: 12000 },
        model:          { type: 'string', enum: IMAGE_MODELS },
        aspectRatio:    { type: 'string', enum: ['9:16', '16:9', '1:1', '4:5'] },
        count:          { type: 'integer', minimum: 1, maximum: 4 },
        estimateId:     { type: 'string', pattern: '^est_[0-9a-f]{24}$' },
        confirmed:      { type: 'boolean', const: true, description: 'Must be true — set only after the user approved the preview.' },
        idempotencyKey: IDEMPOTENCY_KEY,
      },
      required: ['prompt', 'estimateId', 'confirmed', 'idempotencyKey'],
      additionalProperties: false,
    },
    handler: async ({ prompt, model = 'gpt_image_2', aspectRatio = '9:16', count = 1, estimateId, idempotencyKey }, ctx) => {
      const params = { prompt, model, aspectRatio, count }
      if (estimateIdFor(params) !== estimateId) {
        throw toolError('estimate_mismatch', 'These params do not match the estimateId. Re-run studio_preview_image_generation with the params you intend to spend on.')
      }

      const storeKey = `${sha256(ctx.token).slice(0, 16)}:${idempotencyKey}`
      const paramsHash = sha256(canonical(params))
      const prior = idempotency.get(storeKey)
      if (prior) {
        if (prior.paramsHash !== paramsHash) {
          throw toolError('idempotency_conflict', 'This idempotencyKey was already used with different params. Use a new key for a new request.')
        }
        return { ...prior.response, replayed: true }
      }

      // Same base params the app uses (see modelBaseParams in higgsfieldGenerate.js).
      const hfParams = model === 'soul_2'
        ? { model, aspect_ratio: aspectRatio, quality: '2k', prompt }
        : model === 'gpt_image_2'
        ? { model, aspect_ratio: aspectRatio, count, quality: 'high', prompt }
        : { model, aspect_ratio: aspectRatio, count, resolution: '2k', prompt }

      const result = await callHiggsfieldTool(ctx.token, 'generate_image', { params: hfParams })
      const response = {
        status: 'submitted',
        jobIds: extractJobIds(result),
        imageUrls: extractImageUrls(result),
        estimateId, idempotencyKey,
        next: 'Record the jobIds, then poll studio_get_job_status every ~5s until completed.',
      }
      idempotency.set(storeKey, { paramsHash, response })
      return response
    },
  },

  {
    name: 'studio_get_job_status',
    title: 'Get job status',
    tier: 'auth',
    description: 'Poll a Higgsfield job started by studio_start_image_generation. Free (no credits) but needs the Bearer token. Returns status and any result URLs.',
    annotations: { readOnlyHint: true, openWorldHint: true },
    inputSchema: {
      type: 'object',
      properties: { jobId: { type: 'string', minLength: 8, maxLength: 64 } },
      required: ['jobId'],
      additionalProperties: false,
    },
    handler: async ({ jobId }, ctx) => {
      const result = await callHiggsfieldTool(ctx.token, 'job_status', { jobId })
      const data = unwrapContent(result)
      return {
        jobId,
        status: (data?.status || data?.job_status || 'unknown').toString().toLowerCase(),
        imageUrls: extractImageUrls(result),
        raw: typeof data === 'string' ? data.slice(0, 2000) : data,
      }
    },
  },
]

export function toolError(code, message) {
  const e = new Error(message)
  e.toolCode = code
  return e
}
