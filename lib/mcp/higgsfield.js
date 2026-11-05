// Upstream client: our MCP server acting as an MCP *client* to Higgsfield.
//
// This is the "gateway" pattern — our tools add guardrails (preview, confirm,
// idempotency) on top of a vendor MCP, and forward the caller's own Higgsfield
// OAuth token. We never hold a Higgsfield key of our own.

const HF_MCP_URL = 'https://mcp.higgsfield.ai/mcp'
const TIMEOUT_MS = 60_000

// Read either a plain JSON body or an SSE stream and return the first
// JSON-RPC message that carries `result` or `error`.
async function readRpcResponse(res) {
  const type = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!type.includes('text/event-stream')) {
    try { return JSON.parse(text) } catch { return { error: { message: text.slice(0, 300) } } }
  }
  let last = null
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t.startsWith('data:')) continue
    try {
      const msg = JSON.parse(t.slice(5).trim())
      if (msg && (msg.result !== undefined || msg.error !== undefined)) return msg
      last = msg
    } catch {}
  }
  return last ?? { error: { message: 'Empty SSE response from Higgsfield' } }
}

async function post(token, body, sessionId) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${token}`,
  }
  if (sessionId) headers['mcp-session-id'] = sessionId
  const res = await fetch(HF_MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 401 || res.status === 403) {
    const err = new Error('Higgsfield rejected the token — reconnect Higgsfield and pass a fresh Bearer token.')
    err.code = 'auth'
    throw err
  }
  if (res.status === 202) return { sessionId: res.headers.get('mcp-session-id') || sessionId, msg: null }
  const msg = await readRpcResponse(res)
  return { sessionId: res.headers.get('mcp-session-id') || sessionId, msg }
}

// One call = initialize → initialized notification → tools/call.
// Stateless on our side; Higgsfield's session id lives only for this request.
export async function callHiggsfieldTool(token, name, args) {
  const init = await post(token, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'ai-influencer-studio-mcp', version: '0.1.0' },
    },
  })
  if (init.msg?.error) throw new Error(`Higgsfield initialize failed: ${init.msg.error.message}`)
  const sessionId = init.sessionId
  await post(token, { jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId)
  const { msg } = await post(token, {
    jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args },
  }, sessionId)
  if (msg?.error) throw new Error(`Higgsfield ${name} failed: ${msg.error.message}`)
  const result = msg?.result
  if (/invalid or expired token/i.test(JSON.stringify(result ?? ''))) {
    const err = new Error('Higgsfield token expired — refresh it and retry with the same idempotencyKey.')
    err.code = 'auth'
    throw err
  }
  return result
}

// Higgsfield returns tool output as MCP content blocks; pull the JSON out.
export function unwrapContent(result) {
  if (!result?.content) return result
  if (result.structuredContent) return result.structuredContent
  for (const item of result.content) {
    if (item.text) {
      try { return JSON.parse(item.text) } catch { return item.text }
    }
  }
  return result
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

export function extractJobIds(result) {
  const data = unwrapContent(result)
  if (data && typeof data === 'object') {
    if (Array.isArray(data.results)) {
      const ids = data.results.map(r => r?.id || r?.job_id).filter(id => id?.length >= 8)
      if (ids.length) return ids
    }
    if (data.job_id) return [data.job_id]
    if (data.jobId) return [data.jobId]
  }
  const str = typeof data === 'string' ? data : JSON.stringify(data ?? '')
  return [...new Set(str.match(UUID_RE) || [])]
}

export function extractImageUrls(result) {
  const str = JSON.stringify(unwrapContent(result) ?? '')
  const raw = str.match(/https:\/\/[^\s"\\]+\.(?:png|jpe?g|webp)(?:[^\s"\\]*)?/gi) || []
  return [...new Set(raw)]
}
