# What's next: cut, merge, and add Higgsfield, ElevenLabs and Buffer features

Status: **proposal, not built.** Research was done in November 2026 from:
- Mobbin's current web flows for Higgsfield, ElevenLabs and Buffer;
- the official docs and help centers (docs.higgsfield.ai, elevenlabs.io/docs, support.buffer.com, buffer.com/whats-new);
- the Higgsfield and ElevenLabs tool descriptions (read only; nothing was generated).

Each board shows the screen in light and dark. The mockups are ours. Research screenshots aren't committed.

## Boards

| Board | What it proposes | From |
|---|---|---|
| `board-0.png` | What to cut, merge and keep | Audit of Muse |
| `board-1.png` | Identity: a consistent face via a Higgsfield **Element**; **Design from traits**; a designed voice in 3 takes | Higgsfield, ElevenLabs |
| `board-2.png` | Photo edit toolbar: Upscale, Relight, Angles, Expand, Remove BG, Animate with motion presets | Higgsfield |
| `board-3.png` | Talking video: script with word budgets → v4 speech → lip-sync → captions and music → queue | ElevenLabs, Higgsfield |
| `board-4.png` | Content: posting goal and streak, "Great time to post" slots, Ideas board, Deals tab | Buffer |
| `board-5.png` | Composer: assistant rewrite chips, live preview, virality score, Create another | Buffer, Higgsfield |
| `board-6.png` | Brand deal ads: product, her face and a format (UGC, try-on, unboxing), with a quote first | Higgsfield Marketing Studio |

## 1. Cut and merge (no new APIs)

The audit found pages that lost their nav link when the New menu was removed:
- **Workflows** is only reachable from inside Studio.
- **Brand deals** is only reachable from Needs you and the profile.
- **Plan** is only reachable from the Idea chip.

There are also duplicates on Create, and profile tabs that repeat other screens.

| Change | Where it goes |
|---|---|
| **Cut the Plan page** | Ideas become **Content › Ideas** (a board). Creators tracking is dropped (it can come back via Virlo). Inspiration becomes references in Add looks. |
| **Cut the Workflows page** | Its recipes become chips in Create: Photo → reel, Brand deal shoot, Daily post. The run engine stays. |
| Cut "Pick up where you left off" and "Your influencers" on Create | They repeat Needs you, recent requests and the sidebar. |
| **Cut the advanced photo and video studios** (after phases 2–3) | They become the photo edit toolbar and talking video. Then delete `PhotoStudio.jsx` (1,800 lines) and the profile's video panel. |
| Cut profile tabs Scripts, Home and History | Scripts → talking video; Home → looks; History → Content › Media. |
| Merge Wardrobe → Looks | One place for outfits, settings and poses. |
| Merge Brand deals → **Content › Deals** | Back in the nav. |
| Merge Weekly ideas → Ideas board; Studio templates → Create chips | One way to start. |
| Show credits everywhere | A Higgsfield and ElevenLabs balance in the sidebar, and the cost on every button. |

## 2. Higgsfield: what we add (through the existing sign-in)

| Feature | In Muse | Tool / API |
|---|---|---|
| **Elements** for consistency | "Consistent face" on the influencer; sent automatically with every generation | `manage_reference_elements`, `<<<id>>>` in prompts |
| AI Influencer builder | "Design from traits" on New influencer and on Looks | `ai_influencer_prepare` (quote) → `ai_influencer_generate` |
| Edit toolbar | On every photo: Upscale, Relight, Angles, Expand, Remove BG | `upscale_image`, `relight_image`, `outpaint_image`, `remove_background` |
| Animate with presets | On a photo: motion presets with her Element | `get_presets` + video generation (Seedance) |
| Motion control | "Copy a move" from a trend clip (Studio) | `motion_control` |
| Lip-sync | The talking video step | Higgsfield lip-sync / avatar video |
| Marketing Studio | Brand deal ads from a deliverable | Ads Studio (quote → approve → generate) |
| Reframe | "Make 9:16 / 1:1" on a queued post | `reframe` (video), `outpaint_image` (photo) |
| Virality score | A badge in the composer before scheduling | `virality_predictor` |
| Credits | A balance in the sidebar; out-of-credits link | `show_plans_and_credits` |

**Skip:**
- Supercomputer, Canvas, Cinema Studio, Vibe Motion, websites and 3D: off-scope.
- Community feed and TikTok publish: we post through Ayrshare and webhooks.
- Face Swap and Character Swap: consent risk.
- Non-human characters.

## 3. ElevenLabs: what we add (through your key)

| Feature | In Muse | Endpoint |
|---|---|---|
| **Voice Design** | Design her voice from a description: 3 takes, save one | `POST /v1/text-to-voice/design` → `POST /v1/text-to-voice` |
| Full speech, v4/v3 | Talking video and voiceovers; emotion tags added by Claude | `POST /v1/text-to-speech/{voice}` and `/with-timestamps` |
| Voice library | A picker with language, accent and category filters | `GET /v1/shared-voices`, `POST /v1/voices/add/…` |
| Voice Remix | "Tweak her voice" (older, softer, accent) | `POST /v1/text-to-voice/{voice}/remix` |
| Captions | Timing from speech, burned into talking videos | `/with-timestamps`, `POST /v1/forced-alignment` |
| Sound effects and music | An optional bed for videos | `POST /v1/sound-generation`, `POST /v1/music` |
| Dialogue | Two-influencer collab posts | `POST /v1/text-to-dialogue` |
| Usage | Characters left, in the sidebar | `GET /v1/user/subscription` |

