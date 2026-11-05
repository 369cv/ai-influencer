# MCP Server Build Playbook

**Type:** workflow + rules · **Tags:** `mcp` `api-design` `serverless` `oauth` `reusable`
**Links:** [blueprint-teardown.md](blueprint-teardown.md) · [connect.md](connect.md) · reference implementation: [`lib/mcp/`](../../lib/mcp/)

How to build a remote MCP server for any platform. Portable: plain JSON-RPC over HTTP with no SDK lock-in. It runs on Vercel, Cloudflare, Deno, or Node.

## Components

| Component | Purpose | File in this repo |
|---|---|---|
| Protocol core | JSON-RPC dispatch: `initialize`, `ping`, `tools/list`, `tools/call` | `lib/mcp/server.js` |
| Tool registry | One object per tool: schema, tier, handler | `lib/mcp/tools.js` |
| Validator | Checks arguments against JSON Schema before handlers run | `lib/mcp/schema.js` |
| Upstream client | Optional: call a vendor API/MCP with the user's token | `lib/mcp/higgsfield.js` |
| HTTP adapter | Host-specific glue only | `api/mcp.js` (Vercel), `vite.config.js` (dev) |
| Smoke test | Protocol + rails, no network | `scripts/mcp-smoke.mjs` |
| Instructions | Usage rules injected into the model's context | `INSTRUCTIONS` in `server.js` |

## Workflow (if this → then that)

1. **Decompose the platform into nouns and verbs.** List the artifacts (influencer, prompt, job, image) and the operations on them.
2. **Classify each operation by cost.**
   - Pure / read → `free` tier.
   - Needs the user's identity but costs nothing → `auth` tier.
   - Spends money, credits, or quota, or has external side effects → `paid` tier.
3. **Name the tools** `{prefix}_{verb}_{noun}`. Pick the verb by cost: `get/list/find/build/validate/preview` = free; `start/create/run/cancel` = paid.
4. **If a paid op has a variable cost**, split it into `preview_*` (free, returns `estimateId` + cost) and `start_*` (requires `estimateId`).
5. **If an op takes longer than ~10s**, return a `jobId` and add `get_job_status`. Never hold the HTTP request open for minutes on serverless.
6. **Write the input schemas strict.** Use enums from your real catalog, numeric bounds, length caps, and `additionalProperties: false`. The model reads them.
7. **Write the tool descriptions for the model.** Say what the tool costs, what to call first, and what to do next.
8. **Write the server `instructions`.** Five rules max: tiers, preview-before-start, idempotency, recording IDs, and anything about data meaning.
9. **Return `structuredContent` plus a JSON text block.** Put `next:` hints and `dataWarnings` in results.
10. **Add the adapter** for your host. Keep all logic out of it.
11. **Run the smoke test** in-process, then over HTTP.
12. **Add OAuth** before you publish as a claude.ai / ChatGPT connector (see below).

## Rules (invariants)

- **R1 — Free gates paid.** Every paid action has a free path to check or preview it first.
- **R2 — `confirmed: true` is required on every paid call** (schema `const: true`). The model has to set it deliberately.
- **R3 — Deterministic idempotency keys.** Format: `{op}-{target}-{YYYYMMDD}-{seq}`. Same key + same params → replay the stored result. Same key + different params → reject.
- **R4 — Bind previews to params.** Make `estimateId = hash(version + canonical params)` so a mismatch is impossible without any server storage.
- **R5 — Tool errors are results, not protocol errors.** Return bad arguments, missing auth, and upstream failures as `isError: true` with a machine `error` code, so the model can self-correct. Reserve JSON-RPC errors for unknown method/tool and parse failures.
- **R6 — Explain your numbers.** Return metric definitions and `dataWarnings` alongside the data.
- **R7 — Never hold vendor secrets for users.** Forward the user's own token (Bearer/OAuth). The server stays stateless where possible.
- **R8 — Immutable writes.** Re-runs create new versions. Corrections use optimistic concurrency (`expectedRevision` / `priorValueHash`).
- **R9 — Server holds capability; a plugin holds judgment.** Put workflows into skills/agents, not into ever-longer tool descriptions.

## Protocol minimum (Streamable HTTP, stateless)

| Request | Response |
|---|---|
| `POST` with a JSON-RPC request | `200` + JSON-RPC response (`application/json`) |
| `POST` with a notification (no `id`) | `202`, empty body |
| `POST` with a batch array | `200` + array of responses |
| `GET` / `DELETE` | `405` (no SSE stream, no sessions) |
| `OPTIONS` | `204` + CORS headers |

`initialize` must echo a supported `protocolVersion` (we accept `2025-06-18`, `2025-03-26`, `2024-11-05`) and return `capabilities.tools`, `serverInfo`, and `instructions`.

## Auth: getting to a "connector URL"

- **Claude Code / Cursor / scripts:** pass a header — `Authorization: Bearer <token>`. Works today.
- **claude.ai / ChatGPT custom connectors:** the URL alone has to be enough, so the server must implement MCP OAuth:
  1. Serve `/.well-known/oauth-protected-resource`, pointing at your auth server.
  2. Return `401` + `WWW-Authenticate: Bearer resource_metadata="…"` when a token is missing.
  3. The auth server supports authorization code + PKCE and Dynamic Client Registration (`/register`).
  4. Validate the token's audience = your MCP URL.
- **Gateway option:** if your platform already uses a vendor's OAuth (as we use Higgsfield's), you can proxy it. Otherwise use your own identity provider (Clerk, Auth0, Supabase Auth, WorkOS) and store the vendor tokens server-side.

## Production checklist

- [ ] Persistent idempotency store (KV / Postgres), not in-memory
- [ ] Usage ledger: `get_usage` returning granted / reserved / committed / available
- [ ] `cancel_job` that releases reserved credits
- [ ] OAuth discovery endpoints (for connector-URL install)
- [ ] Per-user rate limiting (per token, not just per IP)
- [ ] Structured logs with tool name, user, cost, idempotencyKey
- [ ] Contract tests per tool (schema + happy path + every error code)
