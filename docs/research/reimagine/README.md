# Reimagine: HeyGen's structure with Muzecast's one box

Status: **proposal, not built.** Nothing in the app changes until we agree on the decisions below.

## Sources

- **Muzecast** create screen. Taken from a screen recording and three screenshots you shared (November 2026), covering:
  - "What are we making?";
  - the workflow dropdown;
  - per-workflow placeholders and chips;
  - the "Add media" sheet.
- **HeyGen.** Taken from screenshots you shared: Home, Avatar (My Avatars, Voices), Brand Systems, App Library, Projects, Integrations and New Brand System. A second recording walks through a brand kit's four tabs: Brand Spec (colours and fonts with live previews), Assets, Logos and Motion. A third covers avatars and voices:
  - the My Avatars list view (a looks strip with a + tile and +N);
  - an avatar's page (voice chip, favourite, looks grid);
  - Voices (Create, Design, Import; My voices and the library, each tagged Voice Clone or Voice Design);
  - Public Avatars.
- **Muse today.** Taken from the Create screen and the code as merged after #30.

Mockups are ours, in Muse's style, light and dark. Photos come from the app's own seed influencers in `public/`. Every tool shown on a card exists today, unless a note says it's new.

## What each one does well

| | Muzecast | HeyGen | Muse now |
|---|---|---|---|
| Navigation | Thin icon rail, credits in the top bar | Icon rail with labels (Home, Avatar, Brand, Apps, Projects); a second column when a place has sections | Sidebar: Create, Influencers, Content, plus Recent, Help, Settings |
| Starting a job | One box with a workflow dropdown; cards below mirror it | Home: "Create new" plus template cards; Apps for everything else | Chips, plain links and Recipes, three styles |
| Per-job inputs | Placeholder and chips change per workflow (Attach, Inspiration, model, Add avatar, Browse setups) | Each app has its own page | Fixed chips; the placeholder says "she" even for Marcus |
| Identity | "Add avatar" chip; "Add media" sheet with Upload, My avatars and Unassigned looks | Avatar gallery (collage of looks), Voices section, setup steps on Home | Influencer list plus profile; Voice, Looks and Consistent face inside the profile |
| Tools | Five workflows | App Library with filters and recent runs | Spread across Media, profile, composer and Studio |
| Results | n/a in the recording | Projects grouped by date, type badges, Draft, credits, folders | Content › Media (single items) and Create history |

## Proposal (boards)

| Board | What it proposes |
|---|---|
| `board-0.png` | **Four places:** Home, Influencers, Apps, Content. Icon rail with labels, a second column where needed, and Usage, Help and Settings at the bottom |
| `board-1.png` | **Home:** setup steps for the selected influencer ("Step 3: Give her a voice"), one box, five workflow cards, Recent |
| `board-2.png` | **One box, five workflows:** a dropdown with descriptions; placeholder and chips per workflow; Attach opens "Add media" (Upload, Her looks, Media, Wardrobe) |
| `board-3.png` | **Influencers:** a gallery of collages (main photo plus two looks), with Voices and Brand kits as sections; New influencer offers Describe or From traits |
| `board-4.png` | **Apps:** every real tool in one library, filtered by All, Create, Enhance, Voice and Publish; recent runs in the side column; Connections moves here |
| `board-5.png` | **Content as Projects:** everything made, grouped by day, with type, status and credits; Queue and calendar, Ideas, Inbox and Deals sit in the side column; folders per influencer |
| `board-6.png` | **Brand identity, one kit per influencer:** Brand spec (colour roles, fonts, previews using her own content), Voice and words (tone, always/never, call to action, pronunciation), Assets, Motion. A kit starts from her profile, from a link, or from a style |
| `board-7.png` | **Integrations:** a grid of the real connector catalog, with an honest status on every card (Connected, Not connected, Key saved, Coming) and System check next to it |
| `board-8.png` | **Influencers as avatars:** identity = face, looks, voice and brand kit. The list view shows her looks strip; her page leads with looks (Looks, Identity, Schedule & insights, Deals) and has hover actions; Voices has its own page with type tags and Assign |

### How it maps onto what exists

| Proposed | Built today | New work |
|---|---|---|
| Talking video in the box | `/talk` engine: voice with timing, Seedance lip-sync, captions | Script-first entry in the box, plus a plan card (look, voice, length, cost) |
| Video in the box | Studio video mode | Put it in the box; Inspiration chip |
| Photoshoot in the box | Create plan, Recipes | Recipes move to "Browse setups" |
| Post in the box | Composer | Box chips for her accounts and next slot |
| Remake a reel | Nothing | Higgsfield motion transfer (`generate_video` → motion control). **New** |
| New influencer | Wizard; Design from traits | One entry with two choices |
| Add media sheet | Looks, Media, wardrobe data | One sheet with tabs and a selected count |
| Influencers gallery, Voices | Profile, PersonaVoice (library, design, remix) | Gallery page; Voices page |
| Apps | Every tool listed exists | The library page itself |
| Projects | Media, Create sessions, posts | Group by job (a photoshoot is one card); folders |
| Usage in the rail | ElevenLabs characters (built) | Higgsfield has no balance API, so its costs stay on each button. No invented number |
| Brand kits | Influencer fields: vibe words, niche, backstory, clothing style, an empty `palette` | **New:** kit editor, previews, applying the kit (see below) |
| Influencer page around looks | Profile with Looks card, face sheet, Consistent face, Voice, schedule, insights, Wardrobe and Brand Deals tabs | Rebuild the page as four tabs led by Looks. **Large change to `Influencers.jsx`**: its own session, with every flow checked |
| Voices page | Voice library, Design, Remix and Assign, all inside each profile | One Voices page listing every voice, its type and who uses it. **New:** clone from a recording, with consent |
| Integrations page | Settings › Connections (catalog, statuses, “what it does” list), System check | Move it into Apps; card grid; fix stale lines (ElevenLabs voiceovers are live, not planned) |

