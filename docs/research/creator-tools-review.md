# Creator Tools Review — Muse Studio

Read-only review of external creator tools, gathered tab-by-tab with the Claude in Chrome
side panel (no settings changed, nothing generated, no credits spent). Target app: Muse Studio
(`ai-influencer-git-claude-muse-studio-369cvs-projects.vercel.app`, branch `claude/muse-studio`).

Constraints for every idea: map to an existing page (Home, Studio, Content, Plan,
Settings, influencer profile) · no new sidebar items · light mode only.

## Index

| Tool | Status | One-line takeaway | Feeds ideas |
|---|---|---|---|
| [Higgsfield](#higgsfield) | Reviewed | Structured character schema, motion transfer from reference video, recipes over MCP | 1, 2, 3, 9 |
| [Blueprint](#blueprint) | Reviewed | Outlier-ranked inspo → script → calendar, one status model, Content Profiles | 5, 8, 10 |
| [HeyGen](#heygen) | Reviewed | Persona → Looks/Voice/Motion; plan-before-generate; post-gen action rail | 1, 2, 3, 9 |
| [ElevenLabs](#elevenlabs) | Reviewed | Voice = voice_id + locked settings + seed; inline delivery tags; form↔code mirror | 6 |
| [Pomelli](#pomelli) | Reviewed | One profile feeds every tool; three entry paths; brand book export | 1 |
| [MuzeBoard](#muzeboard) | Reviewed | Prompt vault with image ↔ motion pairs, tagged niche × shoot type | 4, 7 |
| [Muzecast](#muzecast) | Reviewed | 6-angle spec sheet anchor; one composer, many workflows; Flip a viral URL | 1, 2, 4, 6, 7 |
| [FlipScript](#flipscript) | Pending | (Muzecast exposes a FlipScript workflow: keep reference structure, rewrite script) | 2 |
| [ManyChat](#manychat) | Pending | | |
| [Google Flow](#google-flow) | Pending | | |
| [link.me](#linkme) | Pending | | |

### What Muse Studio already has (checked on `claude/muse-studio`)

Sidebar: Home, Influencers, Content, Plan (+ Settings). Studio has Photo / Video modes.
Plan has Board (idea → draft → scheduled → posted), Creators, Inspiration views. Content has a
media view. Influencers have a character sheet and a wardrobe/looks drawer. Settings has a
labeled API-key vault (Higgsfield, Claude, ElevenLabs label). Ideas below build on these, they
don't duplicate them.

---

## Ranked ideas

Ranked by value to an AI-influencer workflow ÷ effort. Effort: S (≤1 day), M (2–4 days), L (week+).

| # | Idea | Page | Sources | Effort |
|---|---|---|---|---|
| 1 | Persona profile as single source of truth | Influencer profile | Pomelli, Higgsfield, HeyGen, Muzecast, Blueprint | M |
| 2 | Remix from a reference URL | Studio | Muzecast (Flip/FlipScript), HeyGen (Recreate), Higgsfield (Motion transfer) | L |
| 3 | Plan + cost before Generate | Studio | HeyGen (Plan vs Auto-pilot), Higgsfield, Muzecast | S |
| 4 | Paired image ↔ motion prompts, one-click Animate | Studio | MuzeBoard, Muzecast | M |
| 5 | Outlier score on tracked creators | Plan → Creators | Blueprint | M |
| 6 | Persona voice (ElevenLabs BYOK) | Settings + influencer profile | ElevenLabs, Muzecast | M |
| 7 | Two-axis chips + counts + "Surprise me" | Plan → Inspiration | MuzeBoard, Muzecast | S |
| 8 | One status model from Inspiration to Board | Plan | Blueprint | S |
| 9 | Post-generation action rail | Content | HeyGen, Higgsfield | M |
| 10 | Weekly ideas drop card | Home | Blueprint | M |

### 1. Persona profile as single source of truth — Influencer profile
Extend the existing character sheet into a portable persona object every generator reads:
identity attributes (Higgsfield-style facets, not free text), face/angle reference sheet with
**Rebuild** (Muzecast), Looks (already via wardrobe), voice (idea 6), palette + font tokens by
role (HeyGen Brand Spec, Pomelli), audience/tone (Blueprint Content Profile). Add **Export
persona bible** (Markdown + JSON) for collaborators.
- **Check:** profile shows Identity / Looks / Voice / Brand sections; Studio's prompt uses
  identity fields when that influencer is selected; Export downloads `.md` and `.json`.

### 2. Remix from a reference URL — Studio
New option in Studio's composer: paste an IG/TikTok/YouTube URL → choose **Swap in persona**
(Higgsfield motion transfer with the persona sheet) or **Keep structure, new script**
(FlipScript pattern, script drafted by Claude in the persona's tone). Mode lives in the
existing composer, not a new page.
- **Check:** pasting a URL reveals the two options; Swap shows the reference + persona +
  credit estimate before Generate; Keep-structure returns an editable script.

### 3. Plan + cost before Generate — Studio
Show model, settings, prompt summary and credit estimate on/near the Generate button; optional
"Review plan" step for batches. Prevents wasted spend.
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

### 6. Persona voice — Settings + influencer profile
Use the existing ElevenLabs key slot in Settings. On the profile, a Voice section stores
`voice_id`, model, locked settings (stability, similarity, style, speed) and seed, plus a
preview line. Scripts support inline delivery tags (`[soft]`, `[excited]`).
- **Check:** with a key saved, profile lists voices and saves one; without a key, it links to
  Settings; settings persist after reload.

### 7. Two-axis chips + counts + "Surprise me" — Plan → Inspiration
Niche chips (Lifestyle, Beauty, Fashion, Fitness…) × shoot-type chips (Editorial, UGC,
Streetstyle, Headshot, Motion) with counts; "Surprise me" picks 6 random items. Tags, not
folders.
- **Check:** combining one chip from each row narrows the grid; counts match results; Surprise
  me shows 6 items.

### 8. One status model from Inspiration to Board — Plan
Inspiration items get To create / Created / Skipped; "To create" drops a card into Board's
Idea column linked back to its source.
- **Check:** marking an inspiration item To create creates a Board card with a source link;
  Skipped hides it from the default filter.

### 9. Post-generation action rail — Content
On a media item: Animate, Upscale, Reframe (9:16 / 1:1 / 16:9), **Recreate settings** (reopen
Studio with the exact prompt/model/seed), and the credits it cost.
- **Check:** opening a media item shows the rail; Recreate opens Studio with identical
  settings.

### 10. Weekly ideas drop — Home
A Home card: "This week's ideas", generated on demand from persona (idea 1) + tracked creators
(idea 5) + saved inspiration; each idea can go to Plan in one click.
- **Check:** Home shows the card with an empty state; Generate produces ideas; "Add to Plan"
  creates Board cards.

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

Fastest wins for Muse Studio: Higgsfield (already integrated) for ideas 2, 3, 9; ElevenLabs
(key slot exists) for idea 6; Blueprint MCP is useful from Claude for research, not as an
in-app dependency.

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
_Pending — paste side-panel output._ (Seen inside Muzecast as a workflow; standalone tab not yet reviewed.)

### ManyChat
_Pending._

### Google Flow
_Pending (labs.google/flow)._

### link.me
_Pending._

---

## Reusable components

- **Skill — tool-review prompt** (Claude in Chrome side panel, one tab at a time): read-only; outputs URL, main flows, key controls, worth copying, integration surface.
- **Rule — read-only in external apps:** no Generate / Create / Buy / Save / Use template, no settings changes, no credits.
- **Workflow — reference to tested idea:** review tab → paste output here → map to an existing page → write a check → run the check against the preview → mark pass/fail.
- **Knowledge — persona object (draft fields):** identity facets · reference sheet · looks · voice (`voice_id`, model, settings, seed) · brand tokens (colors and fonts by role) · audience/tone · default flag.
