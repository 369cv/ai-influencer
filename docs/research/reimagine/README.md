# Reimagine: HeyGen's structure with Muzecast's one box

Status: **proposal, not built.** Nothing in the app changes until we agree on the decisions below.

## Sources

- **Muzecast** create screen. Taken from a screen recording and three screenshots you shared (November 2026), covering:
  - "What are we making?";
  - the workflow dropdown;
  - per-workflow placeholders and chips;
  - the "Add media" sheet.
- **HeyGen.** Taken from five screenshots you shared: Home, Avatar (My Avatars, Voices), Brand Systems, App Library and Projects.
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
| `board-6.png` | **Brand kits (optional, new):** one kit per influencer (colours, caption style, words to use and avoid, watermark), used by captions, talking videos and deal packs |

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
| Brand kits | Nothing | **New** feature |

### Also fixed along the way

- The placeholder uses the selected influencer's name, never a fixed "she".
- The duplicate ways to start a job collapse into one: the dropdown plus the cards.

## Decisions needed

1. **Navigation:** move to four places (Home, Influencers, Apps, Content) on an icon rail with labels, HeyGen-style?
2. **Home:** setup steps, one box, workflow cards and Recent. This replaces today's chips, links, Recipes and the Getting started strip. OK?
3. **Box workflows:** Talking video, Video, Photoshoot and Post, with New influencer under the list. Recipes become "Browse setups" inside Photoshoot, and Idea leaves Create (it lives in Content › Ideas). OK?
4. **Remake a reel** (Higgsfield motion transfer): add it now or later? **FlipScript** (keep a reel's structure, write your own script) needs a transcript source and would be its own phase.
5. **Brand kits:** include (new feature) or skip?
6. **Content becomes Projects** (grouped by job, with folders), with the queue and the rest in the side column. OK?
7. **Look:** keep Muse's lavender, light and dark, as shown, rather than HeyGen's dark-only or Muzecast's warm orange?

## Suggested phases (after agreement)

1. **Box and Home:** dropdown, per-workflow chips, the "Add media" sheet, workflow cards, setup steps, and the placeholder fix.
2. **Navigation:** icon rail; the Apps library; the Influencers gallery and Voices.
3. **Content as Projects:** grouping and folders.
4. **New features:** Remake a reel; Brand kits.
