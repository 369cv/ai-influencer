---
name: build-mcp-server
description: Build or extend a remote MCP server (connector URL) for a platform, following the Blueprint-derived playbook — free/paid tiers, preview→start, idempotency keys, async jobs, strict schemas, server instructions. Use when asked to build an MCP, add MCP tools, expose the platform to Claude/ChatGPT, or make a connector URL.
---

# Build an MCP server

1. Read `docs/mcp/build-playbook.md` (workflow + rules R1–R9) and `docs/mcp/blueprint-teardown.md` (the reference design).
2. Use `lib/mcp/` as the template:
   - `server.js` — protocol core. Reuse it unchanged.
   - `tools.js` — add tools here. One object each: `name`, `title`, `tier` (`free|auth|paid`), `description`, `annotations`, `inputSchema`, `handler(args, ctx)`.
   - `schema.js` — validator. Add keywords only if a schema needs them.
3. For every new operation, decide its tier first. Paid ops need `confirmed` (`const: true`) and `idempotencyKey`. Variable-cost ops need a `preview_*` twin that returns a param-bound `estimateId`.
4. If an op takes longer than ~10s, return a `jobId` and poll it with a `get_*_status` tool.
5. Update `INSTRUCTIONS` in `server.js` if the rules change. Update the tool count and add checks in `scripts/mcp-smoke.mjs`.
6. Verify: run `node scripts/mcp-smoke.mjs`, then the same against `http://localhost:5173/api/mcp`. Never kill the dev server.
7. Update `docs/mcp/connect.md` (tool table) and `docs/mcp/README.md` (index).
