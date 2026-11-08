# Remaining gaps: proposal

Status: **proposal, not built.** This set completes the earlier boards in `docs/research/flows/` (F1–F8) and `docs/research/influencer-profile/v2/`. Each board shows the steps in light (top row) and dark (bottom row). Every step is tagged:
- **Exists:** works today.
- **Change:** exists, gets reworked.
- **New:** to build.

## Index

| Gap | Board | Steps (status) | Needs |
|---|---|---|---|
| G1 Captions per platform | `gap-1.png` | All platforms (Change) → Tweak for X (New) → Format + first comment (New) → Problems caught (New) | UI plus per-platform fields in the post; Ayrshare `platformOptions` and webhook JSON |
| G2 Edit and cancel after scheduling | `gap-2.png` | Scheduled (Exists) → Edit (New) → Synced (New) → Cancel (New) | Ayrshare update/delete calls; `post.updated` / `post.cancelled` events for Zapier, Make, n8n and webhooks |
| G3 Analytics | `gap-3.png` | Overview (New) → Top posts (New) → Post detail (New) → Feeds ideas (New) | Ayrshare analytics API. Webhook-route posts show "no stats"; nothing is estimated |
| G4 Brand approval link | `gap-4.png` | Share (New) → Brand view (New) → Back in Muse (New) | **A shared store** (Vercel KV or Blob) for the link. Fallback: a downloadable approval pack |
| G5 Workflow runs | `gap-5.png` | Template (Exists) → Running (New) → Review step (New) → History (New) | A run engine over existing steps (Claude, Higgsfield, ElevenLabs, posting). Runs persist like Studio jobs |
| G6 Saved keys become usable | `gap-6.png` | Connection page (Change) → Studio picker (Change) → Writer picker (Change) | A proxy per provider (Kling, Runway, Luma, OpenAI, Gemini). Models without a key show Connect |
| G7 Sign in to MCP services | `gap-7.png` | Connect (Change) → Tools found (New) → Used in Plan (New) | Generalise the Higgsfield OAuth/MCP proxy to other remote MCP servers |
| G8 System check | `gap-8.png` | Run checks (New) → Fix (New) → Ready to ship (New) | One cheap real request per connection; cost shown before running |

## How they connect

- **G1 → G2:** per-platform captions are what an edit changes and resyncs.
- **G2, G5 → Home "Needs you" (F8):** failed syncs and stopped runs show up there.
- **G3 → F5:** top posts seed "This week's ideas".
- **G4 → F7:** approvals mark deal deliverables; requested changes open Studio with the note.
- **G6, G7 → Studio, Skills, Workflows:** a saved key or a signed-in service appears where you work, never only in Settings.
- **G8 → production:** run before merging the stack to `main`.

## Rules

- No emoji, tokens only, light and dark.
- Every button goes somewhere real; anything not built is hidden.
- Costs are shown before anything spends credits.

## Decisions needed

1. Order. Suggested: G8 (proves the live paths), then G1 + G2 (scheduling phase 2), G3, G5, G6, G7, G4.
2. G4: add Vercel KV/Blob for share links, or ship the downloadable approval pack first?
3. G6: which providers first (Kling, Runway, Luma, OpenAI, Gemini)?
4. G7: which MCP services first (Virlo, HeyGen, Notion, Shopify)?
5. G8: OK to spend ~2 Higgsfield credits and ~40 ElevenLabs characters per full check?
