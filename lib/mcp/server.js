// MCP protocol core — transport-agnostic.
//
// Implements the Streamable HTTP transport in its simplest legal form:
// stateless, one POST in → one JSON response out, no SSE, no session ids.
// That is enough for Claude (web/desktop/Code), ChatGPT connectors, Cursor,
// and any other MCP client, and it runs on any serverless host.
//
// handleMcpPost(body, headers) → { status, json | null }
// Adapters (api/mcp.js for Vercel, vite.config.js for dev) only translate HTTP.

import { TOOLS, SERVER_VERSION } from './tools.js'
import { validate } from './schema.js'

export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const LATEST = SUPPORTED_PROTOCOL_VERSIONS[0]

// Server-level instructions: clients inject this into the model's context.
// This is the single highest-leverage text in an MCP server.
export const INSTRUCTIONS = `AI Influencer Studio — prompt engineering and Higgsfield image generation for consistent AI influencers.

Tiers: FREE tools (studio_get_server_info, studio_list_catalog, studio_validate_influencer, studio_build_*, studio_preview_*) need no auth and cost nothing — use them freely. AUTH tools need a Higgsfield Bearer token but spend nothing. PAID tools spend the user's Higgsfield credits.

Rules for PAID calls:
1. Free first: validate the profile and build the prompt with free tools before spending.
2. Preview before start: call studio_preview_image_generation, show the user the prompt/model/count, and stop for approval.
3. Start with confirmed: true, the estimateId, the identical params, and a deterministic idempotencyKey ({operation}-{target}-{YYYYMMDD}-{seq}).
4. On timeout or ambiguous failure, retry with the SAME idempotencyKey. A new key risks double-charging.
5. Record every returned jobId, then poll studio_get_job_status.

Profiles: the app is local-first, so pass the influencer profile in each call. gender must be "Female" or "Male". Surface any dataWarnings to the user.`

const err = (id, code, message, data) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } })
const ok = (id, result) => ({ jsonrpc: '2.0', id, result })

function toolResult(payload, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    ...(isError ? { isError: true } : {}),
  }
}

function bearer(headers) {
  const h = headers.authorization || headers.Authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1].trim() : null
}

function listTools() {
  return TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
    name, title, description, inputSchema, annotations,
  }))
}

async function callTool(params, headers) {
  const tool = TOOLS.find(t => t.name === params?.name)
  if (!tool) return { rpcError: [-32602, `Unknown tool: ${params?.name}`] }

  const args = params.arguments ?? {}
  const problems = validate(tool.inputSchema, args)
  // Validation problems are tool errors (isError), not protocol errors, so the
  // model sees them and can fix its own call.
  if (problems.length) return toolResult({ error: 'invalid_arguments', problems }, true)

  const token = bearer(headers)
  if ((tool.tier === 'auth' || tool.tier === 'paid') && !token) {
    return toolResult({
      error: 'auth_required',
      message: `${tool.name} needs "Authorization: Bearer <Higgsfield access token>". Free tools work without it.`,
    }, true)
  }
  if (tool.tier === 'paid' && args.confirmed !== true) {
    return toolResult({ error: 'confirmation_required', message: 'Paid tools require confirmed: true after the user approves the preview.' }, true)
  }

  try {
    const out = await tool.handler(args, { token, headers })
    return toolResult(out)
  } catch (e) {
    return toolResult({ error: e.toolCode || e.code || 'tool_failed', message: e.message }, true)
  }
}

async function handleMessage(msg, headers) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return err(msg?.id, -32600, 'Invalid Request')
  }
  const isNotification = msg.id === undefined
  if (isNotification) return null // notifications/initialized, cancelled, etc.

  switch (msg.method) {
    case 'initialize': {
      const requested = msg.params?.protocolVersion
      return ok(msg.id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'ai-influencer-studio', title: 'AI Influencer Studio', version: SERVER_VERSION },
        instructions: INSTRUCTIONS,
      })
    }
    case 'ping':
      return ok(msg.id, {})
    case 'tools/list':
      return ok(msg.id, { tools: listTools() })
    case 'tools/call': {
      const r = await callTool(msg.params, headers)
      return r.rpcError ? err(msg.id, ...r.rpcError) : ok(msg.id, r)
    }
    default:
      return err(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

export async function handleMcpPost(body, headers = {}) {
  let parsed = body
  if (typeof body === 'string') {
    try { parsed = JSON.parse(body) } catch { return { status: 400, json: err(null, -32700, 'Parse error') } }
  }
  if (Array.isArray(parsed)) {
    const out = (await Promise.all(parsed.map(m => handleMessage(m, headers)))).filter(Boolean)
    return out.length ? { status: 200, json: out } : { status: 202, json: null }
  }
  const out = await handleMessage(parsed, headers)
  return out ? { status: 200, json: out } : { status: 202, json: null }
}
