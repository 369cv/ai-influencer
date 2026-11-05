# Design References — Muse Studio ideas

Visual specs for the 10 ranked ideas in [creator-tools-review.md](creator-tools-review.md),
each backed by real screens from Mobbin. Proposals only: no code changed.

**Rules applied to every spec:** existing pages only · no new sidebar items · light mode only ·
existing Muse tokens and components (`src/design/tokens.css`, `src/styles/muse-components.css`
on `claude/muse-studio`).

**21st.dev:** not reviewed yet. The cloud session's network policy blocks `21st.dev`. Each
spec has a "21st.dev slot" naming the component to look for (see
[Next step](#next-step-21stdev)).

## Index

| # | Idea | Page | Best Mobbin match | Reuses in Muse |
|---|---|---|---|---|
| 1 | Persona profile | Influencer profile | Plain, Intercom, Linktree | Character sheet, `WardrobeDrawer` |
| 2 | Analyze → remix from URL | Studio | Synthesia AI video assistant | Studio composer, `muse-plan` rows |
| 3 | Plan + cost before Generate (mostly shipped) | Studio | fal, Leonardo, Artlist | Studio prompt bar already has it; `PlanCard` for batch confirm |
| 4 | Image ↔ motion + Animate | Studio | Krea, Magnific | Studio Photo/Video `MODES` |
| 5 | Outlier score | Plan → Creators | Vimeo video report | `TrackingView` |
| 6 | Inspiration chips + status | Plan → Inspiration / Board | Magnific, Leonardo | `Inspiration embedded`, Board columns |
| 7 | Persona voice | Settings + profile | ElevenLabs, Descript, Hume | Settings key vault |
| 8 | Post-gen rail | Content | Krea, Higgsfield, Artlist | `MediaViewer` |
| 9 | Approve → post pack | Plan → Board | Buffer, Assembly, Mailchimp | `MediaViewer` Post panel, Board |
| 10 | Weekly ideas | Home | Later Ideas, Wix | Home cards |

## Shared visual language (light mode)

Taken from current tokens, so new UI matches what ships today.

| Token / pattern | Value | Use in new specs |
|---|---|---|
| `--bg` / `--surface` | `#F8F9FC` / `#FFFFFF` | Page / cards |
| `--accent` / `--accent-hover` | `#5B4BEF` / `#4A3BDB` | One primary action per view (Generate, Approve) |
| `--tonal` / `--accent-light` | `#E7E4FF` / 8% accent | Secondary buttons, chips, selected rows, cost badge |
| `--radius-xl` | 28px | Cards and sheets; pills for buttons and chips |
| Font | Figtree | Title / body / label / caption scale already defined |
| `.muse-plan` rows | icon + label + value + chips | Reuse for any "summary before action" block (ideas 2, 3, 9) |
| `.muse-sheet` | centered dialog on desktop, bottom sheet ≤720px | All pickers (voice, URL, approve) |

Patterns seen in most references and adopted here:
- **One filled button per view.** Everything else tonal or text (Krea, Buffer, Higgsfield).
- **Settings as chips, not form fields,** in composers (Artlist, fal, Visual Electric).
- **Cost next to the action, never hidden** (fal, Leonardo, Gamma).
- **Right-side detail panel** for anything generated: prompt → settings grid → actions (Krea, Artlist, Higgsfield).

---

## 1. Persona profile — Influencer profile

**References**
- [Plain — agent preferences](https://mobbin.com/screens/15502b97-85a3-4d01-8ec2-df062bfd0649): stacked section cards, each with a title, one-line hint, and its own Save; an "appears like this" preview inside the card.
- [Intercom — Fin identity](https://mobbin.com/screens/adcc8587-873e-476b-990e-29bd6e4b313e): identity card with name + side-by-side image tiles.
- [Linktree — AI personality](https://mobbin.com/screens/89eae6af-0f30-427e-bd65-7e798ca9b48c): selectable tone cards (icon + title + one-liner) next to a live phone preview.
- [WRITER — Personality](https://mobbin.com/screens/09b0aebe-1605-4b19-bef9-bf3cf9eed41c): voice dropdown + instructions table under one tab.

**Spec**
```
Influencer profile (existing header + character sheet stays)
┌───────────────────────────────────────────┬──────────────────┐
│ [Identity] [Looks] [Voice] [Brand]  ← Seg  │  Persona card    │
│ ┌ Identity ─────────────────────────────┐ │  (sticky, 280px) │
│ │ Facet chips: Age 24 · Hair Copper ·   │ │  face sheet      │
│ │ Build Athletic · … [Edit]             │ │  palette dots    │
│ │ Reference sheet: 6 angle tiles [Rebuild]│ voice ▶ 0:04    │
│ └───────────────────────────────────────┘ │  tone: Casual    │
│ ┌ Brand ───────────────────────────────┐  │  [Export bible]  │
│ │ Color roles: Background · Text ·     │  └──────────────────┘
│ │ Accent · Panel (swatch + hex)        │
│ │ Fonts: Heading · Body · Caption      │
│ │ Tone cards (Linktree style, pick 1)  │
│ └──────────────────────────────────────┘
```
- Section cards: `--surface`, `--radius-xl`, 1px `--border-subtle`, title `--font-size-title`, hint `--text-secondary`.
- Facet chips use `.muse-plan-chip`; Edit opens a `.muse-sheet` with grouped selects (Higgsfield-style facets).
- Tone cards: 3 across on desktop, 1 column ≤720px; selected = 2px `--accent` border + `--accent-light` fill.
- Below 960px the persona card moves above the tabs as a compact strip.
- **Constraint:** add sections inside `Influencers.jsx` without splitting the file (per CLAUDE.md).

**21st.dev slot:** segmented tabs, color-swatch picker, profile card.

## 2. Analyze → remix from URL — Studio

**References**
- [Synthesia — AI video assistant](https://mobbin.com/screens/5e7c0ca4-ecc9-46be-8459-962de4513d98): left input with **File / URL / Prompt / Script** tabs + options; right a generated outline of scene cards; footer "Continue in editor" (secondary) + "Generate video" (primary).
- [Mindtrip — Generate a Guide](https://mobbin.com/screens/04b4a3c9-24c8-4528-81b7-075723f3d4d1): single centered pill URL field with clear ×, one Next button.
- [Delphi — Add YouTube video](https://mobbin.com/screens/3932d9f0-f457-486d-b974-db93f5c18c26): minimal URL dialog, disabled primary until valid.

**Spec**
```
Studio composer:  [Photo] [Video] [Link]   ← extend existing MODES Seg
Link mode:
  ( https://instagram.com/reel/…            × )   [Analyze]   ← tonal, no cost
After Analyze → blueprint (muse-plan rows, one per section):
  ● Hook      "POV: you finally…"     type: Curiosity
  ● Bridge    …
  ● Body      3 beats
  ● Persuasion devices   chips
  ● CTA       "Comment 'LOOK'"
  Visual style: chips (handheld · warm · 0.8s cuts)
  ┌ Swap in persona  ┐ ┌ Keep structure, new script ┐   ← two choice cards
  └ ≈ 12 credits     ┘ └ ≈ 1 credit (Claude)        ┘
                                     [Continue →]  ← filled
```
- URL field: pill, 44px, platform icon auto-detected at left (IG / TikTok / YT).
- Analyze is **tonal**; only Continue is filled (it's the step that spends).
- Choice cards follow Linktree tone cards (idea 1) for consistency.

**21st.dev slot:** URL input with icon, choice/radio cards, outline/accordion list.

## 3. Plan + cost before Generate — Studio

**References**
- [fal — Generate](https://mobbin.com/screens/9362cc90-800d-4568-a575-c3456f537923): composer footer reads "Will run 1x on 4 models · **Est. $0.27**" (green chip) beside `1x ▾` and **Run**.
- [Leonardo — AI Creation](https://mobbin.com/screens/c8cf5e25-3820-42eb-addf-848481630d76): Generate button carries the cost "⚡ 80".
- [Artlist — composer](https://mobbin.com/screens/c43aa92a-9b33-4818-8ec9-a08766f22140): settings as one chip row "Image · Nano Banana Pro · 3:4 / 4K / 2 images".
- [Gamma — generate](https://mobbin.com/screens/81b39e9e-13df-4def-aa1c-b86919c9ecb8): − / count / + stepper next to Generate, balance "279 credits" bottom-left.

**Spec**
```
┌ prompt textarea ───────────────────────────────────────────┐
│ …                                                          │
├────────────────────────────────────────────────────────────┤
│ [Soul 2 ▾] [9:16] [2K] [− 2 +]        Runs 2 × Soul 2 · ≈ 4 │ [Generate · 4]
└────────────────────────────────────────────────────────────┘
                                         balance 312 credits ← caption, text-tertiary
```
- Summary text `--font-size-label`, `--text-secondary`; cost number `--font-weight-semibold`.
- Generate = `.muse-btn-filled` with a `--tonal` inner badge for the number.
- Count > 1 or estimate > a set threshold → open the existing **`PlanCard`** in `.muse-sheet` (already built for Create/PhotoStudio) instead of generating immediately.

**21st.dev slot:** AI prompt input with toolbar, number stepper.

## 4. Image ↔ motion + Animate — Studio

**References**
- [Krea — image detail](https://mobbin.com/screens/afe216b7-7d16-4397-b1d4-70df7135b189): **Turn into Video** is the single filled button in a 2×3 action grid (light mode).
- [Magnific — detail](https://mobbin.com/screens/b7023c62-2f20-4989-ba0c-bb735b851e1d): Recreate (filled) + Create video / Use as style / Use as reference (outlined list).

**Spec**
- Saved prompt card: small Seg **Image | Motion** above the text; Motion empty state "Add a motion prompt".
- On a still: **Animate** (filled) → Studio switches to Video mode, first-frame thumbnail pinned in the composer's reference slot, motion text pre-filled, cost summary from idea 3 visible.

**21st.dev slot:** tabs inside a card, image-with-actions card.

## 5. Outlier score — Plan → Creators

**References**
- [Vimeo — video report](https://mobbin.com/screens/094f6877-3aef-4a72-8f6a-957df37d93a1): table with thumbnail + title cell, right-aligned numeric columns with sort arrows, Export.

**Spec**
```
Video                          Views   Creator avg   Outlier ▼    
[thumb] "3 outfits under $50"  1.2M    24K           [ 50× ]  [Save]
```
- Outlier badge: pill; ≥10× `--accent` fill + `--on-accent`; 3–10× `--tonal`; <3× plain text.
- Default sort Outlier desc; columns right-aligned, tabular numbers.
- Row action **Save** (text button) → Inspiration; turns to "Saved ✓".
- ≤720px: table collapses to cards (thumb left, badge top-right).

**21st.dev slot:** data table with sortable headers, badge.

## 6. Inspiration chips + status — Plan → Inspiration / Board

**Status: built.** Chips use the existing `.muse-pchip`; per-image Niche / Shoot selects, To create (adds a Plan idea with the image) and Skip sit on the tile; masonry is `columns: 3 200px` so phones get one column.

**References**
- [Magnific — results](https://mobbin.com/screens/06f8bff7-75c7-4ad9-bea9-bc118bc126b8): chip row of dropdown filters; active chips tinted with ×; **Clear all**; "53 results" next to the query.
- [Leonardo — community](https://mobbin.com/screens/4003bb95-237a-49a8-a9fd-496aff096272): icon + label pill chips, one active filled.

**Spec**
```
Niche:  [All] [Lifestyle 358] [Fashion 289] [Beauty 59] [Fitness 85] …
Shoot:  [Any] [Editorial] [UGC] [Streetstyle] [Headshot] [Motion]
48 results · Clear all                         [Surprise me]  ← tonal
Card hover: ( To create ) ( Skip )   status dot on card corner
```
- Active chip: `--tonal` fill, `--on-tonal` text, × icon; inactive: `--surface` + `--border`.
- Rows scroll horizontally on mobile (no wrap), 16px gutter.
- "To create" adds a Board **Idea** card showing a small source thumbnail + "from Inspiration" caption.

**21st.dev slot:** filter chips / tag group, masonry grid.

## 7. Persona voice — Settings + profile

**References**
- [ElevenLabs — Explore voices](https://mobbin.com/screens/de732e7c-968c-427f-a21b-28155bca9b82): search + language/accent dropdowns + category chips; rows of avatar, name + description, language, category, play, add.
- [Descript — voice picks](https://mobbin.com/screens/7ec87f71-905e-42b3-bf48-64b791c7f520): 4 numbered cards, each with play + waveform + duration.
- [Hume — voice library](https://mobbin.com/screens/497e7e8f-2d20-4f00-a577-8cf2c5b97c02): featured voices as image cards with play, then filterable list.

**Spec**
- **Profile → Voice tab:** current voice card (Descript style: ▶ + waveform + "Lina — warm, playful") with **Change**; under it 4 sliders (Stability, Similarity, Style, Speed) + Seed field; "Preview line" text input + ▶.
- **Change** → `.muse-sheet` list (ElevenLabs row layout), search + 2 filters; selected row `--accent-light`.
- **No key:** card replaced by an empty state "Connect ElevenLabs in Settings" + text button → `/settings`.
- Settings: no visual change; reuse the existing key vault slot.

**21st.dev slot:** audio player with waveform, slider, list with play button.

## 8. Post-gen rail — Content

**References**
- [Krea — detail (light)](https://mobbin.com/screens/afe216b7-7d16-4397-b1d4-70df7135b189): metadata rows (Created, Dimensions, Tool) on top; 2×3 button grid at the bottom with one filled.
- [Higgsfield — detail](https://mobbin.com/screens/4dae0822-d93e-48dd-adf9-bff2613b46e7): Prompt block with Copy, Information table (Model, Quality, Size), **Recreate** filled, then Video / Download / Upscale / Edit grid.
- [Artlist — detail](https://mobbin.com/screens/449b0084-8c48-4b81-a54d-4e9bae3e8737): Settings grid (Model, Aspect, Quality, File type, Date created).
- [Leonardo — detail](https://mobbin.com/screens/432b8df4-ca40-4aed-8b85-44c6bdfeae17): Prompt + Iterate, then a vertical action list.

**Status: Details + Recreate built** as a sheet in the existing dark full-screen viewer (a new Details action next to Download / Post), not a right panel, so the viewer layout stays as is. Also fixed the sheet's centring: its open animation was overriding `translateX(-50%)`, which pushed the Post sheet off-centre too.

**Spec (inside existing `MediaViewer`, right panel 320px)**
```
Prompt                                  [Copy]
"Copper-haired woman, golden hour…"  See all
Settings
  Model  Soul 2     Aspect 9:16    Seed 4821
  Refs   2          Created Nov 5   Cost 2
Versions  (v1) (v2●)                    ← pills
[ Recreate ]  ← filled, full width
[Animate] [Upscale]
[Reframe] [Remix…]                       ← tonal 2×2
[Download]  [Post]                       ← existing Post panel
```
- Remix… opens a single-line instruction field ("make it moodier"); result appears as v3.
- ≤720px: panel becomes a bottom sheet below the media.

**21st.dev slot:** description list, button grid, version pills.

## 9. Approve → post pack — Plan → Board

**References**
- [Buffer — Create post](https://mobbin.com/screens/24370d2b-c8ce-46bc-9434-99c2c630c594): channel avatars at top, Post / Reel / Story radio, editor left, **Instagram Preview** right, footer Save Draft + Publish Now.
- [Mailchimp — customize per network](https://mobbin.com/screens/09a996b7-ee03-4e79-ad69-6ef9145e9bd0): one column per platform with an on/off toggle and its own preview.
- [Assembly — post](https://mobbin.com/screens/352cd91e-63f6-42d2-a2e4-1bd29c7a0b9b): status chip (IN PROGRESS) and an **Approvals** field ("No approvers requested") in the side panel.
- [Wrike — board](https://mobbin.com/screens/37e1797c-5449-462b-bb7d-3521505155bb): tinted column headers with counts.

**Spec**
- Board columns stay Ideas · To do · Doing · Done; a To do project shows **Needs approval** (`--tonal` chip) until approved; dragging to Doing is blocked with a toast "Approve first".
- Card menu → **Approve** (filled) in a `.muse-sheet` using `muse-plan` rows: asset, caption, platforms, schedule.
- Approved card → **Post pack** sheet (Buffer layout): left caption + hashtags, platform toggles (Mailchimp), right preview for the selected platform; footer **Download pack** (filled) + Copy caption (tonal).
- No direct publishing in this pass; the existing `MediaViewer` "Compose post" stays the hook for it later.

**21st.dev slot:** kanban column, social post preview, toggle switch.

## 10. Weekly ideas — Home

**References**
- [Later — Ideas](https://mobbin.com/screens/e5f14eac-2286-4198-8917-2304d8a74c8c): brand description → **Generate Ideas** (credit cost shown) → idea cards per content pillar with Copy.
- [Wix — Ideas for you](https://mobbin.com/screens/e74e441b-d80a-4def-9928-9beb7ecaeefd): "Ideas for you" row of cards (type label, title, one-liner) under a prompt.

**Spec**
```
This week's ideas · Kayla                 [Generate · 1]  ← tonal
┌ REEL ─────────┐ ┌ CAROUSEL ─────┐ ┌ REEL ─────────┐
│ "3 fall looks │ │ "What I eat…" │ │ Remix @x 50×  │
│ under $50"    │ │               │ │               │
│ [Add to Plan] │ │ [Add to Plan] │ │ [Add to Plan] │
└───────────────┘ └───────────────┘ └───────────────┘
```
- 3 cards desktop, horizontal scroll on mobile; type label caption uppercase `--text-tertiary`.
- Empty state: one line "Generate ideas from Kayla's persona and tracked creators" + the button.
- "Add to Plan" → Board Idea card; button becomes "Added ✓".

**21st.dev slot:** card carousel, empty state.

---

## Next step: 21st.dev

`21st.dev` is blocked by this cloud environment's network policy. Either:
- add `21st.dev` under **Allowed domains** in the environment's Network access settings
  ([docs](https://code.claude.com/docs/en/cloud-environments#network-access)), or
- run this in the 21st.dev tab with the Claude in Chrome side panel and paste the output back:

```
Read-only. Search 21st.dev for each item and list the top 2 components
(name, author, URL, one-line visual note, light-mode support y/n):
1 segmented tabs  2 color swatch picker  3 URL input with icon
4 choice/radio cards  5 AI prompt input with toolbar  6 number stepper
7 sortable data table  8 filter chips / tag group  9 masonry grid
10 audio player with waveform  11 slider  12 description list
13 kanban column  14 social post preview  15 card carousel  16 empty state
Do not sign in, install, copy to clipboard, or open paid items.
```

## Reusable components

- **Skill — design-reference pass:** for each idea, search Mobbin (web) for the screen type → pick 2–4 → write ASCII spec in Muse tokens → name the 21st.dev component slot.
- **Rule:** one filled button per view; cost beside every spending action; light mode tokens only; no new sidebar items.
- **Knowledge:** Muse token table above.
