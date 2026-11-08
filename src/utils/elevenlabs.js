// ElevenLabs, bring-your-own-key. The key is the first "ElevenLabs" entry in
// Settings → Connections → API keys; it goes only to /api/elevenlabs.
import { getApiKeys } from './connections'

export const VOICE_MODELS = [
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2' },
  { id: 'eleven_turbo_v2_5', label: 'Turbo v2.5 (faster)' },
]
export const DEFAULT_VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0, speed: 1 }

export function getElevenKey() {
  return getApiKeys().find(k => k.service === 'elevenlabs' && k.key)?.key || ''
}

async function fail(res) {
  const data = await res.json().catch(() => ({}))
  throw new Error(data.error || `ElevenLabs error (${res.status})`)
}

export async function listVoices() {
  const res = await fetch('/api/elevenlabs?op=voices', { headers: { 'x-api-key': getElevenKey() } })
  if (!res.ok) await fail(res)
  return (await res.json()).voices || []
}

// Returns an object URL for an mp3 preview. Uses the account's characters.
export async function speak({ voiceId, text, model, settings, seed }) {
  const res = await fetch(`/api/elevenlabs?op=tts&voice=${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': getElevenKey() },
    body: JSON.stringify({ text, model_id: model, voice_settings: settings, seed: Number.isInteger(seed) ? seed : undefined }),
  })
  if (!res.ok) await fail(res)
  return URL.createObjectURL(await res.blob())
}

const post = (op, body) => fetch(`/api/elevenlabs?op=${op}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': getElevenKey() }, body: JSON.stringify(body) })

// Characters used and left this billing period: { tier, used, limit, resetsAt }.
export async function getUsage() {
  const res = await fetch('/api/elevenlabs?op=usage', { headers: { 'x-api-key': getElevenKey() } })
  if (!res.ok) await fail(res)
  return res.json()
}

// Voice Design: three takes from a description. Returns { text, previews: [{ id, url, duration }] }.
export async function designVoice({ description, text, model }) {
  const res = await post('design', { description, text, model })
  if (!res.ok) await fail(res)
  const data = await res.json()
  return { text: data.text, previews: (data.previews || []).map(p => ({ ...p, url: `data:audio/mpeg;base64,${p.audio}`, audio: undefined })) }
}

// Saves one take to the ElevenLabs account. Returns { voice_id, name }.
export async function saveDesignedVoice({ name, description, generatedVoiceId }) {
  const res = await post('save', { name, description, generated_voice_id: generatedVoiceId })
  if (!res.ok) await fail(res)
  return res.json()
}

// Voice Library: public voices. filters: { search, gender, age, accent, language, use_case, page }
export async function searchLibrary(filters = {}) {
  const q = new URLSearchParams({ op: 'library' })
  for (const [k, v] of Object.entries(filters)) if (v !== '' && v != null) q.set(k, String(v))
  const res = await fetch(`/api/elevenlabs?${q}`, { headers: { 'x-api-key': getElevenKey() } })
  if (!res.ok) await fail(res)
  return res.json()
}

// Copies a library voice into the account so it can be used. Returns { voice_id }.
export async function addLibraryVoice({ publicOwnerId, voiceId, name }) {
  const res = await post('add', { public_owner_id: publicOwnerId, voice_id: voiceId, name })
  if (!res.ok) await fail(res)
  return res.json()
}

// Voice Remix: three takes of a changed version of an existing voice.
export async function remixVoice({ voiceId, description, text }) {
  const res = await fetch(`/api/elevenlabs?op=remix&voice=${encodeURIComponent(voiceId)}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': getElevenKey() }, body: JSON.stringify({ description, text }) })
  if (!res.ok) await fail(res)
  const data = await res.json()
  return { text: data.text, previews: (data.previews || []).map(p => ({ ...p, url: `data:audio/mpeg;base64,${p.audio}`, audio: undefined })) }
}

// Full voiceover with timing (for captions). Returns { url (data: mp3), alignment }.
export async function voiceover({ voiceId, text, model, settings, seed }) {
  const res = await fetch(`/api/elevenlabs?op=speech&voice=${encodeURIComponent(voiceId)}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': getElevenKey() },
    body: JSON.stringify({ text, model_id: model, voice_settings: settings, seed: Number.isInteger(seed) ? seed : undefined }),
  })
  if (!res.ok) await fail(res)
  const data = await res.json()
  return { url: `data:audio/mpeg;base64,${data.audio}`, alignment: data.alignment }
}
