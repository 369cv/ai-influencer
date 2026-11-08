# User flows: proposal

Status: **proposal, not built.** Each board shows the steps in system light (top row) and dark (bottom row). Every step is tagged:
- **Exists:** works today.
- **Change:** exists, gets reworked.
- **New:** to build.

References: Higgsfield (AI Influencer Studio, Create Image/Video, media toolbar, Marketing Studio), ElevenLabs (Voices: Explore, My voices, Voice Design, text to speech), Buffer (queue, posting schedule, bulk review), and Mindtrip / Podia / Patreon (creator earnings), all via Mobbin.

## Index

| Flow | Board | Steps (status) | Ends in |
|---|---|---|---|
| F1 Create an influencer | `flow-1.png` | Describe (Change) → Pick the face (New) → Identity pack (New) → Voice (Exists) → Ready (Change) | Profile with Setup 3 of 6 |
| F2 Photo shoot | `flow-2.png` | Set up (Exists) → Generating (Exists) → Results (Exists) → Edit one (New) → Post it (Exists) | A post in her next slot |
| F3 Talking video | `flow-3.png` | Start frame (Exists) → Her line (New) → Rendering (Exists) → Review (Exists) | Lip-synced video, then Post |
| F4 Voice library | `flow-4.png` | Browse (Change) → Design one (New) → Lock settings (Exists) → Used everywhere (Exists) | One locked voice per influencer |
| F5 Idea to post | `flow-5.png` | Ideas (Exists) → Script (Change) → Shot list (New) → Post (Exists) | A queued post with generated media |
| F6 Schedule a week | `flow-6.png` | Pick media (New) → Review (New) → Queue (Exists) → Results (New) | A full week in the queue, then stats |
| F7 Brand deal | `flow-7.png` | New deal (Change) → Deliverables (New) → Brand approval (New) → Paid (Change) | Deal paid, posts linked |
| F8 Manage many | `flow-8.png` | Today (New) → Gallery (New) → Compare (New) | Every influencer at a glance |

## How the flows connect (no dead ends)

- **F1 → F2, F6:** "Ready" lists the next steps. Each one opens Settings → Social accounts, the posting schedule, or Schedule a batch.
- **F2 / F3 → Content:** results land in her Content tab. **Post** opens the composer with her next slot (Phase 1).
- **F4 → F3:** her locked voice is the default in "Her line".
- **F5 → F2 / F3 → F6:** a script's shot list generates the media, then queues it.
- **F6 → Home (F8):** empty slots and failures show up in "Needs you".
- **F7 → F6:** deliverables are posts tagged with the deal, so they appear in the Queue. Paid totals feed Earn and Compare.

## What each New step needs (backend honesty)

| Step | Needs | Notes |
|---|---|---|
| F1 Pick the face, Identity pack | Higgsfield (already connected) + the Character concept / angle sheet skills | Chained generations with one progress row. Runs while you navigate away (jobs already persist in `muse_studio_jobs`). |
| F2 Edit one | Higgsfield upscale / relight / angles / reframe tools | Check which the current Higgsfield integration exposes. Show only what works and hide the rest. |
| F3 Her line | ElevenLabs text to speech (proxy exists: `api/elevenlabs.js`, ≤600 chars) + a lip-sync video model | The audio must be a public URL for the video model. That needs a small upload step. |
| F4 Design one | ElevenLabs Voice Design API | New proxy operation. Costs ElevenLabs credits. Labelled with the cost. |
| F5 Shot list | Claude + Studio batch | Reuses skills and Studio; new UI only. |
| F6 Pick media, Review | Phase 3 of the scheduling plan | Already specified in `docs/research/scheduling/`. |
| F6 Results, F8 Compare reach | Ayrshare analytics API | Only for posts sent through Ayrshare. Webhook routes show "no stats". |
| F7 Brand approval link | **A shared store.** Muse is local-first with no server database. | Options: a Vercel KV / Blob share page, or "Download approval pack" until then. **Needs your call.** |
| F8 Today, Gallery, Compare | Data already in the browser | UI only. |

## Rules (same as the rest of the redesign)

- **No emoji, tokens only, light and dark.**
- **Every button goes somewhere real.** Anything not built is hidden or labelled Coming soon.
- **Every flow can be left and resumed.** Long jobs keep running and show up again in Home → Needs you.

## Decisions needed

1. Order: F1 + F2 first (biggest daily use), or F6 (scheduling Phase 3) first?
2. F7 approval links need a shared store (Vercel KV or Blob). OK to add one, or start with a downloadable approval pack?
3. F4 Voice Design spends ElevenLabs credits. OK to include?
