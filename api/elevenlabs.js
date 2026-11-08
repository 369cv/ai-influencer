// ElevenLabs proxy. The caller's own key comes in as x-api-key and goes only to
// api.elevenlabs.io as xi-api-key. Two operations, nothing else:
//   GET  /api/elevenlabs?op=voices            → { voices: [{ voice_id, name, labels, preview_url, category }] }
//   POST /api/elevenlabs?op=tts&voice=<id>    → audio/mpeg
//        body { text, model_id?, voice_settings?, seed? }  (text ≤ 600 chars: previews only)
//   GET  /api/elevenlabs?op=usage             → { tier, used, limit, resetsAt }
//   POST /api/elevenlabs?op=design            → { text, previews: [{ id, audio (base64 mp3), duration }] }
//        body { description (20–1000), text? (100–1000), model? }
//   POST /api/elevenlabs?op=save              → { voice_id, name }
//        body { name, description, generated_voice_id }
//   GET  /api/elevenlabs?op=library&search=&gender=&age=&accent=&language=&use_case=&page=
//                                             → { voices: [...], hasMore }
//   POST /api/elevenlabs?op=add               → { voice_id }   body { public_owner_id, voice_id, name }
//   POST /api/elevenlabs?op=remix&voice=<id>  → like design    body { description, text? }
//   POST /api/elevenlabs?op=speech&voice=<id> → { audio (base64 mp3), alignment: { characters, starts, ends } }
//        body { text (≤ 1,500), model_id?, voice_settings?, seed? }   full voiceover with timing for captions
import { rateLimit, clientIp } from '../lib/rateLimit.js'

const BASE = 'https://api.elevenlabs.io'
const MAX_TEXT = 600
const MAX_SPEECH = 1500
export const SPEECH_MODELS = ['eleven_v4', 'eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_v3']
const VOICE_ID = /^[A-Za-z0-9]{8,40}$/
const MODEL_ID = /^[a-z0-9_]{3,40}$/
// ElevenLabs errors come as a string, { message } or a validation array; always return plain text.
const errText = (data, fallback) => {
  const d = data?.detail
  if (typeof d === 'string') return d
  if (typeof d?.message === 'string') return d.message
  if (Array.isArray(d) && typeof d[0]?.msg === 'string') return d[0].msg
  return fallback
}
const clamp = (v, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined)

