# Scheduling and posting automation: proposal

Status: **proposal, not built.** Nothing in the app changes until this is approved.
Reference: Buffer (web), via Mobbin. Visuals: `proposal-1.png` … `proposal-4.png` in this folder; current state: `before-list.png`, `before-composer.png`.

## Index

| # | Piece | Type | One line |
|---|---|---|---|
| A | Audit | knowledge | What Muse does today and where it makes you do double work |
| B | Buffer review | knowledge | What Buffer does well, what we copy, what we skip |
| C | Posting schedule | feature | Time slots per influencer: time zone, weekly goal, slots per day |
| D | Queue view | feature | Content → Queue: posts in slots, empty slots, status tabs, retry |
| E | Composer upgrade | feature | Influencer-first, per-platform captions, format, first comment, "Add to queue" |
| F | Batch scheduling | workflow | Pick media → skill writes captions → review table → schedule all |
| G | Backend contract | rules | How posts actually go out on time, edits, cancels and retries |
| H | Phases | project | Three PRs, smallest first |
| I | Test plan | rules | What must pass before each PR is merged |

---

## A. Audit: Muse today

What works:
- Content has Calendar, List and Media views, plus status and account filters.
- Composer: account chips, caption, Draft with a skill, media from Library, influencer, date and time, Approve, Download pack, Post now or Schedule.
- Posting routes (just shipped): Ayrshare, Zapier, Make, n8n and webhook. Each account picks its route.

Where it makes you do double work, or falls short:
1. **Two pickers for one choice.** You pick the influencer, then pick each of her accounts again as separate chips. The chips don't even show whose account is whose.
2. **Every post needs a hand-typed date and time.** There's no posting schedule and no "next free slot".
3. **No queue.** You can't see gaps ("Kayla has nothing Sunday"), and the List view mixes drafts, scheduled and failed posts together.
4. **One caption for every platform.** It's the same text for X (280 characters) and Instagram (2,200), with no length check.
5. **No format choice** (Reel, Post or Story) and **no first comment.**
6. **Posting one at a time.** Studio makes 6 photos, and each needs its own composer pass.
7. **Failed posts can't be retried.** You have to open them, re-send to every route, and risk double-posting on the routes that already worked.
8. **Editing or deleting a scheduled post doesn't reach Ayrshare or the automation.** The post would still go out.
9. **Bug:** the composer shows a stray `0` next to "Save draft" when the post is empty (`src/pages/Content.jsx:300`, `{canApprove && …}` where canApprove is `0`).

## B. Buffer review (Mobbin)

