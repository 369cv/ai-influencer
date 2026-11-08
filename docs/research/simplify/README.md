# Simplify Muse: one box, a free plan, the influencer as identity

Status: **phases 1, 2 and 4 built** (Create box and plan, influencer looks, one entry point per job); phase 3 (talking video, remake a reel) waits on lip-sync and motion transfer. Researched from HeyGen's current help center (articles and screenshots from 2026), HeyGen's public product pages, and Muzecast's public homepage. Muzecast's `/app/new` and HeyGen's signed-in app need a login, which this cloud session can't use. YouTube refused automated access ("confirm you're not a bot"), so no tutorial videos were watched.

## What they do (findings)

### HeyGen, current app
- **Left rail with 5 items:** Home, Avatar, Brand, Apps, Projects. Recent sessions are listed under Home ("Today", "Previous 30 days").
- **Home is one box: "Say it with video".**
  - Chips sit inside the box: **Avatar** (David), **Voice**, **Brand System**.
  - **Options** set length, orientation and whether Seedance is on.
  - A mode switch picks **Chat** or **Autopilot**.
  - Shortcuts below the box: Course lesson, Use Avatar V, Use Brand System, Upload docs, Script to video. App tiles below those: Create an Avatar, Speech cleanup, Photo to Video, Translate, Avatar Shots.
- **Video Agent flow, in 8 steps:**
  1. Configure: avatar, voice, duration, aspect ratio, brand.
  2. Upload assets.
  3. Write script.
  4. Write instructions.
  5. **Review Video Plan (free).**
  6. **Generate**, where credits are spent.
  7. Edit a copy in AI Studio.
  8. Export.
- **Plan screen:**
  - chat on the left, with artifacts (plan versions) in a list;
  - the plan card on the right: title, script, style, avatar, voice, details (length, orientation, language, Seedance) and an estimate ("60–75 credits"), with **Edit** and **Generate**.
- **Small edits don't re-render everything.** "Edit this scene" changes only that scene. Bigger structural changes go back to a new plan.
- **Avatar = one identity with many Looks:**
  - up to 500 looks per avatar, covering outfits, settings, angles and gestures;
  - **Add more looks** sources: Upload, Design with AI, webcam, Google Drive, Instagram, YouTube, TikTok, a link, or record on a phone;
  - **Avatar V** learns from a 15-second video and uses that person's own motion for any photo of them.