**Skip:**
- Agents (phone and WhatsApp bots), Studio long-form, and the Dubbing editor (it has no lip-sync; Higgsfield dubbing does).
- Professional cloning (30+ minutes of audio plus verification), and Image/Video/Flows (duplicates Higgsfield).
- ElevenLabs Avatars: no API.

Note: ElevenLabs now recommends **Eleven v4** over v3.

## 4. Buffer: what we copy (posting stays Ayrshare or webhooks)

| Feature | In Muse |
|---|---|
| **Posting goal and streak** | A weekly bar per influencer (Content, profile); "behind goal" in Needs you |
| **Best times** | "Great time to post" in empty slots; *Suggest best times* from her Ayrshare stats |
| **Ideas board** | Content › Ideas (To do / In progress / Done), Generate ideas, Make it → Create |
| **Assistant in the composer** | Shorter, More casual, Add a hook, Rewrite for TikTok, Hashtags (Claude, in her voice) |
| **Live preview and Create another** | A per-platform preview; keep the composer open for the next post |
| Insights takeaways | 2–3 action cards (repost the top post, behind goal) and a per-post table by engagement rate |
| Bulk import | A CSV with a review table (valid or error per row) → drafts or schedule |
| Queue actions | Pause per influencer, Shuffle, Clean failed |
| Comments inbox (optional) | Replies by post with suggested replies in her voice (Ayrshare comments) |

**Already have:**
- Queue, Drafts, Sent and Failed.
- Slots with "Add to queue".
- Per-platform captions, Reel and Story, first comment, approval.
- Edit and cancel, the calendar, stats, and Needs you.

**Skip:** Start Page (link in bio), team roles, Notes, RSS feeds, and Buffer's own channel connections.

## Suggested phases

1. **Cut and merge** (board 0): no new APIs, and the biggest simplification.
2. **Identity and editing** (boards 1–2): Elements, Design from traits, Voice Design, the edit toolbar, credits in the sidebar.
3. **Talking video** (board 3): ElevenLabs speech plus Higgsfield lip-sync. Then delete the advanced studios.
4. **Content upgrades** (boards 4–5): goal and streak, best times, Ideas board, composer assistant and preview.
5. **Brand deal ads, virality, bulk import, comments** (board 6 and the rest).

## Decisions needed

1. OK to **delete the Plan and Workflows pages**, with their contents moved as listed?
2. OK to drop **Creators tracking** (it can return later via Virlo)?
3. Phase 3 spends both Higgsfield credits and ElevenLabs characters per video, with the cost shown first. OK?
4. The **comments inbox** is a bigger piece. Include it, or leave it for later?
5. Order: start with phase 1 (cuts), or phase 2 (identity and editing)?

## Sources

**Higgsfield**
- Mobbin flows: [Create video](https://mobbin.com/flows/d52f6d7a-66ba-4ed9-a637-0a3e9d9979c7), [AI influencer](https://mobbin.com/flows/a1726fe0-86dd-4ecf-a4c3-31d31e2b2495), [Marketing studio](https://mobbin.com/flows/939f6ace-19e9-4a9d-8403-6ad67f24a77e)
- Mobbin screens: [Upscale](https://mobbin.com/screens/e856550c-454e-47d3-9d4e-730d071fbb3d), [New Element](https://mobbin.com/screens/f3e38c62-e667-47de-9eb9-3484e47210cd)
- [docs.higgsfield.ai](https://docs.higgsfield.ai/docs)

**ElevenLabs**
- Mobbin: [Voice design](https://mobbin.com/flows/a1802f15-2505-471d-8699-3d5255730459), [TTS v3](https://mobbin.com/screens/fe8dcb43-f770-4ade-894d-0e187d80b874)
- Docs: [models](https://elevenlabs.io/docs/overview/models), [voice design API](https://elevenlabs.io/docs/api-reference/text-to-voice/design.md), [dubbing has no lip-sync](https://elevenlabs.io/docs/help-center/product/dubbing/do-you-offer-lip-sync-in-dubbing.md)

**Buffer**
- Mobbin: [Creating a post](https://mobbin.com/flows/b5652876-bca3-480f-a4de-becb8604d91c), [Generating slots](https://mobbin.com/flows/d2b3fcdf-8a98-498b-b4e8-376e5bf22b04), [Ideas board](https://mobbin.com/screens/da874a75-42ac-40c2-a93b-46f0a4fc9982)
- [What's new](https://buffer.com/whats-new)
- Support: [posting goals](https://support.buffer.com/articles/setting-posting-goals-in-buffer-Kcie9zPCy9), [Insights](https://support.buffer.com/articles/using-insights-in-buffer-x4gLauQU5a)
