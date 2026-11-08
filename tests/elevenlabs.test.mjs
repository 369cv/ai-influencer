import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleElevenLabs } from '../api/elevenlabs.js'

// Stub fetch: records the call and answers with `reply`.
function stub(reply, status = 200) {
  const calls = []
  globalThis.fetch = async (url, init = {}) => { calls.push({ url, init }); return { ok: status < 400, status, json: async () => reply, arrayBuffer: async () => new ArrayBuffer(0) } }
  return calls
}
const key = 'k'

test('usage maps the subscription read', async () => {
  const calls = stub({ tier: 'creator', character_count: 1200, character_limit: 100000, next_character_count_reset_unix: 1800000000 })
  const out = await handleElevenLabs({ method: 'GET', op: 'usage', key })
  assert.equal(calls[0].url, 'https://api.elevenlabs.io/v1/user/subscription')
  assert.equal(calls[0].init.headers['xi-api-key'], 'k')
  assert.deepEqual(out.json, { tier: 'creator', used: 1200, limit: 100000, resetsAt: 1800000000000 })
})

test('design validates the description and maps previews', async () => {
  stub({})
  assert.equal((await handleElevenLabs({ method: 'POST', op: 'design', key, body: { description: 'too short' } })).status, 400)
  assert.equal((await handleElevenLabs({ method: 'POST', op: 'design', key, body: { description: 'a warm, relaxed voice in her twenties', text: 'short' } })).status, 400)
  const calls = stub({ text: 'auto text', previews: [{ generated_voice_id: 'gen123456', audio_base_64: 'AAA', duration_secs: 4.2 }] })
  const out = await handleElevenLabs({ method: 'POST', op: 'design', key, body: { description: 'a warm, relaxed voice in her twenties' } })
  const sent = JSON.parse(calls[0].init.body)
  assert.equal(sent.auto_generate_text, true)
  assert.equal(sent.model_id, 'eleven_multilingual_ttv_v2')
  assert.deepEqual(out.json, { text: 'auto text', previews: [{ id: 'gen123456', audio: 'AAA', duration: 4.2 }] })
})

test('save needs a name, description and take', async () => {
  stub({})
  assert.equal((await handleElevenLabs({ method: 'POST', op: 'save', key, body: { name: 'Kay' } })).status, 400)
  const calls = stub({ voice_id: 'v1', name: 'Kay' })
  const out = await handleElevenLabs({ method: 'POST', op: 'save', key, body: { name: 'Kay', description: 'warm voice', generated_voice_id: 'gen123456' } })
  assert.deepEqual(JSON.parse(calls[0].init.body), { voice_name: 'Kay', voice_description: 'warm voice', generated_voice_id: 'gen123456' })
  assert.deepEqual(out.json, { voice_id: 'v1', name: 'Kay' })
})

test('errors come back as plain text', async () => {
  stub({ detail: { message: 'quota_exceeded' } }, 401)
  const out = await handleElevenLabs({ method: 'GET', op: 'usage', key })
  assert.deepEqual([out.status, out.json.error], [401, 'quota_exceeded'])
})