// Shared by the Vercel function and the Vite dev mirror.
export async function handleElevenLabs({ method, op, voice, key, body, query = {} }) {
  if (!key) return { status: 400, json: { error: 'Add your ElevenLabs key in Settings → Connections.' } }
  const headers = { 'xi-api-key': key }

  if (op === 'voices' && method === 'GET') {
    const r = await fetch(`${BASE}/v1/voices`, { headers })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs refused the request.') } }
    const voices = (data.voices || []).map(v => ({ voice_id: v.voice_id, name: v.name, labels: v.labels || {}, preview_url: v.preview_url || '', category: v.category || '' }))
    return { status: 200, json: { voices } }
  }

  // Full voiceover for a talking video, with per-character timing for captions.
  if (op === 'speech' && method === 'POST') {
    if (!VOICE_ID.test(voice || '')) return { status: 400, json: { error: 'Pick her voice first.' } }
    const text = String(body?.text || '').trim()
    if (!text) return { status: 400, json: { error: 'Write the script first.' } }
    if (text.length > MAX_SPEECH) return { status: 413, json: { error: `Scripts are limited to ${MAX_SPEECH.toLocaleString()} characters.` } }
    const s = body?.voice_settings || {}
    const payload = {
      text,
      model_id: SPEECH_MODELS.includes(body?.model_id) ? body.model_id : 'eleven_v4',
      voice_settings: { stability: clamp(s.stability, 0, 1), similarity_boost: clamp(s.similarity_boost, 0, 1), style: clamp(s.style, 0, 1), speed: clamp(s.speed, 0.7, 1.2), use_speaker_boost: s.use_speaker_boost !== false },
    }
    if (Number.isInteger(body?.seed)) payload.seed = Math.min(4294967295, Math.max(0, body.seed))
    const r = await fetch(`${BASE}/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs could not make the voiceover.') } }
    const a = data.alignment || data.normalized_alignment || {}
    return { status: 200, json: { audio: data.audio_base64, alignment: { characters: a.characters || [], starts: a.character_start_times_seconds || [], ends: a.character_end_times_seconds || [] } } }
  }

  if (op === 'tts' && method === 'POST') {
    if (!VOICE_ID.test(voice || '')) return { status: 400, json: { error: 'Pick a voice first.' } }
    const text = String(body?.text || '').trim()
    if (!text) return { status: 400, json: { error: 'Type a line to preview.' } }
    if (text.length > MAX_TEXT) return { status: 413, json: { error: `Previews are limited to ${MAX_TEXT} characters.` } }
    const s = body?.voice_settings || {}
    const payload = {
      text,
      model_id: MODEL_ID.test(body?.model_id || '') ? body.model_id : 'eleven_multilingual_v2',
      voice_settings: {
        stability: clamp(s.stability, 0, 1),
        similarity_boost: clamp(s.similarity_boost, 0, 1),
        style: clamp(s.style, 0, 1),
        speed: clamp(s.speed, 0.7, 1.2),
        use_speaker_boost: s.use_speaker_boost !== false,
      },
    }
    const seed = Number.isInteger(body?.seed) ? Math.min(4294967295, Math.max(0, body.seed)) : undefined
    if (seed !== undefined) payload.seed = seed
    const r = await fetch(`${BASE}/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json', accept: 'audio/mpeg' }, body: JSON.stringify(payload),
    })
    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      return { status: r.status, json: { error: errText(data, 'ElevenLabs could not make that preview.') } }
    }
    return { status: 200, audio: Buffer.from(await r.arrayBuffer()) }
  }

  if (op === 'usage' && method === 'GET') {
    const r = await fetch(`${BASE}/v1/user/subscription`, { headers })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs refused the request.') } }
    return { status: 200, json: { tier: data.tier || '', used: data.character_count ?? null, limit: data.character_limit ?? null, resetsAt: data.next_character_count_reset_unix ? data.next_character_count_reset_unix * 1000 : null } }
  }

  // Voice Design: 3 takes from a description; nothing is saved until op=save.
  if (op === 'design' && method === 'POST') {
    const description = String(body?.description || '').trim()
    if (description.length < 20 || description.length > 1000) return { status: 400, json: { error: 'Describe the voice in 20 to 1,000 characters.' } }
    const text = String(body?.text || '').trim()
    if (text && (text.length < 100 || text.length > 1000)) return { status: 400, json: { error: 'The sample line needs 100 to 1,000 characters, or leave it empty to have one written.' } }
    const payload = { voice_description: description, model_id: body?.model === 'eleven_ttv_v3' ? 'eleven_ttv_v3' : 'eleven_multilingual_ttv_v2', ...(text ? { text } : { auto_generate_text: true }) }
    const r = await fetch(`${BASE}/v1/text-to-voice/design?output_format=mp3_44100_128`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs could not design that voice.') } }
    const previews = (data.previews || []).map(p => ({ id: p.generated_voice_id, audio: p.audio_base_64, duration: p.duration_secs ?? null }))
    return { status: 200, json: { text: data.text || text, previews } }
  }

  if (op === 'save' && method === 'POST') {
    const name = String(body?.name || '').trim().slice(0, 100)
    const description = String(body?.description || '').trim().slice(0, 1000)
    const generated = String(body?.generated_voice_id || '')
    if (!name || !description || !/^[A-Za-z0-9_-]{6,80}$/.test(generated)) return { status: 400, json: { error: 'Pick a take and name the voice.' } }
    const r = await fetch(`${BASE}/v1/text-to-voice`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ voice_name: name, voice_description: description, generated_voice_id: generated }) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs could not save that voice.') } }
    return { status: 200, json: { voice_id: data.voice_id, name: data.name || name } }
  }

  // Voice Library: public voices with filters. Adding one copies it into the account.
  if (op === 'library' && method === 'GET') {
    const q = new URLSearchParams({ page_size: '30' })
    for (const k of ['search', 'gender', 'age', 'accent', 'language']) {
      const v = String(query[k] || '').trim().slice(0, 60)
      if (v) q.set(k, v)
    }
    const uc = String(query.use_case || '').trim().slice(0, 40)
    if (uc) q.append('use_cases', uc)
    const page = Number.parseInt(query.page, 10)
    if (page > 0 && page < 100) q.set('page', String(page))
    const r = await fetch(`${BASE}/v1/shared-voices?${q}`, { headers })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs refused the request.') } }
    const voices = (data.voices || []).map(v => ({ voice_id: v.voice_id, public_owner_id: v.public_owner_id, name: v.name, preview_url: v.preview_url || '', labels: { gender: v.gender, age: v.age, accent: v.accent, descriptive: v.descriptive, use_case: v.use_case, language: v.language }, category: v.category || '' }))
    return { status: 200, json: { voices, hasMore: !!data.has_more } }
  }

  if (op === 'add' && method === 'POST') {
    const owner = String(body?.public_owner_id || ''), id = String(body?.voice_id || '')
    const name = String(body?.name || '').trim().slice(0, 100)
    if (!/^[A-Za-z0-9]{8,80}$/.test(owner) || !VOICE_ID.test(id) || !name) return { status: 400, json: { error: 'Pick a voice from the library.' } }
    const r = await fetch(`${BASE}/v1/voices/add/${owner}/${id}`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ new_name: name }) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs could not add that voice.') } }
    return { status: 200, json: { voice_id: data.voice_id } }
  }

  // Voice Remix: change an existing voice (older, softer, another accent): 3 takes.
  if (op === 'remix' && method === 'POST') {
    if (!VOICE_ID.test(voice || '')) return { status: 400, json: { error: 'Pick a voice first.' } }
    const description = String(body?.description || '').trim()
    if (description.length < 5 || description.length > 1000) return { status: 400, json: { error: 'Describe the change in 5 to 1,000 characters.' } }
    const text = String(body?.text || '').trim()
    if (text && (text.length < 100 || text.length > 1000)) return { status: 400, json: { error: 'The sample line needs 100 to 1,000 characters, or leave it empty.' } }
    const r = await fetch(`${BASE}/v1/text-to-voice/${voice}/remix?output_format=mp3_44100_128`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ voice_description: description, ...(text ? { text } : { auto_generate_text: true }) }) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs could not remix that voice.') } }
    return { status: 200, json: { text: data.text || text, previews: (data.previews || []).map(p => ({ id: p.generated_voice_id, audio: p.audio_base_64, duration: p.duration_secs ?? null })) } }
  }

  return { status: 404, json: { error: 'Unknown operation.' } }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const rl = rateLimit(clientIp(req.headers))
  if (!rl.ok) { res.setHeader('Retry-After', String(rl.retryAfter)); return res.status(429).json({ error: 'Too many requests — try again in a moment.' }) }
  try {
    const out = await handleElevenLabs({ method: req.method, op: req.query.op, voice: req.query.voice, key: req.headers['x-api-key'], body: req.body, query: req.query })
    if (out.audio) { res.setHeader('Content-Type', 'audio/mpeg'); return res.status(200).send(out.audio) }
    return res.status(out.status).json(out.json)
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach ElevenLabs.' })
  }
}