| Buffer screen | What it does | Our take |
|---|---|---|
| [Channel queue](https://mobbin.com/screens/72d4bfa1-5c2b-46a7-8165-cc6050b32f63) | Posts listed by day at their slot times, empty slots show "+ New" | **Copy** → D |
| [Queue tabs with errors](https://mobbin.com/screens/af871c1d-00d1-4c74-a4a4-87ae2e9455c8) | Queue · Drafts · Approvals · Sent; failed posts show the error and "Retry Now" | **Copy** → D |
| [Posting schedule](https://mobbin.com/screens/c1d2277e-00b7-4acc-aac0-19a548da5754) | Time zone, weekly posting goal, slots per weekday, on/off per day | **Copy, per influencer** → C |
| [Recommended times](https://mobbin.com/screens/afd4d3e0-87e2-4f81-8b59-ae3fcbf6960e) | "These are your recommended times to post" | **Adapt honestly**: "starter times" until we have analytics |
| [Composer with network fields](https://mobbin.com/screens/2a849d19-7431-4ca5-b5a9-5e4739c6edd4) | Post / Reel / Story, first comment, live preview, "Next Available" | **Copy** → E |
| [Customize for each network](https://mobbin.com/screens/585dcc48-2ca9-4129-ac0c-63708ddc44df) | One caption, then per-network edits | **Copy** → E |
| [Slot picker in composer](https://mobbin.com/screens/63299fa6-69cd-429e-9ad8-6295d05f888b) | Calendar with the channel's posting slots, plus a custom time | **Copy** → E |
| [Bulk upload review](https://mobbin.com/screens/e1a5b7cb-1f3b-4c3b-8930-feee1c348ec5) | Table of posts with errors, "Save as drafts" or "Schedule posts" | **Copy, fed by Studio and skills** → F |
| [Calendar with post popover](https://mobbin.com/screens/5730b450-ae0f-42f7-88e4-86a0a33b0dc9) | Month and week views, post preview with stats | Keep our calendar; add stats later |

What we skip:
- **Buffer's channel sidebar.** Our rule is no new sidebar items, so influencer chips sit at the top of Content instead.
- **Green branding and dark mode.** Muse is light-only, with violet `--accent`, Figtree and our radii.
- **Tags, Start Page, the Community inbox, and "Notify me" mobile reminders.** We have no mobile app, and these are separate projects.
- **Buffer's AI Assistant panel.** Our skills already do this, and do it better (the influencer's voice plus your SKILL.md files).

## C. Posting schedule (visual: proposal-3.png)

- Per **influencer**, not per workspace or per account. Kayla posts at New York hours and Marcus at London hours.
- Fields:
  - time zone (IANA);
  - weekly goal;
  - slots per weekday, each day with an on/off switch;
  - optional per-platform override ("All accounts ▾").
- "Use starter times" fills common-practice defaults per platform, labelled as defaults, not "best times". Real best times come later from Ayrshare analytics.
- Where it lives:
  - a "Posting schedule" card on the influencer profile (Overview);
  - a link to it from Settings → Social accounts.
  - No new sidebar item.
- Stored on the influencer as `postingSchedule: { tz, weeklyGoal, days: { 0: ['10:00','18:00'], … }, byPlatform?: {…} }`.

## D. Queue view (visual: proposal-1.png)

- Content views become **Queue · Calendar · Media**. "List" turns into Queue: the same data, grouped and with slots.
- **Influencer chips** with avatars and platform logos replace the account dropdown. "All influencers" is the default.
- **Tabs with counts:** Queue · Drafts · Needs approval · Sent · Failed.
- **Empty slots** are drawn from each influencer's schedule for the next 7 days. Clicking one opens the composer already set to that influencer and time.
- **Failed** posts show:
  - the route's real error message;
  - **Retry**, which re-sends only the routes that failed;
  - **Edit**.

## E. Composer upgrade (visual: proposal-2.png)

1. **Posting as.** Choose the influencer and all her accounts are selected; untick one to skip it.
2. **One caption, then tweak per platform.**
   - Platform tabs, with a dot on any platform that has its own edit.
   - Live character limits: Instagram 2,200 · TikTok 2,200 · X 280 · Threads 500 · Bluesky 300 · LinkedIn 3,000 · Pinterest 500 · YouTube title 100.
   - The existing `validatePost` checks are extended with these limits.
3. **Format:** Instagram Post / Reel / Story; YouTube Short.
4. **First comment** (optional), for Instagram and others where the route supports it.
5. **When.** The split button defaults to **Add to queue · next free slot**. The menu offers: Pick a slot · Custom date and time · Post now. Save draft and Send for approval stay.
6. The footer shows the route ("Posts through Ayrshare") and the influencer's time zone.

## F. Batch scheduling (visual: proposal-4.png)

- **Entry points:**
  - "Schedule a batch" on Content;
  - "Schedule these" on a finished Studio job or a Media selection.
- **Steps:**
  1. Pick the influencer and the media.
  2. Optionally run a caption skill (default: Short-form content writer), one call per post, with the influencer's context.
  3. A review table shows each post's thumbnail, caption (editable), accounts, slot and status.
  4. Choose Schedule N posts, Send for approval, or Save all as drafts.
- **Slots** are assigned in order from the influencer's free slots.
- **Problems** are checked before anything is sent, with the same checks as the composer: missing video, caption too long, no route, media stored only in this browser.

## G. Backend contract: how this actually works

Muse is local-first, with no server database and no background job runner. So:

1. **"Scheduled" always means handed to a route.**
   - When you add a post to the queue, Muse immediately sends it to the route with `scheduledAt`. Nothing waits in the browser.
   - **Ayrshare** stores the post and publishes it at that time.
   - **Zapier, Make, n8n and webhooks** receive `scheduledAt` and must wait themselves. Each route's setup page gets a tested recipe:
     - Zapier: "Delay Until".
     - n8n: a "Wait" node set to a date and time.
     - Make: can't sleep for hours, so it gets a data store plus a scheduled scenario.
2. **Posts with no route connected** stay **Planned**. Home lists what's due today, with Download pack.
3. **Edits and cancels after scheduling** have to reach the route, or the old version still goes out:
   - **Ayrshare:** update or delete the scheduled post through its API. `api/publish.js` gains `op: 'update' | 'cancel'` with the stored Ayrshare id.
   - **Webhooks:** send `muse.update` and `muse.cancel` events carrying the same `postId`. The recipes handle them.
   - **The UI is honest about what happened:** "Change sent to Ayrshare", or "Your automation got an update event; check it handled it."
4. **Each post stores results per route:** `routeResults: [{ route, status, providerId, error, at }]`. Retry re-sends only the failed ones, so nothing double-posts.
5. **First comment, format and per-platform captions:**
   - These go to Ayrshare as its own fields. To verify against Ayrshare's docs before building; their site is blocked from this sandbox.
   - They go to webhooks as `variants`, `format` and `firstComment` in the JSON.
   - The payload version goes up to `muse.post` v2. v1 fields stay, so existing automations keep working.
6. **Time zones:**
   - Slots are computed in the influencer's time zone and sent as UTC ISO times.
   - Daylight-saving changes are handled by `Intl` and covered by unit tests.
7. **Performance:**
   - The queue is computed in memory from posts plus schedules: 7 days of slots per influencer, so no network calls.
   - The batch skill runs sequentially with progress (or 2 at a time), and can be cancelled.

## H. Phases (each is its own PR, tested and previewed on Vercel)

| Phase | Ships | Why first |
|---|---|---|
| **1. Queue foundation** | Fix the `0` bug · posting schedule (C) · influencer-first "Posting as" · "Add to queue / next free slot" · Queue view with tabs and empty slots · per-route results and Retry | Removes the biggest double work and the failure trap |
| **2. Per-platform and sync** | Per-platform captions and limits · format and first comment · reschedule and cancel sync to Ayrshare and webhooks · webhook payload v2 plus recipes for Zapier, Make and n8n | Makes scheduled posts trustworthy after edits |
| **3. Batch** | Schedule a batch (F) from Content, Studio and Media · Home nudge ("Kayla: 4 of 10 this week") | Turns a Studio session into a week of posts |
| Later | Analytics (Ayrshare) · best times from real data · comment inbox · link in bio | Need real accounts and data |

## I. Test plan (each phase)

- **Unit:** slot calculation (time zones, DST, full days, past slots), per-platform limits, migration of existing posts (no `routeResults` yet), payload v1/v2 shape.
- **Playwright on the preview build, at 1280px and 390px:** every flow above, `/api/publish` mocked per route, retry only re-sending failed routes, cancel and update calls.
- **Links:**
  - every "Connect" or "Set schedule" link opens an existing page (`/settings?section=connections&c=…`, the influencer profile);
  - no dead routes;
  - deep links like `/content?compose=1&slot=…` survive a reload.
- **Brand:** tokens only, light mode, no new sidebar items, Figtree, existing `.muse-*` components. Compared side by side with these mockups.
- **Real-account check (needs you):** one Ayrshare post and one webhook route end to end before each phase is called done.

## Decisions needed

1. Approve the phases in this order, or change the scope?
2. Should the posting schedule be **per influencer** (proposed), or per influencer **per workspace**? Clients sharing one influencer would need per-workspace.
3. Should "Needs approval" **block** scheduling (approve first), or stay optional as it is today?
4. Default caption skill for batches: **Short-form content writer**?
