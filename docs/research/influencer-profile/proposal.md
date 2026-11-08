# Influencer profiles: proposal

Status: **proposal, not built.**
- Visuals: `proposal-1.png` … `proposal-5.png`.
- Current state: `before-profile.png`, `before-tabs.png`.
- References: Higgsfield (AI Influencer Studio, character pages), Synthesia, Klaviyo/Intercom agent settings, Patreon/Substack/Kit/Mindtrip creator dashboards, all via Mobbin.

## Index

| # | Piece | Type | One line |
|---|---|---|---|
| A | Audit | knowledge | What's repetitive, broken or off-brand today |
| B | References | knowledge | What we take from Higgsfield and creator tools |
| C | Influencers gallery | feature | One page to manage every influencer by what needs attention |
| D | Profile: one header, one tab row | feature | Overview · Content · Persona · Schedule · Earn |
| E | Setup list + identity pack | workflow | Replace the % ring with steps; one chained "identity pack" generation |
| F | Earn | feature | Deal pipeline, rate card, links; manual until connectors exist |
| G | New-influencer journey | workflow | Describe → identity pack → voice → accounts & schedule → first week |
| H | Rules | rules | No emoji, no dead buttons, tokens only, deep links |
| I | Phases & tests | project | Four PRs, smallest and safest first |

## A. Audit (today)

1. **Two sidebars.** The app nav plus a second influencer list, which duplicates "Recent" in the nav.
2. **Two tab systems on one page.**
   - Profile / Photos / Videos at the top.
   - Overview / Scripts / Wardrobe / Home / Brand Deals / History lower down.
   - Five of these (Wardrobe, Home, Brand Deals, History, Scripts) are mostly empty states.
3. **"Open in Studio" and "Export persona" float beside the top tabs.** You asked to delete them; see D.1 for where their jobs go so nothing is lost.
4. **The raw generation prompt is the second card on the profile,** above everything that matters day to day.
5. **The "44% profile complete" ring** doesn't say what's missing or how to fix it.
6. **About 75 emoji in `Influencers.jsx`.** They appear on location chips, wardrobe, vibe tags and empty states. Off-brand next to the line-icon nav.
7. **Off-brand colours.** Pink active tabs and gender chips instead of `--accent` violet.
8. **Delete is a large red button** in the header.
9. **Photos and Videos inside the profile repeat Studio** (location, time of day, outfit, model). You can generate in two places with different controls.
10. **Avatars show the browser's broken-image icon** when an image fails to load (seen for Joshua, Derek, Olivia, Brad in the sandbox). There's no initials fallback.
11. **No profile URL.** The selected influencer lives in localStorage (`inf_last_selected`), so a profile can't be linked to or reached with Back.

## B. References (Mobbin)