- **Voices:** one picker with tabs (the avatar's voices, My voices, Library), "Top matches" for the avatar, and filters for language, accent, gender, use case and age.
- **Fast paths are "Apps":**
  - Quick Avatar Video: avatar → script → voice → motion engine → resolution → generate;
  - Batch Mode: several scripts and avatars in one job;
  - Avatar Shots (Seedance 2): a prompt with up to 3 avatars;
  - Product Placement: a product image plus an avatar.
- **The AI Studio editor was redesigned "with simplicity in mind":**
  - the script is the timeline;
  - a right-side panel for Avatar, Script, AI tools, Media, Text, Music, Captions, Templates and Layers;
  - a pre-submit check ("Notice before you submit").

### Muzecast
- **One box** for every job: paste a reel or drop a photo or video, then pick one of five chips (Flip a video, Talking head, Cinematic or b-roll, Create an avatar, Photoshoot). **Your avatar** is a chip too, then Generate.
- **"Nothing renders until you say so."** Every workflow ends in the same place: each decision listed in order, each one editable, and the cost on the button. It warns before a run would exceed your balance.
- **Character first:**
  - a six-angle **spec sheet** per character "stops look number fifteen drifting";
  - the voice is cloned once and used everywhere;
  - talking videos give each segment a **word budget**.
- Results are shown **side by side** so you see what changed before posting.

## What changes for us

| Today | Proposed |
|---|---|
| 6 ways to start the same jobs: Home composer, New menu (7 items), Studio, Photo Studio and Video Studio inside the profile, Workflows, Plan | **Create:** one box. Chips choose the job; influencer, voice and format are chips inside the box |
| Settings are filled in before you know the cost | **Plan before anything is made:** free to change, cost on the button, a balance warning |
| Workflows are a separate gallery | Workflows become **plan templates** (the chips under the box) |
| Plan (ideas and projects) is a separate page | Ideas live in **Create history**; a plan *is* the project |
| Studio as the main way in | **Edit in Studio** stays for fine control after a plan or result |
| The influencer profile is long, with many sections | **Influencer = identity:** looks, face sheet and voice, with tabs for posts, schedule and deals |
| Nav: Home, Influencers, Content, Plan, plus New, plus Settings | Nav: **Create, Influencers, Content**, plus Settings |

## Boards

| Board | Shows |
|---|---|
| `board-0.png` | Before and after: today's 6 entry points vs 3 places |
| `board-1.png` | Create: one box with influencer, voice and format chips; job chips; recent requests in the rail |
| `board-2.png` | Plan: chat on the left, editable plan on the right (shots, words with a budget, look, voice, format, where it goes), cost on the button |
| `board-3.png` | Result: the video, redo one shot, caption, Add to queue in her next slot |
| `board-4.png` | Influencer as identity: looks grid, face sheet, voice, tabs |
| `board-5.png` | Add looks: describe, from Media, upload, from a link, wardrobe, record |

All screens are shown in light and dark.

## How it maps onto what exists (build honesty)

| Piece | Exists | Needs |
|---|---|---|
| Box, chips, history | Home composer, influencer chips, `muse_workflow_runs` | One component on Home and a history list in the rail |
| Plan | Workflow runs (setup, cost estimate, review step), skills, Claude | A Claude planner that turns the request into steps, then a plan card that edits those steps. Costs come from `creditEstimate.js` |
| Make it | Studio generation code, `workflowRun.js` engine, Seedance via Higgsfield | Run the plan's steps with the existing engine |
| Redo one shot | Each run keeps per-step output | Re-run a single step |
| Talking video | ElevenLabs proxy (preview length only) | A lip-sync model and a public audio upload (from the earlier F3 board) |
| Remake a reel | Higgsfield's MCP lists motion transfer | Read a pasted reel and transfer motion. Its own phase |
| Looks | Wardrobe, photo history, angle-sheet skill | A `looks` list per influencer, and an Add looks sheet that saves into it |

## Suggested phases

1. **Create box and plan for photoshoots** (no new providers): box, chips, plan card, Make it, result, Add to queue. Retire the New menu, and turn Workflows into chips.
2. **Influencer as identity:** looks, face sheet and voice on one page; Add looks.
3. **Talking video and Remake a reel**, which need lip-sync and motion transfer.
4. **Remove leftovers:** Plan page, separate Photo Studio and Video Studio entry points (Studio stays for "Edit in Studio").

## Decisions needed

1. Approve the three-place structure: **Create, Influencers, Content** (plus Settings)?
2. Plan step: chat on the left (HeyGen style), or only the editable plan card (Muzecast style, simpler)?
3. Does Plan (ideas and projects) disappear into Create history, or stay as a small tab under Content?
4. Start with phase 1 (photoshoots only), or include talking videos from the start?

## Sources

- HeyGen help center: [How to get started with Video Agent](https://help.heygen.com/en/articles/12402907-how-to-get-started-with-video-agent), [Overview of the new AI Studio](https://help.heygen.com/en/articles/11049655-overview-our-new-ai-studio), [Avatar V](https://help.heygen.com/en/articles/14602974-avatar-v-is-now-available-on-heygen), [Avatar Looks Explained](https://help.heygen.com/en/articles/9964694-avatar-looks-explained), [Quick Avatar Video](https://help.heygen.com/en/articles/12903996-quick-avatar-video), [Batch Mode](https://help.heygen.com/en/articles/12704317-batch-mode), [Avatar Shots](https://help.heygen.com/en/articles/14448006-avatar-shots-powered-by-seedance2), [Getting started with Voices](https://help.heygen.com/en/articles/9834925-how-to-get-started-with-voices)
- [HeyGen Video Agent page](https://www.heygen.com/video-agent)
- [Muzecast](https://www.muzecast.ai/)
- YouTube tutorials found but not watched (automated access refused): [HeyGen Tutorial 2026](https://www.youtube.com/watch?v=_j30ZiY5Okk), [How To Use HeyGen Video Agent](https://www.youtube.com/watch?v=otJfT9tPuKM), [How to Use HeyGen Avatar V](https://www.youtube.com/watch?v=6JaW8si98q8)
