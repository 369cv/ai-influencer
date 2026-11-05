# Creator Tools Review — Muse Studio

Read-only review of external creator tools, gathered tab-by-tab with Claude in Chrome
(no settings changed, no credits spent). Target app: Muse Studio
(`ai-influencer-git-claude-muse-studio-369cvs-projects.vercel.app`, branch `claude/muse-studio`).

Constraints for every idea: map to an existing page (Home, Studio, Content, Plan,
Settings, influencer profile) · no new sidebar items · light mode only.

## Index

| Tool | Status | One-line takeaway | Links to Muse Studio pages |
|---|---|---|---|
| MuzeBoard | Reviewed | Prompt vault: image + motion prompt pairs, tagged niche × shoot type | Plan (Inspiration), Studio, influencer profile |
| Higgsfield | Pending | | |
| Blueprint | Pending | | |
| HeyGen | Pending | | |
| ElevenLabs | Pending | | |
| Pomelli | Pending | | |
| Muzecast | Pending | | |
| FlipScript | Pending | | |
| ManyChat | Pending | | |
| Google Flow (labs.google/flow) | Pending | | |
| link.me | Pending | | |

---

## Tool reviews

### MuzeBoard

- **URL:** https://www.muzeboard.ai/vault (landing: https://www.muzeboard.ai/)
- **Tags:** `prompt-library` `image-prompt` `motion-prompt` `character-consistency` `tagging`

**Main flows (step order)**

1. **Browse → copy (core loop):** open Vault → pick category chip → scroll masonry grid → click card → detail modal → Copy Prompt.
2. **Detail inspection:** card → modal (image, title, category tag, style tag, full prompt) → Copy (inline) or Copy Prompt (CTA) → Esc.
3. **Intended pipeline (landing):** copy image prompt → paste into Nano Banana / any image model → copy matching Motion prompt → paste into Seedance → post talking-head video.
4. **Access:** landing → "Early Access $49" / "I Already Purchased" → Vault (one-time, lifetime updates).

**Key controls**

- Category chips: All, Podcast, Lifestyle, Beauty, Fashion, Fitness, Portrait.
- Card badges: shoot type (Editorial Shoot, Ad campaign, Streetstyle, Headshot, In studio photoshoot, UGC, Surreal, Motion) + usage count (1.4k–3.3k).
- Detail modal: large preview, title, tags, plain-text prompt.
- One-click Copy / Copy Prompt.
- Creator header: persona banner showing one avatar across many outfits.

**Worth copying**

- Image prompt ↔ motion prompt pairing per asset (stills and video stay consistent).
- Two-axis tags (niche × shoot type) instead of folders.
- Consistent prompt anatomy as fill-in slots: subject → wardrobe → action → setting → lighting → palette → aesthetic → quality cue.
- Persona banner as an identity sheet for consistency checks.
- Usage counts as a lightweight "reuse this" signal.

**Integration surface:** none (no API/OAuth/MCP/export). Clipboard text only; model-agnostic. 70% affiliate program.

**Open questions:** Motion card prompt format not verified; Podcast filter rendered empty placeholders.

### Higgsfield
_Pending — paste side-panel output._

### Blueprint
_Pending._

### HeyGen
_Pending._

### ElevenLabs
_Pending._

### Pomelli
_Pending._

### Muzecast
_Pending._

### FlipScript
_Pending._

### ManyChat
_Pending._

### Google Flow (labs.google/flow)
_Pending._

### link.me
_Pending._

---

## Ranked ideas (draft — re-ranked as reviews arrive)

| # | Idea | Page | Source tools | Effort | Reference check (pass = …) |
|---|---|---|---|---|---|
| 1 | **Paired prompts:** every saved image prompt can carry a linked motion prompt; "Animate" in Studio pre-fills Seedance from it | Studio | MuzeBoard | M | In Studio, a saved prompt shows "Image" and "Motion" tabs; Animate opens Seedance with the motion text filled |
| 2 | **Two-axis tags on Inspiration:** niche chips × shoot-type chips filter the grid (no folders) | Plan → Inspiration | MuzeBoard | S | Selecting "Fashion" + "Streetstyle" narrows the grid; clearing restores it |
| 3 | **Prompt slots template:** subject / wardrobe / action / setting / lighting / palette / aesthetic / quality fields, auto-filled from the influencer's identity | Studio | MuzeBoard | M | Choosing an influencer pre-fills subject; editing one slot updates the assembled prompt preview |
| 4 | **Identity banner:** profile header strip of the influencer across recent looks, used as a visual consistency check | Influencer profile | MuzeBoard | S | Profile shows ≥4 recent generations in a header strip; empty state when none |
| 5 | **Reuse counter:** show "used N×" on prompts/inspiration cards; sort by most used | Plan → Inspiration, Content | MuzeBoard | S | Copy/use increments a local counter; "Most used" sort reorders cards |

_Ideas 6–10 pending remaining tool reviews._

---

## Reusable components

- **Skill — tool-review prompt** (paste into Claude in Chrome side panel per tab): read-only; outputs URL, main flows, key controls, worth copying, integration surface.
- **Rule:** read-only in external apps — no Generate/Create/Buy/Save, no settings, no credits.
- **Workflow:** review tab → paste output here → map idea to page → write reference check → run check against preview → mark pass/fail.