| Screen | Idea | Use |
|---|---|---|
| [Higgsfield AI Influencer Studio](https://mobbin.com/screens/87514c14-6e1d-415f-bb72-5d8299c76c0a) | Portrait-first; list of influencers, big portrait, builder on the right | Gallery cards (C) and Persona look (D) |
| [Higgsfield media view](https://mobbin.com/screens/732fecaa-2127-41a8-b00d-db95e900e948) | One toolbar: Overview, Upscale, Relight, Angles; Animate, Recreate | Content tab actions (D), already partly in our MediaViewer |
| [Higgsfield "Manage" employee](https://mobbin.com/screens/e4998f3a-2839-446f-afc4-70c3dc8d5937) | Portrait + stacked rows: Instructions, Skills, Connectors, Files | Persona tab sections (D) |
| [Higgsfield "Earn up to $3,500" banner](https://mobbin.com/screens/87514c14-6e1d-415f-bb72-5d8299c76c0a) (same studio screen) | Monetization surfaced next to the influencer | Earn tab and summary (F) |
| [Higgsfield "Create your own AI employee"](https://mobbin.com/screens/7a8f2209-9db2-4cbe-bd7b-018bf8c76912) | Describe in one sentence, then add skills | Journey step 1 (G) |
| [Klaviyo agent voice & tone](https://mobbin.com/screens/78fba213-8f50-4167-939d-aa807b5da0c1) | Personality as a few clear choices + custom | Persona "Who she is" (D) |
| [Mindtrip Creator Hub](https://mobbin.com/screens/339a27f1-fbe0-42c4-9742-c6e112105402), [Podia](https://mobbin.com/screens/4202d45b-854f-4905-9413-4405d5f60563), [Patreon insights](https://mobbin.com/screens/d7afc62d-8c8a-481d-8537-e901844d5f2d) | Earnings summary, links/products, honest empty states | Earn (F) |

Not copied:
- Higgsfield's dark theme and neon green (we're light-only, violet).
- Its non-human character types.
- Fake follower counts.

## C. Influencers gallery (proposal-1)

- `/influencers` becomes a gallery of portrait cards, replacing the second sidebar.
- Each card shows:
  - name, niche and city;
  - platform logos;
  - **this week: N of goal queued** (from the posting schedule and Queue);
  - the next post time;
  - one next action: "Setup 4 of 6 · continue" or "1 post failed · Retry".
- Filter chips: All · Needs setup · Queue running low.
- Clicking a card opens `/influencers/:id`.

## D. Profile (proposal-2, -3)

1. **Header.**
   - Portrait, name, a status badge (Ready to post / Needs setup), niche · age · city · time zone, and her handles with logos.
   - **Create ▾** = Photo in Studio · Video in Studio · Post · Schedule a batch, each preselecting her. This replaces "Open in Studio".
   - **⋯** = Export persona · Duplicate · Delete influencer. "Export persona" moves here and Delete leaves the header.
2. **One tab row: Overview · Content · Persona · Schedule · Earn.**
   - **Overview:**
     - Identity pack (face, character sheet, close-ups) with one Regenerate;
     - Recent content;
     - This week (her queue and empty slots);
     - Setup list;
     - Earn summary.
   - **Content:** her Media plus History and Scripts, filtered to her, with the existing viewer actions (Recreate, Post, Animate). Generating opens Studio. No second generator.
   - **Persona:**
     - Who she is (bio + vibe words);
     - Voice (the existing PersonaVoice);
     - Wardrobe;
     - Places (was "Home"; Studio lists her places first);
     - Advanced: the generation prompt, collapsed.
   - **Schedule:** her posting schedule (already built) + her accounts + her Queue.
   - **Earn:** see F.

| Today | Moves to |
|---|---|
| Top tabs Profile / Photos / Videos | Overview / Content (generation → Studio) |
| Open in Studio | Create ▾ → Photo / Video in Studio |
| Export persona | ⋯ menu |
| Prompt card | Persona → Advanced |
| Overview form, Voice | Persona |
| Posting schedule | Schedule |
| Scripts, History | Content filters |
| Wardrobe, Home | Persona → Wardrobe, Places |
| Brand Deals | Earn |
| 44% ring | Setup list |
| Delete button | ⋯ menu, with confirmation |

## E. Setup list + identity pack

- **Setup steps:**
  - face, angles and close-ups;
  - voice;
  - social accounts;
  - posting schedule;
  - first week queued;
  - brand rate card.
- Each step is computed from real data and links to its fix. The gallery's "Setup N of 6" reads the same list.
- **Identity pack** chains the skills you already have:
  - Character concept builder → face;
  - Character angle sheet → sheet;
  - close-ups.
  - It's one action, three Higgsfield generations, shown as one progress item. Regenerate is per image or all three.

## F. Earn (proposal-4)

- Totals: earned this month, active deals, pitches out.
- Rate card: Reel, Story set, UGC video.
- **Deal pipeline:** Pitched → Negotiating → Active → Paid. It reuses the existing Brand Deals data.
- An active deal links to its posts in the Queue (deal id on the post).
- **Links & products:** Linktree, Stripe and Shopify point to Connections, labelled Coming soon, plus "Add link manually".
- No invented analytics: numbers come from what you enter until a payments connector exists.

## G. New-influencer journey (proposal-5)

1. **Describe:** fill the form, or paste a sentence and Claude fills it.
2. **Identity pack:** automated, 3 generations.
3. **Voice:** optional.
4. **Accounts & schedule:** Connections, starter times.
5. **First week:** Schedule a batch with the Short-form writer.

- Each step saves.
- Leaving halfway still gives a profile, and Setup shows what's left.

## H. Rules for the build

- **No emoji in UI.** Use line icons (same stroke style as the nav) or plain words. Persona vibe words are text chips.
- **Tokens only,** light mode. Violet `--accent` for active states, no pink tabs.
- **No dead buttons.** Anything not built is labelled Coming soon and links to its Connections page.
- **Deep links.** Profiles open at `/influencers/:id` and tabs at `?tab=`, so Back and refresh work.
  - Old entry points keep working: `/influencers`, the Studio `state.influencerId`, the `/settings?section=accounts` links, and `#posting-schedule`.
- **Avatar fallback:** initials when an image fails to load, never the browser's broken-image icon.

## I. Phases (each its own PR, Vercel preview, browser-tested)

| Phase | Ships | Risk |
|---|---|---|
| 1. Cleanup | Header: Create ▾ + ⋯ (removes Open in Studio / Export persona row) · emoji → icons/words · violet tabs · avatar fallback · Delete into ⋯ | Low: no data changes |
| 2. Structure | Gallery + `/influencers/:id` + one tab row; existing panels move into Overview / Content / Persona / Schedule / Earn; profile Photos/Videos generators retired once Studio has parity | High: `Influencers.jsx` is 6,000+ lines, so this gets its own session and in-browser checks of every flow (per CLAUDE.md) |
| 3. Setup + identity pack | Setup list, gallery attention filters, identity-pack chain, Create wizard saves per step | Medium |
| 4. Earn | Pipeline columns, rate card, deal ↔ post link, links & products | Medium |

**Tests per phase:**
- Playwright at 1280 and 390, covering every tab and each Create menu item.
- A link check: every `to=` and `navigate()` target exists.
- Back and refresh on `/influencers/:id?tab=…`.
- No console errors.
- Before and after screenshots against these mockups.

**Parity check before phase 2:** list every control in the profile's Photos and Videos tabs (location, time of day, outfit, references) and confirm Studio has it, or add it to Studio first. Nothing is removed until it exists in its new place.

## Decisions needed

1. "Delete this": remove the **Open in Studio / Export persona** row, replaced by **Create ▾** and **⋯** as above. Correct?
2. Retire the profile's own Photos/Videos generators in favour of Studio (after the parity check)?
3. Earn: is manual deal entry OK until a payments connector exists?
4. Order: phase 1 first (quick, safe), then 2–4?

---

# v2: minimal options, system light and dark, the whole picture

Boards in `v2/`, each showing before · after light · after dark:

| Board | What it shows |
|---|---|
| `board-0.png` | How Home, Influencers, Content, Studio, Plan and Settings connect: every link goes to an existing or planned page |
| `board-1.png` | Home → "Today": Needs you (failures, empty slots, setup) and a this-week bar per influencer |
| `board-2.png` | Influencers, three options: **A** portrait grid · **B** list · **C** switcher with no index page |
| `board-3.png` | Profile, three layouts: **A** single column · **B** portrait rail · **C** one scroll with side index |
| `board-4.png` | Profile tabs in layout A: Persona · Content · Schedule · Earn |
| `board-5.png` | New influencer: Describe (one sentence, Claude fills the form) → Identity pack → Voice → Accounts & schedule → First week |
| `board-6.png` | Content Queue restyled to match, in both themes |
| `board-7.png` | Settings → Appearance: System (default) / Light / Dark |

## What changed from v1
- **Less chrome.**
  - Hairline rows instead of cards.
  - Setup is one line with the next step, not a card.
  - Earn deals are grouped rows, not kanban columns.
  - Persona is label / content / Edit rows.
- **Choices instead of one design:** 3 influencer-list options and 3 profile layouts. My picks:
  - list: **A** (grid), with a Grid/List toggle for agencies;
  - profile: **A** (single column).
- **Dark mode.**
  - Uses the dark tokens already in `src/design/tokens.json`.
  - `src/context/theme.jsx` currently forces light. The plan is an **Appearance** setting with **System** as the default, which follows `prefers-color-scheme` and switches live.
  - Before turning dark on, replace hard-coded colours in `Influencers.jsx` and older pages with tokens.
  - Give black brand logos (TikTok, X, Threads…) a lighter tile in dark.
- **Home ties it together:** "Needs you" and "This week" read the same data as the profiles, the queue and setup, so there's no separate checklist to maintain.

## Updated phases
| Phase | Ships |
|---|---|
| 1 | Profile header (Create ▾ + ⋯, removing Open in Studio / Export persona) · emoji → icons/words · avatar fallback · tokens for hard-coded colours |
| 2 | Appearance setting (System / Light / Dark) + dark pass on every page |
| 3 | Influencers gallery (chosen option) + `/influencers/:id` + one tab row (chosen layout) |
| 4 | Persona, Content and Schedule tabs; profile Photos/Videos generators retired after the Studio parity check |
| 5 | Setup line + identity-pack chain + new Create journey |
| 6 | Earn tab + Home "Needs you / This week" |

## Decisions needed (v2)
1. Influencers list: **A**, **B**, **C**, or A with a List toggle?
2. Profile layout: **A**, **B** or **C**?
3. Ship dark mode (phase 2) before the profile restructure, or after?
4. Confirm: remove the Open in Studio / Export persona row (replaced by Create ▾ and ⋯).
