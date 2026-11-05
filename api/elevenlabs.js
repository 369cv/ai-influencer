// ElevenLabs proxy. The caller's own key comes in as x-api-key and goes only to
// api.elevenlabs.io as xi-api-key. Two operations, nothing else:
//   GET  /api/elevenlabs?op=voices            → { voices: [{ voice_id, name, labels, preview_url, category }] }
//   POST /api/elevenlabs?op=tts&voice=<id>    → audio/mpeg
//        body { text, model_id?, voice_settings?, seed? }  (text ≤ 600 chars: previews only)
import { rateLimit, clientIp } from '../lib/rateLimit.js'

const BASE = 'https://api.elevenlabs.io'
const MAX_TEXT = 600
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
export async function handleElevenLabs({ method, op, voice, key, body }) {
  if (!key) return { status: 400, json: { error: 'Add your ElevenLabs key in Settings → Connections.' } }
  const headers = { 'xi-api-key': key }

  if (op === 'voices' && method === 'GET') {
    const r = await fetch(`${BASE}/v1/voices`, { headers })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: r.status, json: { error: errText(data, 'ElevenLabs refused the request.') } }
    const voices = (data.voices || []).map(v => ({ voice_id: v.voice_id, name: v.name, labels: v.labels || {}, preview_url: v.preview_url || '', category: v.category || '' }))
    return { status: 200, json: { voices } }
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

  return { status: 404, json: { error: 'Unknown operation.' } }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const rl = rateLimit(clientIp(req.headers))
  if (!rl.ok) { res.setHeader('Retry-After', String(rl.retryAfter)); return res.status(429).json({ error: 'Too many requests — try again in a moment.' }) }
  try {
    const out = await handleElevenLabs({ method: req.method, op: req.query.op, voice: req.query.voice, key: req.headers['x-api-key'], body: req.body })
    if (out.audio) { res.setHeader('Content-Type', 'audio/mpeg'); return res.status(200).send(out.audio) }
    return res.status(out.status).json(out.json)
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach ElevenLabs.' })
  }
}
