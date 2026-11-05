// Smoke test for the MCP server core — no network, no credits.
// Run: node scripts/mcp-smoke.mjs
// Optional live check against a running server: node scripts/mcp-smoke.mjs http://localhost:5173/api/mcp

import { handleMcpPost } from '../lib/mcp/server.js'

const url = process.argv[2]
let id = 0
const failures = []

async function rpc(method, params, headers = {}) {
  const body = { jsonrpc: '2.0', id: ++id, method, ...(params ? { params } : {}) }
  if (url) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers }, body: JSON.stringify(body) })
    return r.json()
  }
  return (await handleMcpPost(body, headers)).json
}
const call = (name, args, headers) => rpc('tools/call', { name, arguments: args }, headers)
const check = (label, cond, detail) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures.push({ label, detail }) }

const kayla = { name: 'Kayla', gender: 'Female', age: 24, physicalDesc: 'freckled, honey-blonde wavy hair, hazel eyes', personality: 70, vibeWords: ['Clean Girl'], backstory: 'yoga instructor in San Diego' }

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } })
check('initialize negotiates protocol + returns instructions', init.result?.protocolVersion === '2025-06-18' && init.result?.instructions?.length > 100, init)

const notif = url ? null : await handleMcpPost({ jsonrpc: '2.0', method: 'notifications/initialized' })
if (notif) check('notification → 202 no body', notif.status === 202 && notif.json === null, notif)

const list = await rpc('tools/list')
check('tools/list returns 8 tools', list.result?.tools?.length === 8, list.result?.tools?.map(t => t.name))

const info = await call('studio_get_server_info', {})
check('server_info lists tiers', info.result?.structuredContent?.tiers?.paid?.includes('studio_start_image_generation'), info)

const cat = await call('studio_list_catalog', { section: 'locations' })
check('catalog returns locations', cat.result?.structuredContent?.locations?.length > 5, cat)

const val = await call('studio_validate_influencer', { influencer: { gender: 'Female' } })
check('validate flags empty physicalDesc', val.result?.structuredContent?.dataWarnings?.some(w => w.includes('physicalDesc')), val)

const bad = await call('studio_build_portrait_prompts', { influencer: { gender: 'Robot' } })
check('schema violation → isError tool result', bad.result?.isError === true, bad)

const portraits = await call('studio_build_portrait_prompts', { influencer: kayla })
check('portrait prompts: 3 strings', portraits.result?.structuredContent?.prompts?.length === 3, portraits)

const studio = await call('studio_build_photo_studio_prompt', { influencer: kayla, location: 'beach', timeOfDay: 'golden-hour', vibe: 'candid' })
const prompt = studio.result?.structuredContent?.prompt
check('photo studio prompt built', typeof prompt === 'string' && prompt.length > 50, studio)

const preview = await call('studio_preview_image_generation', { prompt, model: 'gpt_image_2', count: 1 })
const estimateId = preview.result?.structuredContent?.estimateId
check('preview returns estimateId', /^est_[0-9a-f]{24}$/.test(estimateId || ''), preview)

const noAuth = await call('studio_start_image_generation', { prompt, estimateId, confirmed: true, idempotencyKey: 'genimg-kayla-20261105-01' })
check('paid tool without token → auth_required', noAuth.result?.structuredContent?.error === 'auth_required', noAuth)

const auth = { authorization: 'Bearer test-token-not-real' }
const unconfirmed = await call('studio_start_image_generation', { prompt, estimateId, confirmed: false, idempotencyKey: 'genimg-kayla-20261105-01' }, auth)
check('confirmed:false rejected', unconfirmed.result?.isError === true, unconfirmed)

const mismatch = await call('studio_start_image_generation', { prompt, count: 2, estimateId, confirmed: true, idempotencyKey: 'genimg-kayla-20261105-01' }, auth)
check('changed params → estimate_mismatch (no spend)', mismatch.result?.structuredContent?.error === 'estimate_mismatch', mismatch)

const unknown = await rpc('tools/call', { name: 'nope', arguments: {} })
check('unknown tool → JSON-RPC -32602', unknown.error?.code === -32602, unknown)

const missing = await rpc('resources/list')
check('unsupported method → -32601', missing.error?.code === -32601, missing)

console.log(failures.length ? `\n${failures.length} failed` : '\nAll checks passed')
if (failures.length) { console.dir(failures, { depth: 4 }); process.exit(1) }
