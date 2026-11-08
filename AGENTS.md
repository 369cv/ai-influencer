# AGENTS.md — handoff for coding agents (Antigravity, Claude Code, Cursor, …)

This is the context a coding agent needs to work on **Muse Studio** or to build the
companion **Chrome extension** without stepping on the web app. Read it before
changing anything. The deeper project notes are in `CLAUDE.md`.

Tags: `muse-studio` · `web-app` · `pwa` · `chrome-extension` · `design-system` · `handoff`

## Index

| # | Section | Read it when |
|---|---|---|
| 1 | [What the product is](#1-what-the-product-is) | Always |
| 2 | [Current state & open PRs](#2-current-state--open-prs) | Before branching |
| 3 | [Architecture map](#3-architecture-map) | Before touching code |
| 4 | [Design system rules](#4-design-system-rules) | Any UI work, extension UI included |
| 5 | [Rules — do / don't](#5-rules--do--dont) | Always |
| 6 | [Chrome extension: integration contract](#6-chrome-extension-integration-contract) | Building the extension |
| 7 | [Roadmap](#7-roadmap) | Picking up the next task |
| 8 | [Reference library](#8-reference-library) | Designing a screen |

## 1. What the product is

Muse Studio is a local-first React + Vite web app (and installable PWA) for designing
AI influencers and generating their photos and videos. Generation runs through the
**user's own Higgsfield account** (OAuth PKCE). All user data lives in the browser's
`localStorage`; there is no backend database. Hosting is on Vercel: `api/*.js` are
serverless proxies.

## 2. Current state & open PRs

The PRs are stacked; merge them in order.

| PR | Branch | What it does | Status |
|---|---|---|---|
| #1 | `claude/offline-pwa-vercel` | Installable PWA, offline app shell, offline request queue, Vercel headers | Draft, mergeable |
| #2 | `claude/muse-studio-brand` | Rebrand to Muse Studio, DTCG design tokens, logo/icons, Figtree font | Draft, stacked on #1 |
| #3 | `claude/muse-app-shell` | Prompt-first Home at `/`, old landing moved to `/welcome`, phone bottom tab bar, nav restyled with tokens | Draft, stacked on #2 |
| #4 | `claude/happy-heisenberg-7dihpd` | Remote MCP server at `/api/mcp` (separate session, based on `main`, not part of this stack) | Draft, independent |
| #5 | `claude/affectionate-allen-lrw8js` | **Plan card** before every generation (Create → Generate, Photo Studio): poses, outfit, model, ratio, resolution, credit estimate, *Edit plan* / *Start* | Draft, stacked on #3 |
| #6 | `claude/muse-create-wizard` | **Create wizard restyle**: 6 one-task screens (Name, Niche, References, Story, Look, Generate), segmented progress, Back/Next pinned to the bottom, Look step with live preview + pull-up tabbed option grids | Draft, stacked on #5 |
| #7 | `claude/muse-library` | **Library** at `/library`: media grid of every photo/video with filters, full-screen viewer with Modify, Make video, More like this, Download, Post | Draft, stacked on #6 |
| #8 | `claude/muse-workflows` | **Workflow template gallery** at `/workflows` and trigger → steps view at `/workflows/:id`; unconnected apps show *Connect* steps | Draft, stacked on #7 |
| #9 | `claude/muse-extension-hooks` | **Chrome extension hooks**: `/create?brief=&name=`, `/import?type=face\|style\|inspiration&url=&source=`, guarded `mode=import` in `/api/img-proxy` | Draft, stacked on #8 |
| #10 | `claude/muse-influencers-restyle` | **Influencers.jsx token restyle** (styles only, no split) + **desktop sidebar rail** (≥1100px, collapsible, recents) | Draft, stacked on #9 |
| #11 | `claude/muse-three-starters` | **Light mode only** + contrast tokens; **three starters** (Create · Manage content · Plan) behind every New/+ Create; **Plan** (`/plan` ideas + template projects), **Content** (`/content` queue, calendar, social accounts, composer), **Tracking** (`/tracking`); **workspace switcher**; **Settings → Connections** (Higgsfield, Claude, BYO posting API, your own API keys, MCP servers) and **Skills**; Create wizard no longer shows connect banners; `/api/publish` posting proxy | Draft, stacked on #10 |

**Deploy:** Vercel's Git integration builds from GitHub (`369cv/ai-influencer`).
`main` is production and every PR gets a preview URL. The repo must be imported once
at vercel.com/new.

## 3. Architecture map

| Path | Role |
|---|---|
| `src/App.jsx` | Routes (incl. redirects for /library, /tracking, /inspiration), providers, global chrome (AppSidebar, Nav, OfflineBanner, NewMenu) |
| `src/pages/Home.jsx` | Prompt-first home; a typed brief opens `/create` with `state.prefillBackstory` |
| `src/pages/Create.jsx` | Creation wizard; accepts `location.state` `{ prefillName, prefillGender, prefillBackstory, replaceId }`. Steps are the `STEPS` array (id, label, title, sub); add a screen by adding an entry and a `stepId === '…'` branch |
| `src/components/create/LookStudio.jsx` | Look step: `LookPreview` (illustrated live preview) + tabbed option grids; a pull-up sheet on phones |
| `src/utils/lookOptions.js` | Skin, hair, eye, build, ethnicity and vibe option data |
| `src/pages/Influencers.jsx` | Profile + Content Studio + Video Studio (6k+ lines; **don't refactor casually**). Brand colours are tokens now; the per-influencer accent (`accent(inf)` → hex from palette/gender) is data and stays hex because it is used with alpha suffixes and `parseInt` |
| `src/components/AppSidebar.jsx` | **The only navigation**: logo + workspace switcher, New, Home · Influencers · Content · Plan, Recent, Help & feedback, Settings. ≥1100px full (collapsible), 720–1099px icons only, <720px a drawer opened from the slim bar in `Nav.jsx`. Sets `html[data-rail]` (→ `--rail-offset`, and `--nav-h: 0` from 720px up) and `html[data-drawer]` |
| `src/store.jsx` | `localStorage` stores (`useInfluencers`, …) and seed influencers |
| `src/utils/higgsfieldAuth.js` / `higgsfieldGenerate.js` | OAuth and generation (MCP over `/api/hf/*`) |
| `src/utils/network.js` | `whenOnline()` offline queue, `useNetworkStatus()` |
| `src/pages/Import.jsx` | `/import` entry for the Chrome extension (see §6) |
| `api/img-proxy.js` | Image proxy. Default: Higgsfield/OpenAI host allowlist. `mode=import`: any public https image, with SSRF guards |
| `src/pages/Workflows.jsx` | Template gallery + trigger → steps detail. UI only: *Run* stays disabled until a runner exists |
| `src/utils/workflows.js` | `TEMPLATES`, `TRIGGERS`, `STEP_KINDS`, `INTEGRATIONS` (each with `isConnected()`; ElevenLabs/HeyGen/TikTok/Instagram are `available: false` until built) |
| `src/pages/Library.jsx` | Library media grid (All/Photos/Videos + per-influencer filter) |
| `src/components/MediaViewer.jsx` | Full-screen viewer: swipe/arrow keys, actions, Post sheet with *Connect* placeholders |
| `src/utils/library.js` | `collectLibrary()` merges `photo_studio_history` + `influencer.generationHistory`; handoffs into the studios (see below) |
| `src/components/PlanCard.jsx` | `PlanCard` (inline) and `PlanSheet` (bottom sheet / dialog) shown before a generation starts |
| `src/utils/creditEstimate.js` | The one table of **estimated** Higgsfield credits per model × resolution. Update numbers here only |
| `src/styles/muse-components.css` | Shared token-only component classes: `.muse-btn-*`, `.muse-plan*`, `.muse-sheet*` |
| `src/design/tokens.json` → `tokens.css` | Design tokens (W3C DTCG). `npm run tokens` regenerates the CSS |
| `docs/design/muse-studio-brand.md` | Brand guide: identity, tokens, patterns |
| `src/components/NewMenu.jsx` | The one **New** menu (grouped: Create · Content · Plan · From a template). `openNewMenu(anchorEl?)` opens it as a popover next to the anchor, or centered on narrow screens |
| `src/context/workspace.jsx` | Workspaces + `useWorkspaceStore(base)`: localStorage key `${base}__${workspaceId}` for `muse_ideas`, `muse_projects`, `muse_posts`, `muse_accounts`, `muse_tracked` |
| `src/pages/Plan.jsx` · `src/utils/planning.js` | Views Board · Creators · Inspiration. Board columns Ideas · To do · Doing · Done (`normalizeStatus()` maps older statuses); ideas and projects open in a side panel (`Panel` in `ui.jsx`). Brand-deal projects carry brand, fee, deliverables, paid. `/tracking` and `/inspiration` redirect here |
| `src/pages/Content.jsx` · `src/utils/publishing.js` | Views Calendar · List · Media (`Library embedded`), status/account filters, two-pane composer (editor + live preview, Schedule / Post now split button). `publishPost()` → `/api/publish`. `/library` redirects to `?view=media`. Social accounts are in `src/components/SocialAccounts.jsx` (Settings) |
| `api/publish.js` | Posting proxy, user's own credentials per request: Ayrshare (`/api/post`, `/api/user` for the test) or a public https webhook (SSRF-guarded via `img-proxy` helpers, optional HMAC `X-Muse-Signature`) |
| `src/pages/Tracking.jsx` | `TrackingView`: tracked creators with manual snapshots and 30-day growth (rendered inside Plan) |
| `src/utils/connections.js` · `src/utils/skills.js` · `src/utils/claudeAssist.js` | Settings data (keys, MCP servers, posting), skills (built-ins + imported SKILL.md), and `runSkill()` over `/api/claude` |
| `vite.config.js` | PWA config (precaches the app shell only) plus local mirrors of `api/*` |

## 4. Design system rules

- **Use the tokens only.** Write `var(--accent)`, `var(--tonal)`, `var(--surface)`,
  `var(--radius-pill)`, `var(--space-4)` and so on, never raw hex. To change a value,
  edit `src/design/tokens.json` and run `npm run tokens`; never hand-edit `tokens.css`.
- **Look:** a calm AI studio. Light canvas, a soft `--glow` behind the primary action,
  pill controls, tonal buttons for secondary actions, a solid `--accent` for the one
  primary action, large light headings (Figtree 400).
- **Motion:** short and calm (≤500ms ease-out, small rise or fade); hover lifts cards
  by 2px. Always honor `prefers-reduced-motion`.
- **SVG attributes:** `stroke="…"`/`fill="…"` attributes can't take `var(--…)`; use `style={{ stroke: 'var(--accent)' }}` or keep hex there.
- **Web first, responsive:** one navigation (the sidebar). Below 720px it becomes a drawer
  opened from the slim top bar; there is no separate phone tab bar. Keep tap targets at least 40px
  and no horizontal page scroll at 390px.
- **No duplicates:** one New menu, one sidebar, view switches (`Seg`) instead of extra pages or tabs.
- **Brand:** the name is "Muse Studio" and the logo is `public/icon.svg`. Never use
  Google, Gemini or Workspace names, logos, colors or the Google Sans font. The style
  is inspired by them, but the brand is original.
- **Chrome extension:** reuse the same `tokens.css` (copy it, or import it from the
  repo) so the extension looks native to the app.

## 5. Rules — do / don't

**Do**
- Run `npm run build` before every push. It also regenerates the tokens.
- Keep new UI in small components; put shared ones in `src/components/`.
- Keep the app working offline: don't add runtime CDN fonts or scripts, and bundle
  assets instead.
- Open one PR per concern and include phone and desktop screenshots.

**Don't**
- Don't kill the dev server on port 5173; the owner keeps it running.
- Don't commit API keys or secrets. That includes `.mcp.json` files with keys in them;
  use environment variables or secrets.
- Don't change the Higgsfield OAuth `client_name` or the prompt strings that still
  say "AI Influencer Studio"; existing connections depend on them.
- Don't split `Influencers.jsx` without a dedicated session that verifies every flow
  in the browser.

## 6. Chrome extension: integration contract

The app keeps its data in **its own origin's `localStorage`**, which the extension can't
read directly. Talk to the app through the routes below and keep the extension's own
state in `chrome.storage`. All routes in this table are **built** (#9). Open them with
`chrome.tabs.create({ url })`.

| Extension action | URL | App side |
|---|---|---|
| "Create influencer from this page" | `APP + '/create'` | ✅ |
| Prefill a brief | `APP + '/create?brief=' + encodeURIComponent(text)` (optional `&name=`) | ✅ `brief` → backstory (max 4,000 chars), `name` → name (max 80). Navigation state wins over the query |
| Send an image as a face reference | `APP + '/import?type=face&url=' + encodeURIComponent(imgUrl)` | ✅ `/import` fetches via `/api/img-proxy?mode=import`, shows a preview, then opens `/create` with `state.prefillFaceRef` |
| Send an image as a style reference | `APP + '/import?type=style&url=…'` | ✅ same, with `state.prefillStyleRef` |
| Save inspiration (image + source URL) | `APP + '/import?type=inspiration&url=…&source=' + encodeURIComponent(pageUrl)` | ✅ user picks a board (default board "From the web" is created if missing); the image is stored as a compressed data URL. `source` is shown, not stored yet |
| Open an influencer | `APP + '/influencers'` with `state.selectId` (in-app only) | ✅ partial |
| Open the Library | `APP + '/library'` | ✅ |

**Import rules** (`api/img-proxy.js`, `mode=import`): https only, no credentials or
non-443 ports, no IP literals or `localhost`/`.local`/`.internal` names, the hostname must
resolve to public addresses only, no redirects, raster images only (no SVG), 15 MB cap.
Errors come back as 403/413/400, and `/import` shows a plain message for each.

**Recommended extension stack:** Manifest V3, a side panel UI built with Vite + React,
the same `tokens.css`, and a context-menu item on images ("Send to Muse Studio").
The minimal permissions are `contextMenus`, `sidePanel`, `storage`, and host
permission for the app origin only.

`APP` = the Vercel production URL (or `http://localhost:5173` in development).

## 7. Roadmap

1. Merge #1 → #2 → #3; import the repo into Vercel.
2. ✅ Plan card before generation (#5). Next: use `PlanSheet` in Video Studio and the other `Influencers.jsx` generators during the dedicated restyle.
3. ✅ Create wizard restyle (#6). The bottom tab bar is hidden on `/create` because the wizard pins its own bar.
4. ✅ Library (#7). Handoffs reuse keys the studios already read: `ps_restore_pending_<id>` (settings), `hf_start_frame_<id>` (video start frame), plus a new one-shot `ps_handoff_<id>` `{ ref, openPlan }` read by Photo Studio, and `state.studioTab` read by Influencers. Post shows *Connect* placeholders until integrations exist.
5. ✅ Workflow template gallery (#8). Next: a step runner (Higgsfield photo + Claude caption are runnable today), then flip each integration's `available`/`isConnected` as it ships.
6. ✅ `/import` and `?brief=` routes for the Chrome extension (#9). Next: build the extension itself (MV3 side panel) against §6.
7. ✅ Influencers.jsx token restyle + desktop sidebar (#10). Splitting the file still needs a dedicated session with live Higgsfield verification.
8. Integrations (HeyGen, ElevenLabs, social publishing, cloud sync): **waiting on the owner's pick** of which to start.

**Blocked from the cloud session** (environment network allowlist): 21st.dev
components, urltoany.com, studio.workspace.google.com and motionsites.ai. Add those
domains, plus a `TWENTY_FIRST_API_KEY` secret, to use them.

## 8. Reference library

Mobbin collection **Muse Studio – Redesign** (private; teammates only):
https://mobbin.com/collections/4d67ec64-2c83-4904-9f30-cc90e820aca3/mobile/screens

| Pattern | References |
|---|---|
| Prompt-first home, plan card | Google Gemini (web) |
| Character / avatar creation | Instagram avatar, Character AI create-a-character |
| Image generation | Luma, Magnific (tool panel + templates), X/Grok |
| Video generation | CapCut AI video (credit confirm), Grok imagine (A/B pick), TikTok create video |
| Workflow builder / templates | Remote automation canvas, Base44 workflows, Gumloop list, Square trigger→action |
| Marketing site hero | Runway, Luma AI, FLORA, VEED |
