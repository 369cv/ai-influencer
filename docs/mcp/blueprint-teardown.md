# Blueprint MCP — Teardown

**Type:** knowledge · **Tags:** `mcp` `blueprint` `credits` `api-design` `content-research`
**Links:** [build-playbook.md](build-playbook.md) · [../../lib/mcp/](../../lib/mcp/)

What we learned from Blueprint for Creators' MCP (connector setup page:
`blueprintforcreators.com/mcpsetup#connector-url`). Sources: the
Blueprint Research OS plugin (tool map, credit-safety rules, agent definitions)
installed in this workspace. The setup page itself was blocked from the build
sandbox, so connector-UI details come from the standard remote-connector flow.

## 1. Shape

| Aspect | Blueprint's choice | Why it matters |
|---|---|---|
| Transport | Remote MCP. You paste one **connector URL** into Claude / ChatGPT / Cursor | No install. One URL works in every client |
| Auth | OAuth, per user, at connect time | Every call runs as that user, with their credits |
| Size | About 60 tools, all prefixed `blueprint_` | A prefix keeps names unique when many servers are connected |
| Naming | `verb_noun`: `get_`, `list_`, `find_`, `preview_`, `start_`, `create_`, `cancel_` | The verb tells the model the cost and whether the call has side effects |

## 2. The core pattern: free calls gate paid calls

Tools come in two cost tiers.

- **Free (read)**: `get_usage`, `find_outliers`, `list_*`, `get_*`, `get_post_details`, `check_similarity`.
- **Paid (write)**: `analyze_video`, `start_account_import`, `create_brief`, `create_script`, `grade_hook`, `run_monitor`…

Every paid tool **requires** two things:
1. `confirmed: true`. The model has to set this deliberately, after the user approves.
2. `idempotencyKey`. It must be 8–128 characters from `[A-Za-z0-9_-]`, and it must be deterministic, e.g. `{operation}-{target}-{YYYYMMDD}-{seq}`.

## 3. Preview → Start

Paid tools with a variable cost come in pairs:
`preview_account_import` → `estimateId` + cost → (the user approves) → `start_account_import(estimateId, confirmed, idempotencyKey)`.
The preview is free. The start call is refused unless it carries the estimate.

## 4. Credits: reserve → commit

- `get_usage` returns `granted / reserved / committed / available`, plus `dailyLimit` and `monthlyLimit`.
- A confirmed write **reserves** credits. The job **commits** them when it completes.
- `cancel_job` before the commit releases the reservation.
- Long work is **async**: the write returns a `jobId` and the client polls `get_job_status`.

## 5. Safe retries

- On a timeout, retry with the **same** idempotency key. The server deduplicates, so the user is never charged twice.
- If the client generates a new key on each retry, the user gets double-charged. The tool description says so explicitly.

## 6. Data integrity

- `reanalyze_video` creates a **new immutable version** and never overwrites the old one.
- `correct_video_analysis` uses optimistic concurrency. It takes `priorValueHash` (a sha256 of the old value) and `expectedRevision`. A stale edit is rejected instead of silently overwriting.
- Every artifact has a stable ID (`reportId`, `corpusId`, `briefId`, `scriptId`…). IDs chain: `create_brief` takes an `analysisId` **or** (`interviewArtifactId` + `ideaIndex`). The schema allows exactly one of the two.

## 7. The server explains its own metrics

The API returns the definition alongside each number:
`outlierScore = views / creatorRecentMedianViews`, with scope `creator_relative`, `platformNormalized: false`, and a minimum baseline of 5.
Results carry `dataWarnings`. This keeps the model from misreading a number. The doc tells it to always pair an outlier sort with a `min_views` floor.

## 8. Hard limits live in the schema

Examples: imports `requestedCount ≤ 20`, monitor `terms` 1–15, a tracked-creators cap of 20, and an enum for cluster dimensions (`topic|angle|hook|format`).
Constraints sit in JSON Schema, where the model can see them before it calls, not only in server-side errors.

## 9. A layer on top: plugin = skills + agents

Blueprint ships the server separately from an **orchestration plugin** (Research OS):
- **Skills** encode loops (RADAR → ASSESS → DECODE → FORGE → RECORD) and when to spend.
- **Agents** limit tool access. `blueprint-scout` is read-only and can never call a paid tool. `blueprint-analyst` only synthesizes.
- **Rules** are invariants every skill follows: free gates paid, preview before start, record every ID, call `get_usage` at both ends of a session.

The server holds the capability. The plugin holds the judgment. Version them separately.

## Takeaways (applied in our server)

| # | Pattern | Our implementation |
|---|---|---|
| 1 | Name prefix plus a cost-revealing verb | `studio_get_*`, `studio_build_*`, `studio_preview_*`, `studio_start_*` |
| 2 | Free and paid tiers | `tier: free / auth / paid` in `lib/mcp/tools.js`, enforced in `server.js` |
| 3 | `confirmed` + `idempotencyKey` | Both required in the schema; `confirmed` is `const: true` |
| 4 | Preview → estimateId → start | The estimateId is a **hash of the params**, so a mismatch is rejected with no storage needed |
| 5 | Retry with the same key is safe | Idempotency store; the same key with different params → `idempotency_conflict` |
| 6 | Async jobs and polling | `studio_start_image_generation` → `jobIds` → `studio_get_job_status` |
| 7 | `dataWarnings` | Profile quality warnings (empty physicalDesc → identity drift) |
| 8 | Limits in the schema | Enums from the live catalog, `count ≤ 4`, length caps |
| 9 | Server instructions | `INSTRUCTIONS` in `server.js`, returned by `initialize` |
| — | Not built yet | OAuth for the connector, a usage/credits ledger, cancel, immutable versions |
