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
