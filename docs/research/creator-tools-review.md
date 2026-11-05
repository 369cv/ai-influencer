# Creator Tools Review — Muse Studio

Read-only review of external creator tools, gathered tab-by-tab with the Claude in Chrome
side panel. Target app: Muse Studio
(`ai-influencer-git-claude-muse-studio-369cvs-projects.vercel.app`, branch `claude/muse-studio`).

Constraints for every idea: map to an existing page (Home, Studio, Content, Plan,
Settings, influencer profile) · no new sidebar items · light mode only.

## Index

| Tool | Status | One-line takeaway | Feeds ideas |
|---|---|---|---|
| [Higgsfield](#higgsfield) | Reviewed | Structured character schema, motion transfer from reference video, recipes over MCP | 1, 2, 3, 8 |
| [Blueprint](#blueprint) | Reviewed | Outlier-ranked inspo → script → calendar, one status model, Content Profiles | 5, 6, 10 |
| [HeyGen](#heygen) | Reviewed | Persona → Looks/Voice/Motion; plan-before-generate; post-gen action rail | 1, 2, 3, 8 |
| [ElevenLabs](#elevenlabs) | Reviewed | Voice = voice_id + locked settings + seed; inline delivery tags; form↔code mirror | 7 |
| [Pomelli](#pomelli) | Reviewed | One profile feeds every tool; three entry paths; brand book export | 1 |
| [MuzeBoard](#muzeboard) | Reviewed | Prompt vault with image ↔ motion pairs, tagged niche × shoot type | 4, 6 |
| [Muzecast](#muzecast) | Reviewed | 6-angle spec sheet anchor; one composer, many workflows; Flip a viral URL | 1, 2, 4, 7 |
| [FlipScript](#flipscript) | Reviewed | Analyze first (cheap), generate later; structured script blueprint; versioned remixes | 2, 8 |
| [Google Flow](#google-flow) | Reviewed | Character as saved object; prompt + settings stored on every batch; x4 variations → Favorites | 1, 8 |
| [Google Workspace Studio](#google-workspace-studio) | Reviewed (extra) | Prompt → editable trigger/steps pipeline; typed AI steps; Approvals queue | 9 |
| [link.me](#linkme) | Reviewed | Post to All composer; keyword → auto-DM → lead → product; agency roll-up | 9 |
| [ManyChat](#manychat) | Not reviewed | Auto-DM pattern covered by link.me Automations | — |

### Incidents during review (check these)

- **Google Flow:** a misclick on the "The Familiar" sample character started "Generating…".
  Done was not clicked. Check the credit balance and the Fashion project's Characters view.
- **Google Workspace Studio:** opening "New flow" auto-created an empty draft "Untitled flow"
  (`/workflow/b024ff5a…`). Not turned on. Delete it from Flows.
- All other tools: view-only; nothing generated, saved, purchased or toggled.

### What Muse Studio already has (checked on `claude/muse-studio`)

Sidebar: Home, Influencers, Content, Plan (+ Settings). Studio has Photo / Video modes.
Plan has Board (idea → draft → scheduled → posted), Creators, Inspiration views. Content has a
media view. Influencers have a character sheet and a wardrobe/looks drawer. Settings has a
labeled API-key vault (Higgsfield, Claude, ElevenLabs label). A `/workflows` page exists but
isn't in the sidebar. Ideas below build on these, they don't duplicate them.

---

## Ranked ideas

Ranked by value to an AI-influencer workflow ÷ effort. Effort: S (≤1 day), M (2–4 days), L (week+).

| # | Idea | Page | Sources | Effort |
|---|---|---|---|---|
| 1 | Persona profile as single source of truth | Influencer profile | Pomelli, Higgsfield, HeyGen, Muzecast, Google Flow, Blueprint | M |
| 2 | Analyze, then remix from a reference URL | Studio | FlipScript, Muzecast, HeyGen, Higgsfield | L |
| 3 | Plan + cost before Generate | Studio | HeyGen, Higgsfield, Muzecast | S |
| 4 | Paired image ↔ motion prompts, one-click Animate | Studio | MuzeBoard, Muzecast | M |
| 5 | Outlier score on tracked creators | Plan → Creators | Blueprint | M |
| 6 | Inspiration tags + one status model into Board | Plan → Inspiration, Board | MuzeBoard, Muzecast, Blueprint | S |
| 7 | Persona voice (ElevenLabs BYOK) | Settings + influencer profile | ElevenLabs, Muzecast | M |
| 8 | Post-generation rail with saved recipe + versions | Content | HeyGen, Higgsfield, Google Flow, FlipScript | M |
| 9 | Approve → post pack on scheduled cards | Plan → Board | link.me, Google Workspace Studio | M |
| 10 | Weekly ideas drop card | Home | Blueprint | M |

### 1. Persona profile as single source of truth — Influencer profile
Extend the existing character sheet into a portable persona object every generator reads:
identity attributes (Higgsfield-style facets, not free text), face/angle reference sheet with
**Rebuild** (Muzecast), Looks (already via wardrobe), voice (idea 7), palette + font tokens by
role (HeyGen Brand Spec, Pomelli), audience/tone (Blueprint Content Profile). Three ways in
(Pomelli): from an Instagram handle, a reference-image dump, or an archetype preset
(Google Flow, Higgsfield). Add **Export persona bible** (Markdown + JSON).
- **Check:** profile shows Identity / Looks / Voice / Brand sections; Studio's prompt uses
  identity fields when that influencer is selected; Export downloads `.md` and `.json`.

### 2. Analyze, then remix from a reference URL — Studio
In Studio's composer, paste an IG/TikTok/YouTube URL → **Analyze** (cheap, no generation:
transcript + structured blueprint: hook type → bridge → body → persuasion devices → CTA, plus a
visual-style read) → then choose **Swap in persona** (Higgsfield motion transfer with the
persona sheet) or **Keep structure, new script** (drafted by Claude in the persona's tone).
The blueprint is saved and linked to its source, persona and outputs.
- **Check:** pasting a URL enables Analyze only; the blueprint renders as named sections; the
  two remix options appear after Analyze, each with a credit estimate.

### 3. Plan + cost before Generate — Studio
Show model, settings, prompt summary and credit estimate on/near the Generate button; optional
"Review plan" step for batches.
- **Check:** Generate button label includes cost; changing batch count or model updates it;
  batch > 1 shows a confirm summary.

### 4. Paired image ↔ motion prompts — Studio
Each saved image prompt can carry a linked motion prompt; **Animate** on a still pre-fills Video
mode (Seedance) with that motion text and the still as first frame.
- **Check:** a saved prompt shows Image / Motion tabs; Animate switches Studio to Video with
  both filled.

### 5. Outlier score on tracked creators — Plan → Creators
Rank posts by views ÷ that creator's own baseline (e.g. "208×"), not raw views; **Save to
Inspiration** from any row.
- **Check:** Creators view has an Outlier column and sort; Save adds the item to Inspiration.

### 6. Inspiration tags + one status model — Plan → Inspiration, Board
Niche chips × shoot-type chips with counts and "Surprise me" (6 random). Each item gets
To create / Created / Skipped; "To create" drops a linked card into Board's Idea column.
- **Check:** one chip from each row narrows the grid and counts match; To create creates a
  Board card with a source link; Skipped hides it by default.

### 7. Persona voice — Settings + influencer profile
Use the existing ElevenLabs key slot in Settings. On the profile, a Voice section stores
`voice_id`, model, locked settings (stability, similarity, style, speed) and seed, plus a
preview line. Scripts support inline delivery tags (`[soft]`, `[excited]`).
- **Check:** with a key saved, profile lists voices and saves one; without a key, it links to
  Settings; settings persist after reload.

### 8. Post-generation rail with saved recipe + versions — Content
On a media item: Animate, Upscale, Reframe (9:16 / 1:1 / 16:9), the stored recipe (prompt,
references, model, ratio, seed, date — Google Flow), **Recreate** (reopen Studio with it),
**Remix** with a plain-language instruction that saves a new version (FlipScript), credits used.
- **Check:** opening a media item shows the rail and recipe; Recreate opens Studio with
  identical settings; a remix adds v2 and lets you switch back to v1.

### 9. Approve → post pack — Plan → Board
Between Draft and Scheduled, a card needs **Approve** (Workspace Studio approvals: gate posting
and spend). Approved cards offer **Post pack**: asset per platform aspect, caption, hashtags,
and per-platform preview (link.me Post to All). Direct publishing comes later via
link.me / Higgsfield TikTok publish; the pack works with any scheduler.
- **Check:** a Draft card can't move to Scheduled until approved; Post pack downloads asset(s)
  + caption text; preview shows each selected platform.

### 10. Weekly ideas drop — Home
A Home card: "This week's ideas", generated on demand from persona (1) + tracked creators (5) +
saved inspiration; each idea goes to Plan in one click.
- **Check:** Home shows the card with an empty state; Generate produces ideas; "Add to Plan"
  creates Board cards.

### Considered, not ranked
- **Keyword → auto-DM → lead → product** (link.me, ManyChat): high value, but it's distribution
  and CRM, not studio work. Use link.me directly; revisit once idea 9 exists.
- **Visual flow builder** (Workspace Studio, ElevenLabs Flows): `/workflows` already exists;
  surfacing it needs a sidebar item, which is out of scope.
- **Per-persona workspaces with roll-up analytics** (link.me Agency): useful for multi-client
  use; larger store change.
- **Sell prompt packs / courses** (link.me, MuzeBoard): business model, not a feature.

---

## Integration surface (summary)

| Tool | API | MCP | OAuth | Export |
|---|---|---|---|---|
| Higgsfield | Yes (`console.higgsfield.ai`) | Yes (`mcp.higgsfield.ai/mcp`) | Not visible (app already uses OAuth PKCE) | Image/video; SVG for GPT Image 2 |
| Blueprint | None visible | Yes (`mcp.blueprintforcreators.com/mcp`, Creator Pro) | Yes, on MCP connect | None visible |
| HeyGen | Yes (keys, docs, playground) | "Copy to your agent" | Not visible | Download / share link |
| ElevenLabs | Yes (REST + WebSocket, `xi-api-key`, SDKs, CLI, webhooks) | Not visible | Not visible | mp3, Assets |
| Pomelli | None visible | None visible | Google Ads, Drive, Instagram Business | Download Business Data |
| MuzeBoard | None | None | None | Clipboard text |
| Muzecast | None (BYOK for ElevenLabs/HeyGen) | None | None | Video download, spec sheet |
| FlipScript | Internal only (`/api/remix/*`, session-gated) | None | None (access code) | On-screen text |
| Google Flow | None visible | None | Google account | Per-item download |
| Workspace Studio | None visible (developer doc exists) | None | Google account; Beta connectors (admin-gated) | Via Sheets/Docs/Drive steps |
| link.me | None visible | None | YouTube, Instagram, TikTok, Facebook, X, Threads, LinkedIn | Leads CSV, email export |

Fastest wins for Muse Studio: Higgsfield (already integrated) for ideas 2, 3, 8; ElevenLabs
(key slot exists) for idea 7; Claude (already proxied) for the analyze/script steps in idea 2.
Blueprint and Higgsfield MCP servers are useful from Claude for research and batch runs, not as
in-app dependencies.

---

## Tool reviews

### Higgsfield
- **URL:** https://higgsfield.ai/
- **Tags:** `character-schema` `motion-transfer` `recipes` `mcp` `cost-transparency`

**Main flows**
1. **AI Influencer (`/ai-influencer-studio`):** upload photo (optional) → character type (9 presets) → attribute accordions (gender, build, hair, ethnicity, age, skin, face shapes, eyes, features…) → Generate (~1.1 credits) → History.
2. **Motion (Genjutsu):** Motion transfer or Objects swap → optional style → 4–30s reference video → up to 30 character/product/clothing images → prompt with `@image1` → model + quality → Generate.
3. **Image (`/ai/image`):** prompt with `@` assets → model → aspect → quality → resolution → batch 1–4 → Generate; remixable feed above.
4. **Video (`/ai/video`):** Create / Edit / Motion Control tabs → same reference + prompt pattern → Motion Library, Styles → Generate.
5. **Content Factory:** faceless style → "What if…" topic → length + episodes → Generate in Claude (MCP) or here.
6. **MCP recipes (`/mcp`):** pick client → connect `mcp.higgsfield.ai/mcp` → run `/ugc-flow`, `/marketing-hook-variants`, `/marketing-adapt-video`, `/katana`, etc.

**Key controls:** Explore/History toggle · character-type tiles · attribute accordions with counts · Randomize · `@` mentions · Motion transfer vs Objects swap · preset libraries · model/quality/resolution/batch pickers with cost on Generate · Recreate on feed items · Copy prompt / Try in ChatGPT.

**Worth copying:** ~20-facet character schema (portable JSON) · motion transfer with `@`-bound assets · Recreate = generation saved as a recipe · named slash-command recipes callable from any LLM client · cost on the Generate button.

### Blueprint
- **URL:** https://blueprintforcreators.com (`/calendar`, `/explore`, Settings, `/mcpsetup`)
- **Tags:** `outlier-score` `status-model` `content-profile` `scheduled-ideas` `mcp`

**Main flows**
1. **Research → save:** Discover (ranked by outlier multiple) → search/filters → open video → Save to Inspo by category.
2. **Inspo → script:** filter To Create / Created / Skipped → pick hook → New script in your voice (Content Profile).
3. **Hook remix:** Templates → All / Template ready / Hook only → Remix into script.
4. **Plan → publish:** schedule video or script → Calendar week view → mark status.
5. **Persona setup:** Content Profiles → create (audience, references) → Make default.
6. **Competitor watch (Pro):** Track a creator → "Latest from your creators".
7. **Weekly ideas (Pro):** Generate ideas from persona + tracked creators + outliers.

**Key controls:** global Save video · week strip + "stay one week ahead" counter · shared status tabs · category chips with counts · outlier badge (e.g. 208.1×) · search + filters (niche, recency, length) · "AI Template Ready" vs "Hook only" · Content Profiles with default flag · script editor with hook, category, status, profile.

**Worth copying:** outlier score (views ÷ creator baseline) · one status model across inspo/scripts/calendar · persona as Content Profile attached to every script · hooks stored separately from structures · weekly ideas drop as a scheduled workflow.

### HeyGen
- **URL:** https://app.heygen.com/home
- **Tags:** `persona-root` `looks` `plan-gate` `brand-tokens` `recreate` `post-gen-rail`

**Main flows**
1. **Avatar setup:** 15s clip → review voice → create a Look → first video.
2. **Video Agent:** avatar + voice + orientation → inspiration (Recreate reference / Intros / Captions / Format / Brand) → idea or script (Script Writer) → Plan or Auto-pilot → Generate.
3. **Template prompts:** vertical (Real Estate, Personal Brand, Course…) → preset → Create Now → Video Agent.
4. **AI Studio:** new video or template → scene-by-scene timeline.
5. **Avatar management:** profile → Looks / Voice ("Improve voice") / Motion → Use in a video.
6. **Brand System:** Brand Spec (color tokens, fonts by role) / Assets / Logos / Motion → Use or Make a copy.
7. **Post-generation:** video page → Edit / Translate / Upscale / AI Clipping / Thumbnail · Activity · Transcript → Share / Download.
8. **Projects:** history by date and type, each with source tool and credits used.

**Key controls:** persistent avatar/voice/orientation chips · Plan vs Auto-pilot · Recreate · Script Writer · industry dropdown · Looks · Motion · Brand Spec tokens + frame compositions · Ask Orby · Recents · per-project credit badge · Chat badge to reopen agent session.

**Worth copying:** persona → looks → videos graph · plan-before-generate gate · brand system as tokens + compositions (portable JSON/MD) · recreate from reference video · post-gen action rail with visible cost.

### ElevenLabs
- **URL:** https://elevenlabs.io/app (ElevenCreative `/app/home`, ElevenAgents `/app/agents`, ElevenAPI `/app/api`)
- **Tags:** `voice-profile` `delivery-tags` `node-canvas` `form-code-mirror` `api`

**Main flows**
1. **API onboarding:** pick Coding agent / JS / Python / cURL → `npx @elevenlabs/cli onboard` → first request → Request Log.
2. **Text to Speech playground:** endpoint → `voice_id` → text with inline tags (`[soft]`) → model (Eleven v4) → voice settings → live code → Run.
3. **Voices:** Explore or My Voices → filter → Create Voice (design/clone).
4. **Agents:** templates → workflow graph preview → Use template → tools / knowledge base → Tests → Conversations / Issues.
5. **Creative home:** one prompt box or tiles (Speech, Music, Voice Clone, Image, Video, Dubbing, Avatar) → Assets.
6. **Flows:** canvas → connect image/video/audio nodes across models.

**Key controls:** stability, similarity_boost, style, speed, speaker boost, clone_strength · seed, previous_text / next_text · pronunciation dictionaries · model + language · JS/Python/CLI/cURL tabs synced to form · Architect assistant · ⌘K, usage tab.

**Worth copying:** persona voice = voice_id + locked settings + seed · inline delivery tags in scripts · node canvas chaining script → voice → image → video · every UI action shows its API call · template preview + tests loop.

### Pomelli
- **URL:** https://labs.google.com/u/0/pomelli/onboarding (Google Labs)
- **Tags:** `single-profile` `entry-paths` `preview-before-commit` `brand-book` `publishing`

**Main flows**
1. **Website onboarding:** Let's go → URL → AI analysis → Business Profile.
2. **From scratch:** No website yet → From scratch → drop files → chat → Business Profile.
3. **From template:** pick sample business (Apparel, Coffee, Skincare…) → pre-built profile.
4. **Campaigns / Product Photoshoot / Brand Book + Website:** described, not reached (need a saved profile).

**Key controls:** URL field · "No website yet?" switch · template cards previewing 2 fonts + 4 hex colors on hover · ⋮ Reset / Download Business Data · Connected Apps (Google Ads, Drive, Instagram) · settings, help, feedback.

**Worth copying:** one profile drives every tool · three ways in (URL / files + chat / template) — for personas: IG handle, reference dump, archetype · preview face sheet, palette, voice before committing · brand book → persona bible export · built-in publishing closes the loop.

### MuzeBoard
- **URL:** https://www.muzeboard.ai/vault (landing: https://www.muzeboard.ai/)
- **Tags:** `prompt-library` `image-prompt` `motion-prompt` `two-axis-tags`

**Main flows**
1. **Browse → copy:** Vault → category chip → masonry grid → card → modal → Copy Prompt.
2. **Detail:** modal (image, title, category tag, style tag, full prompt) → Copy → Esc.
3. **Pipeline (landing):** image prompt → Nano Banana → matching Motion prompt → Seedance → post.
4. **Access:** Early Access $49 / I Already Purchased → Vault.

**Key controls:** category chips (All, Podcast, Lifestyle, Beauty, Fashion, Fitness, Portrait) · shoot-type badges + usage counts · detail modal · one-click copy · persona banner across outfits.

**Worth copying:** image ↔ motion prompt pairs · niche × shoot-type tags · prompt anatomy as slots (subject → wardrobe → action → setting → lighting → palette → aesthetic → quality) · persona banner as identity check · usage counts.

**Open questions:** Motion card format unverified; Podcast filter rendered empty placeholders.

### Muzecast
- **URL:** https://www.muzecast.ai/app/new
- **Tags:** `spec-sheet` `character-looks` `single-composer` `flip-remix` `byok`

**Main flows**
1. **Talking head:** workflow → script → model (HeyGen Avatar IV / Seedance 2.5) → Add avatar → Start → Library.
2. **Cinematic / B-roll:** describe shot → attach image / inspiration → Seedance 2.5 → optional avatar → Start.
3. **Flip a video:** IG/TikTok/YouTube URL → Add avatar → Start (swaps person, keeps B-roll and captions).
4. **FlipScript:** reference URL → keep structure → write your own script.
5. **Photoshoot:** avatar → prompt (no face description) or 1,000+ setups → aspect → shoot.
6. **Create avatar — Twin:** name + gender → ~12s video and/or 2–8 photos + mp3 → consent → 6-angle spec sheet.
7. **Create avatar — Described:** optional inspiration → prompt + aspect → 4 options → pick.
8. **Avatar board:** spec sheet (view/download/Rebuild) → Voice → source images → New look.

**Key controls:** workflow selector driving one composer · model selector with trade-off labels · Add avatar · Attach / Inspiration / Browse setups · spec sheet + Rebuild · setup library chips with counts + Surprise me · 9:16 / 1:1 / 16:9 · avatar filters (All / Twins / Described) · Library download/delete · credits + "nothing charged until you run it" · Settings: BYOK, default voice engine, delete account.

**Worth copying:** 6-angle spec sheet as generation anchor · character → looks hierarchy · one composer, many workflows · Flip / FlipScript trend-to-content loop · curated setups with counts, keep face out of scene prompts.

### FlipScript
- **URL:** https://www.flipscript.ai/remix (app) · https://www.flipscript.ai/ (landing)
- **Tags:** `analyze-before-generate` `script-blueprint` `versioned-remix` `single-screen`

**Main flows**
1. **Flip from URL:** Video URL tab → IG / TikTok / YT Shorts link → Transcribe & Analyze → structure breakdown → original script.
2. **Flip from file:** Upload Video tab → MP4/MOV (≤100MB) → Transcribe & Analyze → breakdown → script.
3. **Remix loop (landing, not observed):** pick script → instruction ("make it funnier", "shorten to 30s") → new version in history → switch versions.
4. **Access:** Get Lifetime Access ($57, Stan Store) → login with access code.

**Key controls:** URL / Upload toggle · URL field · upload dropzone (links to IG downloaders) · single Transcribe & Analyze button (disabled until input) · remix instruction box + version switcher · one-screen app.

**Worth copying:** cheap analyze step before expensive generation · blueprint as a structured object (hook → bridge → body → persuasion → CTA) linked to source, persona, outputs · audio + visual analysis (transcript + frames, captions, pacing, style) · natural-language remix with versions · one primary button for quick capture.

### Google Flow
- **URL:** https://flow.google.com/
- **Tags:** `character-object` `batch-recipe` `variations` `favorites` `custom-tools`

**Main flows**
1. **Project generation:** project → prompt → model (Nano Banana 2.1) + aspect (4:3 / 9:16) + count (x4) → optional Agent mode → batches with prompt, reference, date, model.
2. **Iterate:** batch → add references → rewrite/reuse prompt → regenerate → download / undo / delete.
3. **Character builder:** Characters → archetype (Eccentric, Professional, Wildcard, Familiar, Wicked, Fantastical) or from scratch → format + model → upload / add from project → Done.
4. **Tools:** My Tools / Community / Templates → open or remix → Create tool by description (upgraded plan).
5. **Library:** All media / Images / Videos / Characters / Scenes / Favorites / Uploads → search, sort → Trash.

**Key controls:** prompt bar · Agent toggle · model picker · aspect chip · count (x4) · + references · Add media · per-batch download/undo/delete · Characters · Scenes · Favorites · Create tool.

**Worth copying:** saved character reused everywhere · prompt + metadata on every batch for exact reproduction · projects by content pillar used as tags · remixable tool templates (Storyboard Studio, Character X-Ray, Style Writer, Shot Explorer, Video Resizer) · x4 variations → Favorites as approval.

### Google Workspace Studio
- **URL:** https://studio.workspace.google.com/ (reviewed in addition to the original list)
- **Tags:** `prompt-to-pipeline` `triggers` `typed-ai-steps` `approvals` `share-to-copy`

**Main flows**
1. **Prompt-to-flow:** describe a task → Create → Gemini drafts starter + steps → edit → Test run → Turn on.
2. **Template:** category chip → card → More details / Turn on.
3. **Manual build:** New flow → starter (trigger) → steps → required fields → Test run → Turn on.
4. **Manage:** Flows list / Activity (run history).
5. **Human-in-the-loop:** Approvals → Pending / All → approve or reject.

**Key controls:** starters (schedule, manual, email, chat, @mention, reaction, sheet change, file added, meeting, form response) · AI steps (Ask, Create, Deep Research, Recap, Extract, Decide, Summarize) · logic (Check if, Filter, Repeat for each) · NotebookLM knowledge · Gmail/Chat/Sheets/Drive/Calendar/Docs/Tasks actions · editor bar (rename, undo, Activity, Share, Test run, Turn on).

**Worth copying:** prompt drafts an editable pipeline, not a black box · real-world event triggers (trending sound, brand brief, comment spike, schedule) · typed AI verbs as reusable steps · approvals queue for posting/DMs/spend · outcome-named templates with share-to-copy links.

### link.me
- **URL:** https://link.me (dashboard `/profile`; public page `link.me/<handle>`)
- **Tags:** `cross-post` `auto-dm` `lead-capture` `digital-products` `agency`

**Main flows**
1. **Bio link:** Edit Profile → publish to `link.me/<handle>`.
2. **Cross-post:** Post to All → format → upload (≤1GB, ≤3 min) → caption → accounts (YT Shorts, IG Reels, TikTok, FB Reels, X, Threads, LinkedIn) → optional schedule → preview → post.
3. **Auto-DM:** Automations → trigger (keyword or always-on) → link posts → publish → activations, clicks, CTR.
4. **Leads → email:** Audience (source, temperature) → templates → campaign → history, form submissions.
5. **Digital product:** create → cover, price → Draft/Publish → shop page → Sales.
6. **Course:** Course Builder → draft → publish → learners.
7. **Agency:** invite/create managed users → managers → roll-up analytics ($99.99/mo, 5 seats).

**Key controls:** per-platform account chips · schedule toggle · post preview · automation filters + monthly activations meter (free: 1,000 activations, 3 keyword, 4 always-on) · analytics tabs + date presets + pixels · leads CSV import/export · product publish toggle · sales email export · agency roles, custom domain.

**Worth copying:** one composer → many platforms with preview, right after generation · comment keyword → DM → lead → product loop · per-persona workspaces with roll-up · productized know-how next to tools · label first-party vs platform metrics honestly.

### ManyChat
_Not reviewed this round._ Its core pattern (comment/keyword → automated DM → lead) is covered by
link.me Automations above.

---

## Reusable components

- **Skill — tool-review prompt** (Claude in Chrome side panel, one tab at a time): read-only; outputs URL, main flows, key controls, worth copying, integration surface.
- **Rule — read-only in external apps:** no Generate / Create / Buy / Save / Use template, no settings changes, no credits.
- **Workflow — reference to tested idea:** review tab → paste output here → map to an existing page → write a check → run the check against the preview → mark pass/fail.
- **Knowledge — persona object (draft fields):** identity facets · reference sheet · looks · voice (`voice_id`, model, settings, seed) · brand tokens (colors and fonts by role) · audience/tone · default flag.