### Also fixed along the way

- The placeholder uses the selected influencer's name, never a fixed "she".
- The duplicate ways to start a job collapse into one: the dropdown plus the cards.

## Brand identity: how it works

One kit per influencer, stored on her record (local-first), and exportable as **W3C design tokens JSON**. That's the format Muse already uses for its own tokens, so the kit stays portable and isn't tied to any one tool.

| Part | What's in it | Where it's applied |
|---|---|---|
| Brand spec | Colour roles: background, text, accent, caption highlight, panel. Two fonts: captions and titles | Talking video captions; post covers and story slides; brand deal approval packs; palette hints in Create prompts |
| Voice and words | Tone, always-use words, never-use words, hashtags, sign-off and call to action | Composer rewrites and hashtags; talking video scripts ("Write it for me"); Inbox suggested replies; Weekly ideas |
| Pronunciation | Words and how to say them (HeyGen's Brand Glossary) | Sent to ElevenLabs as a pronunciation dictionary for every voiceover |
| Assets | Handle watermark, logo or wordmark, products and props, music beds | Watermark on talking videos and exports; products in deal shoots |
| Motion | Caption animation (bold, karaoke, none); intro and outro card | Talking videos |

**Starting a kit:**
- **From her profile:** colours are read from her main photo and looks in the browser; tone and words are drafted by Claude from her niche, vibe and backstory. You review it before saving.
- **From a link:** her Instagram, link-in-bio or a brand site.
- **From a style preset:** chosen by niche.

**New work this needs:**
1. Burning styled captions and a watermark into the video file. Today captions play as a separate track and download as `.srt`. This needs either in-browser video encoding or a Higgsfield step.
2. Reading a link. This needs a server-side page reader; today's proxy reads images only.

## Influencers as avatars: how it works

- **One identity.** Each influencer is her face (main photo, face sheet, Consistent face), her looks, her voice and her brand kit. HeyGen treats an avatar the same way.
- **The list view** shows each influencer's looks as a strip: a + tile to add looks, then her latest looks, then "+N". The grid view (board 3) shows her main photo and two looks.
- **Her page leads with her looks:**
  - The tabs are Looks, Identity, Schedule & insights, and Deals.
  - Looks can be filtered: All, Outfits, Settings, From shoots.
  - Hovering a look offers Use in Create, Talking video, Animate and Set as main.
  - The header has chips for her voice and her brand kit, plus Create with her, which opens the Home box with her selected.
- **Voices is one page** for every ElevenLabs voice:
  - each voice is tagged Designed, Remix or Library, and shows who uses it;
  - Assign gives a voice to an influencer;
  - Clone from a recording is new and asks for the speaker's consent.
- **Skipped on purpose:** HeyGen's Public Avatars. Every influencer in Muse is one you made, and nothing is pre-filled.

## Integrations: how it works

- **Where it lives:** Apps › Integrations replaces Settings › Connections.
- **What each card shows:** a status and what the service does for you, taken from the catalog's own "can" list.
  - **Connected:** a feature is using it. Higgsfield, Claude, ElevenLabs, and Ayrshare, Zapier, Make, n8n, webhook or Blueprint once you connect them.
  - **Key saved:** you've stored a key, but no feature uses it yet (HeyGen, Runway, Kling, Luma and others). The card says so plainly instead of implying it works.
  - **Coming:** listed so you can see where Muse is heading. Not built.
- **System check:** sits next to the grid, and tests every connected service without spending credits.

## Decisions needed

1. **Navigation:** move to four places (Home, Influencers, Apps, Content) on an icon rail with labels, HeyGen-style?
2. **Home:** setup steps, one box, workflow cards and Recent. This replaces today's chips, links, Recipes and the Getting started strip. OK?
3. **Box workflows:** Talking video, Video, Photoshoot and Post, with New influencer under the list. Recipes become "Browse setups" inside Photoshoot, and Idea leaves Create (it lives in Content › Ideas). OK?
4. **Remake a reel** (Higgsfield motion transfer): add it now or later? **FlipScript** (keep a reel's structure, write your own script) needs a transcript source and would be its own phase.
5. **Brand kits:** build them as the identity layer, so every workflow reads the kit? If yes, the two new pieces are captions burned into the video and a link reader. Include both, or start with the profile-based kit only?
6. **Content becomes Projects** (grouped by job, with folders), with the queue and the rest in the side column. OK?
7. **Look:** keep Muse's lavender, light and dark, as shown, rather than HeyGen's dark-only or Muzecast's warm orange?
8. **Integrations:** move Connections into Apps › Integrations, as a card grid with honest statuses?
9. **Unused keys:** for services with a key saved but no feature (HeyGen, Runway, Kling and others), wire one of them up next, or hide them until they do something?
10. **Influencer page:** rebuild it around her looks (board 8), as its own `Influencers.jsx` session? And add Clone from a recording to Voices?

## Suggested phases (after agreement)

1. **Box and Home:** dropdown, per-workflow chips, the "Add media" sheet, workflow cards, setup steps, and the placeholder fix.
2. **Navigation:** icon rail; the Apps library with Integrations; the Influencers gallery and list view, and the Voices page.
3. **Brand identity:** kit editor and previews; build a kit from her profile; apply it in the composer, scripts, replies and deal packs; pronunciation for ElevenLabs. Then captions burned into the video and import from a link.
4. **Influencer page around looks** (its own session, with every flow checked).
5. **Content as Projects:** grouping and folders.
6. **Remake a reel.**
