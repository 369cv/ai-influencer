# Connecting to the AI Influencer Studio MCP

**Type:** output / how-to · **Tags:** `mcp` `setup` `higgsfield`
**Links:** [build-playbook.md](build-playbook.md)

## Connector URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:5173/api/mcp` (with `npm run dev` running) |
| Production | `https://<your-vercel-domain>/api/mcp` |

## Tools

| Tool | Tier | Does |
|---|---|---|
| `studio_get_server_info` | free | Version, tiers, rules, models |
| `studio_list_catalog` | free | Locations, times, poses, vibes, expressions, outfits, vibe words, models |
| `studio_validate_influencer` | free | Errors and `dataWarnings` for a profile |
| `studio_build_portrait_prompts` | free | The three Create-wizard portrait prompts |
| `studio_build_photo_studio_prompt` | free | One Photo Studio prompt |
| `studio_preview_image_generation` | free | Returns an `estimateId` bound to the params |
| `studio_start_image_generation` | **paid** | Generates on the user's Higgsfield account and returns `jobIds` |
| `studio_get_job_status` | auth | Polls a job |

Free tools need no auth. Auth and paid tools need `Authorization: Bearer <Higgsfield access token>`. That's the token the app stores after "Connect Higgsfield".

## Claude Code

```bash
claude mcp add --transport http ai-influencer http://localhost:5173/api/mcp
```

With generation enabled:

```bash
claude mcp add --transport http ai-influencer https://<domain>/api/mcp --header "Authorization: Bearer <higgsfield-token>"
```

## claude.ai / Claude Desktop / ChatGPT (custom connector)

Settings → Connectors → Add custom connector → paste the production URL.
The free tools work right away. The paid tools need OAuth on this server first, which isn't built yet (see the playbook's auth section).

## Raw HTTP

```bash
curl -s http://localhost:5173/api/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Test

```bash
node scripts/mcp-smoke.mjs
```

```bash
node scripts/mcp-smoke.mjs http://localhost:5173/api/mcp
```

## Limits (v0.1)

- Profiles are passed in on each call because the app stores data in the browser.
- The idempotency store is in-memory per server instance.
- Image generation only. Video (Seedance) stays in the app's Video Studio.
- `estimatedCredits` is `null`. Higgsfield bills on the user's own plan.
