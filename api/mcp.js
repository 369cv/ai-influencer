// Vercel serverless adapter for the MCP server.
// Connector URL (production): https://<your-domain>/api/mcp
// All protocol logic lives in lib/mcp/server.js — this file only maps HTTP.

import { handleMcpPost } from '../lib/mcp/server.js'
import { rateLimit, clientIp } from '../lib/rateLimit.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, accept, mcp-session-id, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id',
}

export default async function handler(req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v)
  if (req.method === 'OPTIONS') return res.status(204).end()

  // Stateless server: no server→client SSE stream and no sessions to delete.
  // 405 on GET tells clients to use plain POST request/response.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed — POST JSON-RPC to this endpoint.' } })
  }

  const rl = rateLimit(clientIp(req.headers))
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    return res.status(429).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Rate limited' } })
  }

  const { status, json } = await handleMcpPost(req.body, req.headers)
  if (json === null) return res.status(status).end()
  return res.status(status).json(json)
}
