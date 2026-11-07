---
name: "talking-head-reel-editing"
description: "Talking-head Instagram Reels editing in Remotion. Always analyzes the video and its script first, then asks the user one batch of questions (the script, a B-roll shot list tied to lines, a Drive folder, logos, CTA) before building, and keeps every on-screen word true to what is spoken. Two styles: Style A Clean (Golos/Playfair headline, typewriter reveals, one-word captions, 3-5s zoom cuts) and Style B Editorial Pop, a toolkit of grouped captions, gold serif punch words, condensed caps, lime pills, word cards, B-roll cutaways, grids, split screens and 2D motion graphics (arrows, strike-throughs, counters, whips, logo and versus cards, waveforms, CTA cards), structured to fit each script. Captions: drop/rail/embed (rare big word behind the subject), always an overlay. Uses a reference edit as a style framework, never a template. Use for \"edit a reel\", \"edit this like my reference\", \"add captions\", \"add b-roll\", \"add motion graphics\". Not for multi-speaker or non-9:16 videos."
---

# Talking-Head Reel Editing

The full set of rules, design and editing, for assembling a talking-head
reel in the brand style. Basis: the brand reference in Figma (text
placement, fonts, gradient) + speech-editing rules (captions, timing).
This skill has two edit styles (see Section 0): Style A "Clean"
(Sections 1-7) and Style B "Editorial Pop" (Sections 8-10, with B-roll and
motion graphics). For Style A, follow every section without deviation,
this is not a rough guideline, it is an agreed brand standard, with one
explicit exception:
**verify every position value against the actual footage before you
render** (see "Position QA" in Section 3), the pixel values below are a
typical-case default, not a guarantee for every shot.

Style in short: headline and accent theses, no forced caps (write the
text exactly as it should look on screen); the white part is Golos Text
Medium; the accent line/tail is Playfair Display Regular, color
`colors.accent` (`#F9FF80`), **color only, no underline, no background
plate**; captions are Inter Medium in normal case with a soft shadow; the
gradient is light, behind the headline, at the top. The headline and accent
theses appear as "typewriter" reveals (text unrolls character by character,
fast and punchy), see Sections 3 and 5. Speech pauses are **not**
auto-trimmed, the clip plays through as-is (see Section 5).

**Accent styling history:** the very first version of this design used a
pink background plate (`#FF85E0`) behind the accent word, in Inter Bold
caps. That was replaced with color + underline (Playfair/Lora, no plate).
Then, after live client feedback, **the underline was removed too**, the
accent is now carried by color alone. If you find `accentPlate` /
`plateStartIndex` / `textDecoration: "underline"` anywhere in older copies
of this template, those are stale, the current accent treatment is
color-only, no plate, no underline.

---

## 0. Workflow: analyze, ask, then build (always in this order)

Never start building on the first message. Every reel goes through these
steps, in order. The edit has to be about THIS video's script, not a copy
of a past edit or a reference.

### Step 1: analyze the video and the script

* Probe the source (`ffprobe`: size, fps, duration), check for letterbox
  bars (Section 5), and transcribe it with word-level timestamps
  (Section 6, Step 1; Vosk fallback in Section 10).
* Contact-sheet the source (one frame every 2s) and look at it: framing,
  where the face sits, how much headroom there is, and where the vertical
  center (y 960) lands on the subject (captions go there, Section 0.2),
  any baked-in camera moves.
* Read the transcript as a script, not as a word list. Write down:
  - the topic and the one idea the piece is built on;
  - the structure: hook, setup, list, contrast or myth-bust, story beat,
    steps, proof, payoff, CTA (whichever are actually there);
  - the emotional beats and the strongest lines (the hook, the payoff, any
    number or named thing);
  - every concrete noun or claim a viewer could SEE (a product, a tool, a
    place, an action, a result), because those are the B-roll and
    graphics opportunities;
  - whether a CTA is spoken, and its exact words;
  - transcript words you are unsure of, with timestamps.

### Step 2: draft the beat map (internal, then shared in Step 3)

Map each beat of the script to an edit device that fits what that beat is
doing (see "Device fit" in Section 8). Mark which beats need material from
the user (a specific B-roll shot, a logo, a screen recording) and which can
be built from the face plus text and graphics alone.

### Step 3: ask the user, in ONE batch, before building

Send a short breakdown of what you understood (topic, structure, the beats
you plan to emphasize) and ask for exactly what this video needs:

1. **The script.** Ask for the written script if one exists, so on-screen
   words can be checked against it (Section 0.1). List any transcript
   words you could not resolve, with their timestamps.
2. **B-roll, as a specific shot list tied to lines.** Never a generic "send
   me B-roll". For each beat that needs a visual, give the timestamp, the
   line, and the shot that would fit, e.g. "0:15 'you can sell digital
   products': a screen of a product page, or hands on a laptop checkout".
   Offer the ways to deliver it: attach the clips, share a Google Drive
   folder (Section 8.5), or connect a folder on their computer.
3. **Logos, screen recordings, fonts or audio** only if the beat map
   actually uses them.
4. **The CTA and comment keyword** if the CTA is not spoken. Never write
   one into the edit on your own.
5. **The style**: Style A Clean or Style B Editorial Pop (or "match this
   reference"), unless it is already clear from the conversation.
6. **The embed** (Section 0.2): name the word you would composite behind
   the subject, with its timestamp. In Style A, ask whether they want it
   at all; in Style B, confirm the word.

Ask tightly: one message, numbered, only what changes the edit. If the user
says "just go" or is not around, build with what exists, leave the
missing-material beats on the face with text and graphics, and list
exactly what was left out and why.

### Step 4: build, then QA

Build the EDL from the beat map and the user's answers, run Position QA
(Section 3) on stills, render, and probe the output. Check every word on
screen against the script one last time (Section 0.1).

### Picking the style

* **Style A: Clean** (Sections 1-7 below). The minimal brand look: Golos
  Text headline + Playfair accent line, typewriter reveals, one-word
  captions, 3-5s zoom cuts. Calm, editorial, face on screen the whole time.
* **Style B: Editorial Pop** (Section 8). A fast, high-energy creator edit
  built from a toolkit: grouped captions, punch words, condensed caps,
  pills, word cards, fast zoom cuts, B-roll layouts and motion graphics.

How to decide:
* The user names a style, or says "like my last one" → use that.
* The user hands over a **reference edit** → run the reference breakdown
  in Section 9 and use it as a style framework for Style B. Never copy its
  structure (see Section 9).
* The user supplies B-roll, logos, or asks for motion graphics → Style B.
* Nothing to go on → include the style question in the Step 3 batch.

Rules that hold in BOTH styles: the voice track is never muted or
re-timed, pauses are not trimmed unless asked, Position QA (Section 3) runs
before every full render, the composition fps matches the source fps, and
nothing is invented (no made-up CTA, stats, quotes or B-roll).

### 0.1 Words on screen must match the script

* Every caption, punch word, condensed hit, pill, word card and CTA card
  shows words that are actually SPOKEN in the clip, in the order spoken,
  at the moment they are spoken. No paraphrasing, no summarizing, no
  "punchier" rewrites, no added words.
* Check the transcript against the user's written script when they have
  one. Use the script to fix spelling, names, brand names and mishears.
  Where the audio and the script genuinely differ (the speaker ad-libbed or
  skipped a line), the AUDIO wins, because captions must match what the
  viewer hears; tell the user which lines differed.
* Labels that are not spoken (a tool name on a logo card, a tag on a
  prompt card) must come from the user's own material or be approved by
  them first.
* If a word can't be resolved from the audio or the script, ask. Never
  guess and never drop it silently.
* The one allowed omission is filler (see 0.2, "drop"): um, uh, stutters,
  and the abandoned half of a self-correction stay in the audio but are
  not shown on screen. Everything else is verbatim.

### 0.2 Captions doctrine: drop / rail / embed, and captions are an overlay

Applies to BOTH styles. Two rules that work together: every spoken phrase
gets exactly one of three treatments (the caption model), and every
caption is a layer composited ON TOP of the footage, never a zone carved
out of the layout (the overlay law).

**The caption model.** Tag every phrase in the EDL as one of:

| Tag | What | How it's shown |
|---|---|---|
| **drop** | filler: um, uh, stutters, the abandoned start of a self-correction | not shown on screen; the audio is untouched (pauses and filler are still never trimmed from the video, Section 5) |
| **rail** | the default, ordinary spoken content, verbatim | the normal caption device, in front and readable: `WordCaptions` in Style A, `CaptionGroup` in Style B |
| **embed** | a promoted peak, the headline beat of a section | ONE big word composited BEHIND the subject (person matte occludes part of it), with a designed entrance and exit (Appendix C) |

* **Rail-first.** The rail carries most of the text. Embedding a lot of
  words is the common mistake; the embed only works because it is rare.
* **Embed is scarce and spaced.** At most 1 embed per beat or sentence,
  never two adjacent or on screen together, at least a beat apart, and at
  most one "apex" (the single biggest moment) per reel. A 30-45s reel
  usually gets ONE embed; a long explainer gets about one per section.
  "Peak" means the peak of a beat, not only the single payoff of the
  whole clip.
* **One device per word still holds.** An embedded word is removed from
  the rail, exactly like headline and thesis words are removed from the
  caption stream. The rail keeps running for the words around it; rail
  (in front) and embed (behind) can be on screen together.
* **Embeds count as big devices.** Never co-visible with the headline, a
  thesis, a two-tone punch or a condensed hit, and they respect the same
  1-second minimum gap (`hasMinAccentGap`).
* **Embeds are spoken words only** (Section 0.1), revealed on the word's
  real timestamp.
* **Inline emphasis stays on the rail.** A punch word that doesn't earn an
  embed can get an inline highlight inside the rail: in Style B, gold
  (`#FFE14D`) or lime on that one word in the `CaptionGroup`. In Style A
  the rail stays plain white per the brand standard; Style A emphasis is
  carried by theses.
* **When to use embeds.** Style B: use them where a genuine peak exists,
  by the scarcity rules above. Style A: only if the user says yes in the
  Step 3 question batch, because it adds a device to an agreed brand
  standard. If the matte doesn't hold up on the check still (hair edges
  crawling, word unreadable), drop the embed and use the style's normal
  big device for that beat instead.
* **Cinematic mode** (no rail, every caption embed-style) is only for an
  explicit pure-cinematic ask. Never for talking-head or explainer edits,
  where the words must read.

**The overlay law.** Captions are an overlay, not a reserved band:

* Never shift a composition up, or leave a dead strip at the bottom, to
  "make room" for captions. Full-screen devices (B-roll cutaways, grids,
  split screens, word cards, structure cards, logo, versus, prompt and CTA
  cards) center on the TRUE vertical center, y = 960 on the 1080×1920
  canvas, and may run all the way to the bottom edge. A layout centered
  around y ≈ 800 with an empty lower band is the bug, not the fix.
* Imagery under Instagram's interface is fine (it's just picture), but
  TEXT is not: see the safe zone below.
* Legibility of captions over content is judged on rendered check stills
  (Position QA, Section 3).

**Caption placement: center of the frame, never on a face.** Instagram
covers the bottom of a Reel with the profile name, the caption and the
audio line, and the right edge with the like, comment and share buttons.
Captions placed low get hidden. So, in BOTH styles:

* **Captions sit in the vertical CENTER of the frame by default,** the
  caption block centered on y 960 (Style A one-word line: top ≈ 930;
  Style B caption group: top ≈ 900). Never in the lower third, never at
  the bottom. The old lower-third defaults (1292 in Style A, 1420 in
  Style B) are retired.
* **Never on a face.** No caption, punch word, pill or label may cover the
  eyes, nose, mouth or chin of anyone in frame, including people in
  B-roll. If the center lands on a face, move the caption DOWN to the
  first clear spot below the chin (neck, chest, table or background are
  all fine), staying inside the safe zone. If there is no clear spot below
  the chin above the safe-zone limit (an extreme close-up), put it above
  the hairline instead. Face first, then center: when the two conflict,
  the face wins and the caption stays as close to center as it can.
* **Instagram safe zone for ALL on-screen text** (captions, theses,
  punches, condensed hits, pills, labels, counters, CTA words): keep every
  text block inside x 120-960 (120px margin each side, so it stays
  centered and clear of the button column), below y 220 (top bar) and
  ABOVE y 1450 (the bottom of the text block, not its top). Nothing
  readable goes below 1450, ever.

---

## Resources bundled with this skill

Don't write Remotion components from scratch, `assets/remotion-template/`
already has render-tested files (design tokens, fonts, every component, a
worked composition example). Copy them into the project's `src/` and plug
in your data. Details and file list: `assets/remotion-template/README.md`.
Style B components are in Appendix A of this file.

To prepare data, use the bundled script:
- `scripts/transcribe.py`, word-level-timestamped transcription
  (faster-whisper). Outputs a raw word list; you then hand-pick the
  headline/theses out of it per Section 5.

**Always transcribe with `--lang` unset or matched to the actual spoken
language, never assume the footage is in the operator's own language.**
Forcing the wrong language code produces fluent-sounding but wrong text
(faster-whisper will happily phonetically transliterate English speech into
Cyrillic garbage, for example, without ever flagging an error). If the
detected-language confidence is low, or the output reads like nonsense,
re-run with `--lang` unset (auto-detect) or try the language the speaker is
actually using before doing anything else with the transcript.

(This skill has no automatic pause/silence trimming, there is
intentionally no `detect_silence.py` script here, see Section 5.)

An example final `captions.json` (the `Caption` shape from
`@remotion/captions`) is in `references/captions-example.json`.

---

## 1. Format

* Canvas: 1080 × 1920 px (9:16), 30 fps by default, **but match the
  composition's fps to the source clip's actual fps** (see the "fps"
  callout in Section 6, Step 3). A 25fps source rendered at 30fps needs
  every frame-based constant in this document (typewriter timing, the
  8-second headline hold, the 1-second minimum accent gap, zoom-cut
  segment length) re-derived from *seconds*, not copied as literal frame
  counts.
* Source footage: talking head, vertical, uncropped at the frame edges. If
  the source is already 1080×1920 *and fills the frame edge-to-edge*, use
  it as-is. **If the source has baked-in letterboxing (black bars top and
  bottom, common with AI-generated video tools that render at a narrower
  native aspect and pad to 9:16), you must detect and remove that padding
  before treating the clip as full-bleed 9:16**, see "Full-bleed source
  fix" in Section 5. The frame itself is not static, though: the default
  edit applies zoom-cut segments (see Section 5, "Zoom-cut editing"), that
  is a digital zoom/crop change over time, not a re-crop of the frame
  edges, and it is independent from the one-time letterbox fix above.
* The clip's original voice track is never muted, captions run on top of
  the real audio, they do not replace it.

## 2. Fonts

* Headline and theses, WHITE (non-accent) part, Golos Text Medium (500).
  Subheading, Golos Text SemiBold (600).
* Accent line/tail (headline and theses), **Playfair Display Regular
  (400)**, color `#F9FF80`, **no underline, no background plate**. (Earlier
  versions of this template used Lora Regular for the accent line, Lora
  is still bundled and works fine if a client prefers it, but Playfair
  Display is the current default: a client explicitly preferred its higher
  stroke contrast over Lora's. Swap `titleStyle.accent.fontFamily` /
  `thesisStyle.accent.fontFamily` back to `"Lora"` if asked.)
* Caps are never forced by CSS on the headline, theses, or captions, the
  on-screen case equals whatever case the author typed. CAPTIONS, Inter
  Medium (500), normal case, unchanged.
* All weights (Golos Text 500/600, Lora 400, Playfair Display 400, Inter
  500, plus PT Serif Italic 700 and Oswald 700 for the process cards, see
  Section 3, "Process cards") are embedded in `fonts.css` as base64.
* On the Figma source file: text layers are labeled "Golos Text" and
  "Lora"/"Playfair Display" directly (both families fully support
  Cyrillic, available via Google Fonts/@fontsource), no substitution
  needed, render as-is. (Historical note: the very first version of this
  design had text labeled "LINE Seed JP Bold" with no Cyrillic coverage,
  paired with a pink accent plate instead of an accent-colored line, that
  is an obsolete version, see "Technical gotchas.")
* Brand Figma file:
  https://www.figma.com/design/RZ99zjkCGFcUuCD1WlesdC/NEW-DESIGN, do not
  change parameters without revisiting this reference first.

## 3. Typography by zone (values from Figma, 1:1 against the 1080×1920 canvas)

### Headline (opening hook)

Block width up to 780px, **NO MORE THAN 3 LINES** (hard limit, if the text
doesn't fit in 3 lines, shorten the wording, don't raise the limit), always
centered. Hyphenated words (e.g. "close-up", "front-facing") never break
across lines at the hyphen, the whole hyphenated unit stays on one line
(see "Technical gotchas").

1. Main line (`main`), Golos Text Medium, 98px, 100% line-height, -5%
   tracking (-4.9px), white (`#FFFFFF`), case not forced. May wrap to
   several lines, normal line-wrap.
2. Accent line (`accent`), a separate line UNDER `main`, no
   background/plate: Playfair Display Regular 98px, -5% tracking, color
   `#F9FF80`, **no underline**. This is the brand accent, always fill it
   in. Usually short (1-2 words). The gap between the `main` line and the
   `accent` line is a negative marginTop (~-19px, the lines sit tight,
   almost like a single paragraph with compressed leading, see
   `titleStyle.accentGap`). IMPORTANT: reveal is "typewriter" (see Section
   5): `main` types out character-by-character from the start of the
   Sequence, and `accent` starts typing IMMEDIATELY once `main` finishes,
   one continuous typing act, no pause between the lines.
3. Subheading (`subheading`, optional, only if there's copy for it),
   Golos Text SemiBold, 30px, 95% line-height, +5% tracking (+1.5px),
   white, with a soft shadow (`text-shadow: 0px 4px 4px rgba(0,0,0,0.25)`).
   Sits ABOVE the headline (a small "eyebrow" line before the hook): block
   top at 375px. Simple fade (not typewriter, it isn't part of the main →
   accent relay). EXCEPTION to the general "case is never forced" rule:
   the subheading is the ONE place in the design where case is forced by
   CSS (`text-transform: uppercase`), write it in the data in whatever
   case, on screen it always renders UPPERCASE.

Top of the headline block (`main`), 444px from the top of the frame. See
"Position QA" below: **444px is the Figma reference value for typical
headroom above the subject's head, verify it against the actual footage,
it is not guaranteed to clear the face on every shot.** If `main` is longer
than the block width it wraps to a new line (text stays centered); the
headline overall must not exceed 3 lines, if it does, shorten the wording
until it fits.

### Position QA (do this before every render, not just once)

Fixed pixel positions in this document (headline `top: 444`, subheading
`top: 375`) come from one reference shot in Figma; the caption default is
now the vertical center (`top` ≈ 930, Section 0.2).
Real source footage varies: a tight medium close-up can leave almost no
headroom above the subject's hairline, or the subject can sit low enough
in frame that the caption zone lands on their chest/collar instead of a
neutral background.

Process, every time:
1. Render one still frame during the headline's display window
   (`npx remotion still <Composition> out/check_title.png --frame=<N>`)
   and one during a normal caption window.
2. Look at where the text actually lands relative to the subject's eyes,
   nose, mouth, chin, and shoulders, not just whether it's "on screen."
   Text overlapping the face (especially the eyes) is not acceptable even
   if the darkening gradient is technically covering that area.
3. If the headline/thesis block (`titleStyle.top`, which `thesisStyle.top`
   mirrors) overlaps the face, move it down past the chin, for a tightly
   framed shot this can mean values well beyond the 444px default (a real
   case needed ~880px). There is usually not enough headroom to move it
   *up* instead, most talking-head footage has very little air above the
   hairline.
4. Captions go in the CENTER of the frame (`subtitleStyle.top` ≈ 930,
   block centered on y 960), never on a face and never below y 1450
   (Instagram's bottom UI hides it), see "Caption placement" in Section
   0.2. If the center lands on the face, move the caption down to the
   first clear spot below the chin; landing on the chest or a table is
   fine. Never move it into the lower third to "find a cleaner area."
5. Keep at least ~150px of vertical clearance between the bottom of the
   headline/thesis block and the top of the caption, because the headline
   is visually on screen for its full hold duration (see "Headline hook"
   in Section 5) while captions for the *next* words are already running
   underneath it, the two must never physically collide. If they would,
   first shorten the headline to fewer lines; if the headline had to move
   below the chin, place the caption just below the headline, still with
   its bottom above y 1450.
6. Re-render the two check stills after any position change and confirm
   visually before doing the full render, don't reason about pixel
   offsets blind.

This QA step is the single most common thing that goes wrong on
first-pass renders of new footage, do not skip it because "the numbers
worked on the reference shot."

### Captions (one word at a time)

* Inter Medium (500), 60px, normal case (no forced caps), 95%
  line-height, -5% tracking, white, no plate/background.
* Block top ≈ 930px from the top of the frame, so the word sits in the
  vertical CENTER (y 960) **by default, verify against the actual footage,
  see "Position QA" above.** Never on a face, never below y 1450
  (Section 0.2, "Caption placement"). The bundled `design-tokens.ts` still
  ships `subtitleStyle.top: 1292` (the old lower-third default): override
  it to the center value in every project.
* Centered horizontally, caption font size never changes.
* One word at a time, never more. A hyphenated word (e.g. "close-up") is
  ONE caption word, not two: transcription sometimes splits such words
  into two fragments ("close" + "-up"), merge them back into a single
  caption entry during data prep, before assembling the composition (see
  "Technical gotchas").
* Captions carry a 40%-opacity black shadow, 12px blur
  (`text-shadow: 0 0 12px rgba(0,0,0,0.4)`) so they read over any frame.

### Accent theses / key-point callouts

* Size 98px, case not forced, Golos Text Medium (white part), same
  treatment as the headline.
* The phrase displays as one block but reveals animated: words fly in one
  at a time, each one AT THE MOMENT IT IS ACTUALLY SPOKEN in the voice
  track (from word-level transcript timestamps), NOT at a fixed uniform
  interval: the reveal pace must match the real pace of speech. Each
  word's reveal is "typewriter" (the word's characters unroll fast, see
  Section 5), not a spring/pop-in. After that, the phrase holds static
  until its display window ends, then normal captions resume.
* The tail of the phrase (usually the last word or two, the "punchline")
  gets the accent treatment on its OWN LINE below the white part: same
  style as the headline accent, Playfair Display Regular 98px, color
  `#F9FF80`, **no underline, no background**. Leading words are white
  (Golos Text Medium), revealed one at a time at real speech pace. In the
  component this is `accentStartIndex` (the index the accent line starts
  from). The gap between the white part and the accent line is the same
  negative marginTop as the headline (~-19px). Every accent word types out
  with the same mechanic (typewriter, from its own `startFrame`) as the
  white words, there is no separate "pop" mechanic for the accent
  anymore (an older version of this design had a pink plate here that
  popped in separately, that's removed).
* If the white (or accent) part wraps to multiple lines, the gap between
  lines is controlled by `lineHeight` (line-wrap), the SAME as the
  headline, NOT flexbox `gap`/`rowGap` (see Section 7).
* Appears in the same position as the headline (top 444px by default,
  see "Position QA", `thesisStyle.top === titleStyle.top`), same width
  range (≤780px).
* No more than 3 theses (max phrase length 4-5 words) in a short (30-40s)
  reel, otherwise the device loses its punch.

### Animated brand mark (optional, on request only)

Not a stock element, add it ONLY when the client explicitly asks to
underline a specific moment with the brand mark. `ClaudeLogo.tsx` in the
template: an abstract 8-point spark in `#D97757`, appears with a spring
(scale 0→1) and a rotation (-40°→0°), placed in the same `Sequence` as the
phrase/thesis it sits above; takes `top`/`size` as props
(`top = textTop - 18 - size`).

## 4. Darkening gradient over the video

* Linear, black. Anchored to the TOP of the frame (behind the headline).
  (In the Figma file the layer was flipped to the bottom, that's wrong,
  the gradient belongs at the top.)
* Anchored to the top edge, layer height 720px (top ~37% of the frame).
  Direction top-to-bottom: darkest at the top edge, fading to transparent
  going down.
* Stops (position from the TOP → opacity): 0%→100%, 38.5%→85%, 49.5%→77.5%,
  60.6%→70%, 76.9%→40%, 85.7%→22.5%, 93.9%→5%, 98.4%→0%.
* Overall layer opacity, 0.3 (light, doesn't cover the face).
* Purpose: the headline text at the top reads over a darkened background;
  captions in the center sit on un-darkened video and hold up on their own
  shadow.

## 5. Editing logic (how you decide what shows and when)

### Headline hook

* The headline = the opening line/idea of the reel, placed over the video
  for the exact span those words are actually spoken, the headline isn't
  a "bonus overlay," it replaces normal captions for the first 1.5-4
  seconds of the hook phrase.
* Important rule: words that went into the headline must never repeat as
  normal captions, they should not be in `captions.json` at all (excluded
  during data prep, Section 6).
* The headline stays VISIBLE on screen for 8 seconds (240 frames at 30fps,
  recompute in frames for the composition's actual fps, see the fps
  callout in Section 1/6), longer than the hook phrase itself takes to
  say. Captions for the words right after the hook phrase start on their
  real timestamps WHILE the headline is still visible, that's expected
  and correct (the headline sits at the top, captions in the center below
  it, with the clearance from Position QA rule 5).
  `TITLE_DURATION_IN_FRAMES = 240` in `TalkingHeadReel.tsx` (recompute for
  actual fps).
* If there's no obvious "hook" in the speech, carefully assemble one from
  the opening words, the core idea, and the value proposition.
* Before starting the edit, agree the wording of the main line, the accent
  line, and the subheading with the client.

### Gap between accents (headline and theses)

* Displays of major accents (headline, each thesis) must NEVER overlap
  each other and must never sit back-to-back. Between the end of one
  accent's display and the start of the next there must be a gap of at
  least 1 second (30 frames at 30fps, recompute for the composition's
  actual fps).
* This applies to the "headline → first thesis" pair and to any "thesis N
  → thesis N+1" pair. Check the gap when building the EDL (Section 6, Step
  2), before assembling the composition, if a thesis's real speech
  position lands less than a second after the previous accent ends, shift
  its display or shorten the previous one, but never let them overlap or
  touch.
* The template has a ready-made check,
  `hasMinAccentGap(prevEndFrame, nextStartFrame)` in `design-tokens.ts`
  (with a usage example in `TalkingHeadReel.example.tsx`). If your
  composition's fps differs from 30, recompute `MIN_ACCENT_GAP_FRAMES` for
  that fps (1 second's worth of frames) rather than reusing the constant
  literally.

### Headline and thesis reveal: "typewriter"

* The headline (main → accent) and EVERY word of an accent thesis reveal
  not as a spring/pop-in but as characters unrolling, like a typewriter,
  but fast and punchy (not a slow character-by-character crawl with
  pauses), see `typewriter.ts`. Characters unroll at a fixed rate
  (`TYPEWRITER_CHARS_PER_SECOND`), with a blinking cursor at the write
  point.
* In the headline, `main` starts typing from the start of the display
  (Sequence), and `accent` starts typing IMMEDIATELY once `main` finishes
  typing, no pause, as if one phrase continues onto a second line.
* In a thesis, EVERY word (white and accent alike) types independently,
  starting at its own `startFrame`, the real moment that word is spoken
  (see "Picking 'high-value' words" below), so the typewriter mechanic and
  real-speech-pace sync both work at once without conflicting.
* This rule applies ONLY to the headline and theses. Captions
  (`WordCaptions`) reveal is unchanged, see the next subsection.

### Word-by-word captions

* These captions are the "rail" (Section 0.2). Filler tagged "drop" is
  left out of the caption stream; the audio is untouched.
* Every word displays exactly on its speech timestamp, not earlier, not
  later (from word-level transcription data).
* A short micro-fade/pop-in between words is fine (scale 0.85→1, opacity
  0→1 over 3-4 frames) so a word doesn't "jump" harshly. Captions do NOT
  type out via the typewriter effect, that's only for the headline and
  theses (see above).
* No plates/backgrounds/borders around captions, clean white text only.

### Picking "high-value" words for a big accent callout

Criteria for flagging a phrase as an accent thesis (large-style display in
the headline position instead of normal captions):

* Specific important facts/numbers/conclusions.
* Meaningful takeaways, short insights (up to 5 words long).
* A "punchline" word at the end of a thought, it goes into the accent
  line (`accentStartIndex`).
* Rule of thumb, no more than 1 accent thesis per 8-15 seconds of speech,
  or the device loses its contrast against normal captions.

### Source footage plays through as-is (pauses are NOT trimmed)

* Automatic trimming of pauses/silence and filler words ("um," "uh") is
  NOT performed. The reel is cut from the source footage as-is, without
  trimming the speech.
* Don't hunt for pauses and cut them on your own initiative. Cuts/trims
  are made ONLY if the client explicitly asks to remove a specific chunk
  (with a specific timecode), that's a one-off edit for that particular
  reel, not an automatic step.
* Reel runtime = the full length of the source video (minus only chunks
  the client explicitly asked to remove). It must stay under 2 minutes; if
  the source is longer, don't cut it yourself, check with the client on
  what can be trimmed without losing meaning.

### Zoom-cut editing (segment length is tunable: confirm with the client)

This is a SEPARATE thing from the previous point: pauses in speech are
never trimmed (the content is untouched), but the frame within the reel is
not static, by default, EVERY reel gets a crop/zoom treatment:

* The reel is divided into segments of random length.
* Segments alternate: one segment is a smooth zoom-in (source scale glides
  from 100% to 115% evenly across that segment's whole length); the next
  segment contrasts with the previous one, it goes static (no animation
  inside it) and sits at either 100% (wide shot) or 130% ("medium shot"),
  but NEVER at the value the previous segment ended on, contrast between
  adjacent segments is mandatory.
* **Default segment length is 3-5 seconds** (`ZOOM_CUT_MIN_SECONDS` /
  `ZOOM_CUT_MAX_SECONDS` in `design-tokens.ts`), but this is a pacing
  choice, not a fixed law: some clients find 3-5s changes too busy/frequent
  and prefer a calmer edit. A real client request landed on **20-28
  second** segments for a ~55-second reel, about 2 crop changes for the
  whole reel instead of a dozen. Ask, or default to 3-5s and offer to slow
  it down if the first render feels too jumpy.
* Technically this is not a montage of different takes/frames, the source
  video plays back CONTINUOUSLY start to finish as a single stream; only
  the digital zoom/crop over it changes, imitating a multi-angle edit
  (wide/medium shots) plus slow camera pushes in some segments.
* Implementation, `SourceVideoZoomCuts.tsx` and `buildZoomCutPlan()` (see
  `assets/remotion-template/README.md`).
* Purpose: instead of one static frame for the whole reel, you get the
  illusion of a multi-crop edit (wide/medium) plus slow push-ins on
  specific segments, this holds viewer attention.
* Segment durations and order are deterministic (not truly random on every
  render, see "Technical gotchas"), so re-rendering the same reel gives the
  same result.

### Structure cards ("Step 1 / Step 2" style full-screen interstitials)

A distinct visual device from the headline/thesis style above, used when
a client wants a beat to visually mark a sequence of steps/actions inside
the narration (e.g. "here's how I did it: first... then... finally..."),
on request only, with a client-approved style reference. This is NOT part
of the default reel template, build it only when asked, using the
reference the client provides for exact look (typical reference style:
italic serif for the leading words, the accent word inside a solid-color
plate box, bold italic condensed sans inside the plate, a genuinely
different treatment from the headline/thesis "color + no plate" rule
above, and that's fine, it's a separate device with its own reference).

Component: `ProcessCard.tsx` in the template, a full-screen solid-color
`AbsoluteFill` (e.g. black background/white text on one card, white
background/black text on the next, alternating), a row of words centered
on screen, with an optional trailing word rendered inside a colored plate
(background box + contrasting text, padding, no border-radius unless the
reference shows one). Words appear one at a time, either a fixed stagger
(`STAGGER_FRAMES`, default look, no speech to sync to) or, when the card's
text should land on a specific spoken phrase (e.g. "the fun part" landing
on those exact spoken words), each word's `startFrame` set explicitly from
the real transcript timestamps, same principle as thesis-word timing
above.

**Critical mechanic, overlay, don't cut:** the correct implementation
plays the source video and its audio CONTINUOUSLY underneath the cards,
the subject keeps talking, the voice track never pauses, the card is
simply an opaque `Sequence` painted on top for a couple of seconds and
then it's gone, revealing the face again mid-sentence with normal captions
resuming right where the audio actually is. Do **not** split the source
video into two trimmed segments with a real time gap inserted between them
to "make room" for the cards, that approach (cutting the clip, holding on
a silent card, then resuming the second half with every downstream
timestamp shifted by the inserted duration) is unnecessarily complex,
requires re-deriving every thesis/caption timestamp after the cut point,
and was tried and explicitly reverted on a real project once the client
clarified they wanted the voice to keep going under the card, not pause.
If a client's very first phrasing sounds like they want a hard pause,
confirm before building the complex version, "does she keep talking under
the card, or does the video pause?" is worth asking once rather than
re-deriving the whole EDL when the answer turns out to be "keep talking."

Placement: pick natural-sounding beats in the phrase structure (the pause
right before an enumeration typically works well: "here's how I did it. //
[card] // first, I ..."), start the card at or slightly before the pause,
hold for roughly 1-1.5 seconds, and let it disappear partway through the
sentence so the face and normal captions resume for the rest of that
clause. There's no fixed duration rule for these cards; keep them short
and let the audio, not a stopwatch, decide when to cut back to the face.

### Floating secondary-video card ("proof" insert near the subject)

Also on request only, with a source clip supplied by the client (e.g. a
screen recording of a website/app/tool the subject is talking about).
Component: `FloatingVideoCard.tsx`, a rounded-corner (`borderRadius`),
drop-shadowed `<Video muted>` positioned as a floating card over the main
footage, NOT replacing it. Position it near the subject ("behind their
head" is the typical brief) without covering their face, in practice this
usually means the upper portion of the frame, offset to whichever side has
headroom (check the actual footage; a tightly-framed subject often leaves
almost no room directly above their head, so the card may need to sit
upper-left or upper-right rather than dead-center-top). Mute the inserted
clip's own audio track, the subject's voice is the only audio that
matters. Always render a check still and look at where the card actually
lands relative to the subject's eyes before finalizing size/position, the
same "Position QA" discipline as Section 3 applies here.

### Full-bleed source fix (when the source has baked-in letterboxing)

Some source clips, especially from AI video-generation tools, are
delivered at the target 1080×1920 container size but with black bars
baked into the pixels top and bottom, because the actual generated content
is a narrower aspect padded to fill the container. Using such a clip
as-is inside a "9:16 reel" produces a reel with visible black bars, which
defeats the point of matching Instagram Reels' native format.

Detect it:
```bash
ffmpeg -i source.mp4 -vf "cropdetect=24:2:0" -f null - 2>&1 \
  | grep -o "crop=[0-9:]*" | sort | uniq -c | sort -rn | head -5
```
If the most common `crop=W:H:X:Y` result has `H` meaningfully smaller than
the container height (e.g. `crop=1080:1448:0:236` inside a 1080×1920
file), the source has ~236px of baked-in black bar top and bottom.

Fix it (crop out the bars, then scale-to-fill back to the target size,
center-cropping any resulting width overflow):
```bash
ffmpeg -y -i source.mp4 \
  -vf "crop=1080:1448:0:236,scale=-2:1920,crop=1080:1920" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a copy \
  source_full_bleed.mp4
```
Re-run the `cropdetect` check on the output, it should report
`crop=1080:1920:0:0` (i.e. no crop needed, the frame is already full).
Use this full-bleed file as the actual composition source instead of the
original. This is a one-time pre-processing step, separate from and
unrelated to the ongoing zoom-cut editing in the previous section.

## 6. Technical process for assembling in Remotion

### Step 1: source prep

* Transcribe the original audio track with word-level timestamps
  (faster-whisper, `small` model, `word_timestamps=True`), use
  `scripts/transcribe.py`. **Do not force a language code blind, verify
  the detected language and the transcript quality before trusting it**
  (see the callout at the top of this document under "Resources bundled
  with this skill"). If the model download is blocked, use the Vosk
  fallback in Section 10.
* Merge words the transcriber split across a hyphen into two fragments
  (e.g. "close" + "-up" → "close-up"): if the next word starts with "-",
  merge it into the previous entry as one record (`startMs` from the first
  fragment, `endMs` from the second). While you're at it, proofread the
  transcript for obvious misrecognitions of rare words/names/brand names
  and fix them by hand, a transcriber will confidently mis-hear a product
  name as two ordinary words; catch that before it ends up on screen.
* Do NOT trim pauses/silence or filler words (see Section 5). The reel
  plays through as-is; only remove a chunk of speech if the client
  explicitly asked for that specific cut.
* Compute the final runtime (the full length of the source video, minus
  only chunks explicitly requested by the client). If it's over 2 minutes,
  don't start the render, agree with the client on what to shorten
  first.

### Step 2: edit plan (EDL) before assembling the composition

* Headline hook: write it (NO MORE than 3 lines, width ≤780px, main line,
  accent line colored `#F9FF80`, no underline, optional subheading) and
  get it approved before you start assembling.
* Captions: mark up every word as `{text, startMs, endMs}`; exclude words
  that went into the headline from the caption stream.
* Tag every phrase drop / rail / embed (Section 0.2). Drop-tagged filler
  and embed words are excluded from the caption stream. Check each embed
  against the scarcity rules and the 1-second gap to every big device.
* Theses: pick no more than 3 accent phrases per reel, each up to 4-5
  words, split into words (`words: ThesisWord[]`) and choose the index the
  accent tail starts from (`accentStartIndex`, usually the last word). The
  phrase's display range (`fromFrame`/`durationInFrames`) follows the
  start and end of the whole phrase in speech; EVERY word gets its own
  `startFrame` (the reveal frame RELATIVE to the Sequence start) from its
  real speech timestamp. These words are excluded from the caption stream.
* Check the gap between accents: `TITLE_DURATION_IN_FRAMES` (headline end)
  → the first thesis's `fromFrame`, and between each thesis's
  `fromFrame + durationInFrames` → the next thesis's `fromFrame`, a
  minimum of 1 second's worth of frames everywhere (recompute for the
  composition's actual fps). Use `hasMinAccentGap()` from
  `design-tokens.ts`, don't eyeball it.
* If the source clip has baked-in letterboxing, run the full-bleed fix
  (Section 5) before this step, so all subsequent timestamps and position
  checks are against the actual final source file.

### Step 3: components and styles (values already account for the design)

* `fps`: **match the composition's fps to the source clip's real fps**
  (check with `ffprobe`). Every frame-based constant in this document
  (8-second headline hold, 1-second minimum accent gap, 3-5s zoom-cut
  segments, typewriter speed) is defined as a time duration first and a
  frame count second, recompute the frame count for whatever fps you're
  actually rendering at; don't copy the 30fps-derived numbers onto a
  25fps composition.
* `TitleCard`, NO MORE than 3 lines, width ≤780px, centered, case not
  forced, hyphenated words never break: `main` Golos Text Medium 98px /
  100% line-height / -5% tracking / white; `accent`, a separate line
  UNDER `main`, Playfair Display Regular 98px, color `#F9FF80`, no
  underline, no background; `main` types out via typewriter from the
  start of the display, `accent` starts typing immediately after `main`
  (no pause between lines); optional subheading Golos Text SemiBold 30px /
  +5% tracking ABOVE the headline (top 375px by default, verify per
  Position QA), simple fade, UPPERCASE (`text-transform: uppercase`, the
  one exception to "case is never forced"). Top of `main`, 444px by
  default (verify per Position QA), display duration 8 seconds (recompute
  frames for actual fps).
* `WordCaptions`, one word, Inter Medium (500), normal case (no forced
  caps), fixed 60px, 95% line-height, -5% tracking, shadow
  `0 0 12px rgba(0,0,0,0.4)`, hyphenated words never split. Block top
  ≈ 930px so it sits in the vertical center (override the template's 1292;
  verify per Position QA: never on a face, never below y 1450). Reveal, a simple pop-in
  (NOT typewriter).
* `ThesisCard`, 98px, case not forced, renders in the headline position
  (top 444px by default, same value as `titleStyle.top`), width ≤780px,
  its own Sequence. White-part words (`words: ThesisWord[]`, each with its
  own `startFrame`) reveal via typewriter one at a time on the real speech
  timeline; the phrase tail (`accentStartIndex`), Playfair Display
  Regular, color `#F9FF80`, no underline, each accent word revealed by the
  same typewriter mechanic (its own `startFrame`), no background/plate;
  wrapped lines use `lineHeight` (not flex `gap`). Check the gap to the
  previous accent is ≥ the minimum (`hasMinAccentGap`).
* `ProcessCard` (only if the client asked for structure cards, Section 5),
  full-screen solid background, centered word row, optional plate word,
  words appear one at a time (fixed stagger or explicit real-speech
  `startFrame`s), overlaid on top of the CONTINUOUS source video/audio,
  do not cut the video for this.
* `FloatingVideoCard` (only if the client supplied a secondary clip,
  Section 5), rounded, shadowed, muted `<Video>` positioned near (not
  over) the subject's face, checked against a rendered still before
  finalizing.
* `GradientOverlay`, linear black, anchored to the TOP of the frame,
  height 720px, layer opacity 0.3, darkest at the top edge.
* Source video, `SourceVideoZoomCuts` (not a static `<Video>`): one
  continuous stream of the source with a CSS scale layered over it per
  `buildZoomCutPlan()`, segments alternate zoom-in (100%→115%) and
  contrasting static crop (100% or 130%), see Section 5, "Zoom-cut
  editing." Default segment length 3-5s, confirm with the client, adjust
  `ZOOM_CUT_MIN_SECONDS`/`ZOOM_CUT_MAX_SECONDS` if they want a calmer edit.

The ready-made implementation of every component lives in
`assets/remotion-template/`. Copy and plug in data, don't rewrite the
logic from scratch.

### Step 4: final duration and render

* Compute the final duration programmatically (Mediabunny/ffprobe) from
  the length of the source video (minus only chunks the client explicitly
  asked to cut), don't hardcode it.
* Hard check before rendering: final duration ≤ 2 minutes. If not, don't
  start the render, go back to the client for a decision on what to
  shorten.
* Render: `npx remotion render <CompositionId> out/reel.mp4`. If the
  finished file is bigger than your delivery limit, re-compress via
  `ffmpeg -crf` (higher value), don't touch the project/pipeline itself
  for that.

## 7. Technical gotchas (for next time)

* If Google Fonts is unreachable in the render environment, don't burn
  time retrying, pull the font locally (the @fontsource npm packages,
  `@fontsource/golos-text`, `@fontsource/lora`, `@fontsource/playfair-display`,
  `@fontsource/inter`, `@fontsource/pt-serif`, `@fontsource/oswald`) and
  inline it as `@font-face` with a `data:` URI (base64) directly in the
  CSS. A ready-made `fonts.css` with this already done ships in
  `assets/remotion-template/`.
* CRITICAL: `fonts.css` needs TWO `@font-face` blocks per weight (Golos
  Text 500, Golos Text 600, Lora 400, Playfair Display 400, Inter 500, PT
  Serif Italic 700, Oswald 700) with identical `font-family`/`font-weight`/
  `font-style` but DIFFERENT `unicode-range`, one Cyrillic woff2, one
  Latin woff2. If you leave only the Cyrillic file with no
  `unicode-range`, Latin letters that land inside Cyrillic text (e.g. a
  brand name like "Claude" mid-sentence) silently fall back to a system
  font for just those characters, a visibly different typeface for one
  or two words mid-phrase. Rule: "letters must not change typeface
  depending on the word's language." `@fontsource` does NOT include
  `unicode-range` in its CSS files, pull the exact ranges straight from
  `fonts.googleapis.com/css2?family=...` (curl with a browser User-Agent)
  and attach them to the local woff2 files by hand.
* Case is NEVER forced by CSS anywhere EXCEPT the subheading (headline
  main/accent, theses, captions, the on-screen case equals whatever case
  the author typed in the data). EXCEPTION: `subheading` in `TitleCard`,
  the ONE place case is forced (`text-transform: uppercase`), that's
  been the brief from day one, unchanged. This is different from the very
  first version of this design, where ALL text (headline/theses/
  subheading) was force-capped, now only the subheading is capped.
* There is NO background plate anywhere in the design under the accent
  color (headline or thesis tail) anymore, the accent is expressed only
  by color (`#F9FF80`), no underline either, that was removed later on
  client feedback (see "Accent styling history" at the top of this
  document). If old code/a stale copy of the project still has
  `plateStyle`/`accentPlate`/`plateStartIndex` names, or a
  `textDecoration: "underline"` on the accent style, those are leftovers
  from earlier design iterations, replace with `colors.accent`/
  `accentStartIndex` and no text-decoration (the current template already
  ships this way).
* For the gradient: the background behind the layer must be fully
  transparent, only the gradient itself paints color. The layer is
  anchored to the top (`top: 0`), direction `linear-gradient(180deg, …)`
  (top to bottom), height 720px.
* A plain hyphen "-" in text is a default line-break point in Chromium
  (Remotion's render engine). Before rendering, replace "-" with a
  non-breaking hyphen U+2011 across all text going into
  `TitleCard`/`ThesisCard`/`WordCaptions`/`ProcessCard`, the
  `noBreakHyphens()` helper in `design-tokens.ts` does this (already
  applied inside the components).
* faster-whisper sometimes splits a hyphenated word into two fragments,
  merge them back into a single caption during data prep (see Section 6),
  otherwise they'll flash as two broken fragments in the captions.
* Floating/secondary video inserts (structure cards' plate content aside)
  are only ever added on explicit client request, with the client
  supplying the actual file; don't source your own b-roll from anywhere.
* For zoom-cut segments, the plan MUST be built via `random()` from the
  `remotion` package, NOT `Math.random()`/`Date.now()`: Remotion can
  render frames in parallel and out of order across multiple
  processes/tabs, and plain `Math.random()` would give a different result
  for the same frame on repeat calls, visible "jumps"/mismatches between
  render passes. `random(seed)` is a pure function of a string seed, so
  the segment plan stays stable across any re-render of the same reel.
* Video at zoom scale inevitably spills past the frame edges, wrap
  `<Video>` in a container with `overflow: hidden` (already done in
  `SourceVideoZoomCuts`), otherwise the zoomed-in segments get clipped
  incorrectly by the browser, or not clipped at all.
* When editing with zoom-cut segments, the source video renders as ONE
  continuous `<Video>` (don't recreate/restart it on every cut via
  separate Sequences with a fresh `<Video>` each time), only the CSS
  scale on top of it changes; recreating the video element on every cut
  causes an audio/video stutter or gap.
* CRITICAL (a real bug that made zoom/springs invisible on render): the
  CSS `scale` property in a style object MUST be passed as a STRING
  (`` scale: `${value}` ``), NOT as a number (`scale: value`). React
  treats `scale` as an ordinary numeric CSS property (it isn't in the
  `isUnitlessNumber` list) and silently appends `px`, `scale: 1.3` renders
  in the DOM as `scale: 1.3px`, an invalid value for the CSS `scale`
  property (it takes a unitless number or `%`), the browser ignores it and
  the element stays unscaled, with zero console errors. This exact bug
  broke both the zoom cuts in `SourceVideoZoomCuts.tsx` and the "spring"
  scale on the headline/theses/plate/captions (only the opacity fade was
  visible, the bounce wasn't). Every component in the template already
  uses `` scale: `${scale}` ``, if you add your own animated scale, copy
  this pattern (or use `transform: scale(${value})`, as in
  `ClaudeLogo.tsx`, that's a string by construction and has no bug).
* Short prepositions/conjunctions/particles can't be left as the last word
  of a wrapped line, this is a general typography rule. English function
  words (a/an/the/of/to/in/on/and/or) benefit from it, and it matters even
  more for some other languages' short function words if this template is
  adapted for a non-English reel. In `TitleCard`
  (main/accent/subheading) and the white part of `ThesisCard` this is
  handled by a non-breaking space via `glueShortWords()`/
  `isShortGlueWord()` from `design-tokens.ts`, already applied inside the
  components. Separate case: if the thesis tail goes into the accent line
  (`accentStartIndex`) and the word right BEFORE the boundary is such a
  short glue word, `ThesisCard` itself pulls it into the accent line
  (shifts `accentStartIndex` one word earlier), otherwise that word would
  be "orphaned" as the last word of the white line right before a separate
  accent block, and a non-breaking space can't fix that (it's a different
  DOM block). You don't need to pre-adjust `accentStartIndex` for this
  when writing a thesis.
* The typewriter mechanic (`typewriter.ts`) reacts to the LENGTH of the
  string in characters, compute `typewriterDurationInFrames()` from the
  ALREADY-transformed text (after `glueShortWords`/`noBreakHyphens`), not
  the raw text. The "-" → U+2011 and " " → U+00A0 substitutions don't
  change the character count, so the `text.slice(0, n)` reveal stays
  consistent, if you add your own text transform, make sure it also
  doesn't change the string length (or compute the typing duration AFTER
  that transform).
* CRITICAL (a real bug, a client reported "weird gaps" between words on
  the accent line): the typewriter cursor ("▏") cannot be mounted in the
  DOM unconditionally and just hidden via `opacity: cursorOn ? 1 : 0`,
  `opacity: 0` does NOT remove the character from layout flow, it still
  physically takes up width. If the cursor renders always, once a
  word/line finishes typing the invisible cursor character is left
  PERMANENTLY at the end and reads as an extra space, especially visible
  on the underlined... (historical: the accent line no longer has an
  underline, but the same bug would still visually widen the trailing gap
  after a word even without one). Correct approach: mount the cursor
  `<span>` in the DOM ONLY while the line/word is actively typing, use
  `typewriterCursorActive(frame, startFrame, totalDurationInFrames)` from
  `typewriter.ts` as the render condition (`cursorActive ? <span>…</span> :
  null`), not just as a check inside an already-mounted span.
  `TitleCard.tsx` and `ThesisCard.tsx` already do this in the template,
  if you write your own typewriter component, copy this pattern.

---

## Style A pre-delivery checklist

- [ ] Video and script analyzed first and one batch of questions sent
      before building (Section 0); headline and theses use spoken words
      only, checked against the user's script (Section 0.1).
- [ ] Headline agreed with the client (main / accent / subheading
      confirmed); accent uses `colors.accent` (`#F9FF80`, Playfair
      Display Regular), NO underline, NO background plate.
- [ ] Headline and theses, Golos Text Medium (500), accent, Playfair
      Display Regular (400), subheading, Golos Text SemiBold (600),
      captions, Inter Medium (500) with shadow. CASE is never forced by
      CSS anywhere EXCEPT the subheading, it always renders UPPERCASE
      (`text-transform: uppercase`); main/accent/theses/captions render in
      whatever case the data has.
- [ ] Headline stays visible for 8 seconds (recompute frames for the
      composition's actual fps); captions for the following words already
      run in parallel underneath it.
- [ ] Headline and thesis words are never duplicated in the caption
      stream.
- [ ] Headline and every accent callout, width ≤780px, headline NO MORE
      than 3 lines.
- [ ] Reveal of the headline and the accent tail of a thesis is
      "typewriter" (character by character, fast and punchy, see
      `typewriter.ts`), not fade/pop-in; in the headline, `main` and
      `accent` type as one continuous act (`accent` starts the instant
      `main` finishes).
- [ ] No "phantom" trailing spaces after words/lines on the accent line or
      the white part, the typewriter cursor is mounted in the DOM only
      while that line/word is actively typing
      (`typewriterCursorActive`), never mounted with `opacity: 0` at rest
      (a real past bug, see "Technical gotchas"). Check this visually on
      the finished render, not just in code.
- [ ] There's at least a 1-second gap (recompute frames for actual fps)
      between the headline and the first thesis, and between adjacent
      theses, they never overlap or sit back-to-back
      (`hasMinAccentGap`).
- [ ] Hyphenated words are never broken/split anywhere (`noBreakHyphens`;
      confirm the transcript didn't split them into two fragments
      either).
- [ ] No more than 3 theses, each ≤ 4-5 words; every one's tail is
      accent-colored (`accentStartIndex`), no plate; white-part words
      appear on their real speech timestamps, each word types out
      character by character; the gap between wrapped lines is
      `lineHeight` (not flex `gap`).
- [ ] Latin text inside otherwise-Cyrillic (or vice versa) copy doesn't
      change typeface, `fonts.css` has a separate `@font-face` per weight
      with the matching `unicode-range` for each script actually used in
      this project.
- [ ] Pauses/filler words are NOT trimmed, the reel plays through as-is
      (only cut what the client explicitly asked to cut).
- [ ] The video is edited with zoom-cut segments (alternating zoom-in
      100%→115% and contrasting static crop 100%/130%), not one static
      shot for the whole reel; the plan is built via `random()` from
      remotion, not `Math.random()`. Segment length matches what the
      client asked for (default 3-5s, confirm if they want it calmer).
      Structure cards and floating secondary-video inserts only exist if
      the client explicitly asked for them; source files for inserts come
      only from the client.
- [ ] Structure cards (if used) overlay the CONTINUOUS video/audio, the
      voice track never pauses or gets a silent gap inserted for them.
- [ ] The animated brand mark (`ClaudeLogo`) and text over a secondary
      video insert, only if the client explicitly asked for them.
- [ ] If the source clip had baked-in letterboxing, the full-bleed fix was
      applied before editing, the final reel fills 1080×1920 edge to
      edge, no black bars.
- [ ] Text positions (headline top, caption top) were verified against
      the actual footage per "Position QA", not just copied from the
      Figma defaults, using rendered check stills, and don't overlap the
      subject's face.
- [ ] Gradient darkens the TOP of the frame behind the headline
      (top-anchored layer, opacity 0.3, height 720px).
- [ ] Final runtime ≤ 2 minutes (or a shorter cut was explicitly agreed).
- [ ] Fonts are embedded locally (base64), not via Google Fonts at render
      time.
- [ ] Captions and headline/thesis words were proofread by ear against the
      source video one more time (names, misheard words), don't trust
      the raw transcript blind.
- [ ] Composition fps matches the source clip's real fps, and every
      frame-based constant in this document was recomputed for that fps
      rather than copied literally from the 30fps defaults.
- [ ] Every phrase tagged drop / rail / embed; filler dropped from the
      captions only (audio untouched); rail stays plain white.
- [ ] Embed used only if the client said yes; at most one per beat, never
      co-visible with the headline or a thesis, 1-second gap respected,
      readable on the check still with the subject in front of it.
- [ ] Captions treated as an overlay: no layout lifted or shrunk to make
      room for them.
- [ ] Captions sit in the vertical CENTER (around y 960), never on anyone's
      face, never in the lower third; every text block inside x 120-960,
      below y 220 and with its bottom above y 1450 (Instagram's UI),
      checked on stills.

---

## 8. Style B: Editorial Pop

**A toolkit, not a template.** Style B is a vocabulary of looks (type,
color, devices, motion). The STRUCTURE of each edit comes from that
video's script: which beats get a big device, where B-roll goes, which
graphics appear, how fast it cuts. Two Style B reels on different topics
should look like the same brand and be built completely differently. The
example words in this section ("not growing", "THREE WEEKS", "coaching")
come from one past reel; they show what a device is for, never what to
put on screen.

Everything here is built from the components in Appendix A
(`Motion.tsx`). Copy that file into `src/`, plus the Style B fonts
(Section 8.1). The source talking head still runs through a zoom-cut
layer (Appendix B), with faster segments.

### 8.1 Fonts (Style B)

* Sans: **Inter 700 / 800** (captions, leads, pills, word cards).
* Punch serif: **Playfair Display 800** (gold punch words).
* Condensed caps: **Anton 400** (big all-caps hits).
* Install from npm (`@fontsource/inter`, `@fontsource/playfair-display`,
  `@fontsource/anton`) and inline the latin woff2 files as base64
  `@font-face` blocks in `src/fonts.css` (same reason as Section 7: no
  Google Fonts at render time). Script:
  ```python
  import base64
  F=[("Inter",700,"inter-latin-700-normal"),("Inter",800,"inter-latin-800-normal"),
     ("Playfair Display",800,"playfair-display-latin-800-normal"),("Anton",400,"anton-latin-400-normal")]
  css=""
  for fam,w,f in F:
      pkg={"Inter":"inter","Playfair Display":"playfair-display","Anton":"anton"}[fam]
      b=base64.b64encode(open(f"node_modules/@fontsource/{pkg}/files/{f}.woff2","rb").read()).decode()
      css+=f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,{b}) format('woff2');}}\n"
  open("src/fonts.css","w").write(css)
  ```
  If the user knows the real fonts from their editor, use those instead.

### 8.2 Colors (tokens in `POP`)

lime `#D8FF3C` (pills, tool-name caps), gold `#FFE14D` (serif punch, CTA
glow), green `#1F4A3A` (word cards), paper `#F3F0EA` (explainer cards),
red `#E5322D` (arrows, circles, strike-throughs). Swap all of these when a
reference edit uses different colors.

### 8.3 Text devices (what shows when)

Every spoken word (minus drop-tagged filler, Section 0.2) appears in
exactly ONE device at a time. Never show a caption and a big device for
the same words. The caption group is the rail; the embed (device 6) is
the scarce peak.

1. **Caption group** (`CaptionGroup`): the default. Phrases of 2-4 words
   on screen together, Inter 700 80px white with shadow. Upcoming words sit
   at 32% opacity and light up on their timestamp. Break groups at natural
   breath points, never mid-phrase.
2. **Two-tone punch** (`TwoTone`): white sans lead line + gold Playfair
   800 punch line with glow. For the payoff word of a thought ("not
   growing", "money online", "work"). The punch line pops in as ONE unit on
   its first word's timestamp (see gotcha 8.9-a).
3. **Condensed hit** (`CondensedHit`): small sans lead + huge Anton caps
   line (190px). For power words and tool names ("CONTENT", "THREE WEEKS").
   Tool or product names can go lime. Usually placed in the upper part of
   the frame (top around y 260, below Instagram's top bar) for variety
   against the centered devices, as long as it clears the face.
4. **Pill** (`Pill`): lime rounded pill, black Inter 700. For list items
   and labels, especially over B-roll ("coaching", "brand deals").
5. **Word card** (`WordCard`): full-screen white with green text, or green
   with white text, words appearing as spoken. A pattern interrupt, 1-2s
   max. It is an OVERLAY: the talking head keeps playing and talking under
   it (same rule as Structure cards in Section 5).
6. **Embed** (`EmbedWord`, Appendix C): one huge word composited BEHIND
   the subject using a person matte, so the head and shoulders cover part
   of it. Anton caps (white or lime) or gold Playfair 800. For the peak of
   a beat only, at most one per beat, usually one per short reel (Section
   0.2). The rail keeps running in front of it.

**Device fit.** Choose devices by what the beat is doing in the script:

| Script beat | Devices that fit |
|---|---|
| Hook / opening claim | Two-tone punch or condensed hit on the key phrase, or an embed on the single key word; a strong first visual |
| The peak of a beat (one word carries it) | Embed behind the subject (scarce, Section 0.2) |
| Challenging a belief, myth-bust | `StrikeThrough` on the wrong belief, `Shake` on the correction |
| A list of options or items | One pill per item, one B-roll cutaway per item if supplied, `PillBurst` or `BRollGrid` to sum up, `Counter` if the count is spoken |
| A number, result or stat (spoken) | `Counter`, condensed hit |
| Steps / a process | Structure cards (Section 5) or numbered pills |
| A tool, product or platform | `LogoCard` (with the user's logo file), framed screen recording, condensed hit in lime |
| Comparing two things | `VersusCard`, `SplitScreen` |
| Showing a prompt, template or text | `PromptCard` |
| Personal story, "I've been there" | Full-screen B-roll cutaway, minimal text |
| Pattern interrupt mid-reel | `WordCard`, `Flash`, `WhipIn` |
| Payoff / takeaway | Two-tone punch, hold on the face |
| Spoken CTA | `CtaCard` with the spoken words |

If a beat has nothing visual to show and no supplied material, keep it on
the face with captions. An honest plain beat beats a forced graphic.

Pacing guide for a 30-45s reel: 2-4 two-tone punches, 1-3 condensed hits,
pills only where there is a list or a label, 1-3 word cards. Leave plain
caption stretches between big devices so the big ones still land.

Default positions (verify with Position QA every time): captions top
≈ 900 (the group centered on y 960), two-tone top ≈ 860 (it takes the
caption's place, so it sits in the center too), pills top ≈ 920 over the
face shot or anywhere inside the safe zone over B-roll, condensed hits top
≈ 260, embeds vertically centered on the head and shoulders (usually
around y 700-1000, horizontally centered on x 540). Every text device
follows Section 0.2 "Caption placement": centered, never on a face, inside
x 120-960, below y 220, bottom above y 1450. If the center lands on the
face, move the device down below the chin, within those limits. The
bottom gradient (black 0 → 50% over the bottom 900px) is optional now that
captions sit in the center; keep it only if it helps text that sits
lower. Full-screen layouts still center on y 960 and run to the bottom
edge (overlay law, Section 0.2).

### 8.4 Zoom cuts (Style B)

Same alternating zoom/static logic as Section 5, but faster and gentler:
segments 1.6-2.8s, zoom 100% → 108%, static levels 100% / 112%,
`transformOrigin: "50% 35%"` so the eyes stay in frame. If the source
already has a camera push-in baked in (common with AI video), keep these
values low; 130% crops on an already-tight close-up look broken. Code in
Appendix B.

### 8.5 B-roll

Only ever use clips the user supplied (or generated at their request).
Never source B-roll from anywhere else.

Getting the clips:
* **Ask with a shot list** tied to timestamps and lines (Section 0,
  Step 3), so the user knows exactly what to send or film.
* **Attached files** land in the uploads folder; use them directly.
* **Google Drive folder:** if the user shares a Drive folder or file link,
  use the Google Drive connector to list it (`search_files` with the
  folder, `get_file_metadata` for size and type) and match file names and
  descriptions to the shot list. `download_file_content` returns the file
  as base64 text, which works for small clips but not for large videos;
  for anything over a few MB, ask the user to attach those specific files
  or connect the folder on their computer instead. Direct downloads of
  Drive links from the shell may be blocked by network policy; don't try
  to work around a block.
* **A folder on the user's computer:** when the device bridge is
  available, request access to that folder and stage only the clips the
  edit uses.
* After receiving clips, contact-sheet them and confirm the matches before
  building if any clip is a judgment call.

Workflow:
1. Contact-sheet every clip (`ffmpeg -vf "fps=1,scale=270:-1,tile=6x3"`)
   and look at it. Note what each clip shows and its best 1-3 seconds.
2. Match clips to lines by meaning: list items get one clip each, an
   abstract claim gets the most literal visual available, "I've been there"
   style lines get a personal, lived-in shot.
3. Pre-trim every used span into a proxy file (gotcha 8.9-e). This is
   mandatory, not an optimization.
4. Write the B-roll plan into the EDL as `{fromMs, toMs, layout, clips,
   text}` before building. Show it to the user if anything is a judgment
   call.

Rules:
* B-roll is always `muted`. The talking-head audio keeps running
  underneath. Never cut or pause the voice track to fit B-roll.
* Cutaways run 1-3s. Return to the face between B-roll runs; the face
  should still carry roughly 40-60% of runtime unless the user wants a
  B-roll-led edit.
* Text continues over B-roll (pills, condensed hits, two-tone punches),
  using the same timing rules.
* Horizontal clips get cropped to fill with `objectFit: "cover"`. Tell the
  user if the crop loses the subject.

Layouts (Appendix A):
* `BRollCut`: full-screen cutaway with a slow 6% push-in.
* `BRollGrid`: 2x3 (or any cols) grid, tiles spring in one by one. Good
  for "a thousand options", portfolios, a wall of past results.
* `SplitScreen`: two clips stacked, halves slide in from opposite sides,
  optional pill on the seam.
* `FramedClip`: clip in a rounded card on a paper background with an
  optional label and a hand-drawn arrow ("like the one you're watching").

Every layout fills the full frame and centers on true center (y 960).
Don't shrink or lift a grid, split or card to keep it clear of the
captions; the captions ride on top (Section 0.2). Labels and pills on a
layout follow the same safe zone (inside x 120-960, bottom above y 1450),
don't collide with the centered caption, and never sit on a face in the
B-roll.

### 8.6 Motion graphics

All 2D, frame-driven, in Appendix A. Use them where they make a point
clearer, not as decoration. One or two per 10 seconds is plenty.

* `DrawPath` / `DrawCircle` / `StrikeThrough`: hand-drawn red strokes that
  draw on (arrows to a thing, circling a word, striking a wrong belief).
* `Counter`: a number ticking up (counts of items, follower or revenue
  figures the user actually gave you).
* `Shake`: decaying jitter on emphasis. `WhipIn`: content slides in fast
  with motion blur. `Flash`: white flash at a hard cut. `Punch`: quick
  scale spike on a beat.
* `PillBurst`: a stack of pills flying in from both sides (summing up a
  list).
* `LogoCard`: a logo popping in over floating 2D blobs. Needs the logo
  file from the user. True 3D is out of scope; the blobs are the stand-in.
* `VersusCard`: logo or word vs logo or word.
* `PromptCard`: heading + a paper text box that types in (prompts, steps,
  quotes from the user's own material).
* `Waveform`: bars driven by the real voice (see gotcha 8.9-c).
* `CtaCard`: black end card, lead line, glowing gold keyword, tail line.
  ONLY when the CTA is actually spoken in the clip. If it isn't, ask the
  user for the CTA instead of writing one.

### 8.7 What needs material from the user

Ask in one batch, before building: B-roll clips, logo files, the real
fonts if known, any music or sound effect files, the CTA and comment
keyword if the clip doesn't say it. Never fill a gap with invented
material.

### 8.8 Limits to state plainly

True 3D, particle systems, liquid morphs and character animation are out
of scope; offer the nearest 2D version. Claude can't watch playback, only
check rendered stills, so the user judges timing feel; expect one round of
notes.

### 8.9 Style B technical gotchas (real bugs hit while building it)

* **a. Hidden words still take up space.** A word at `opacity: 0` keeps
  its width, so a two-word punch line where the second word hasn't
  appeared yet renders off-center. Punch lines (`TwoTone` punch) therefore
  appear as one unit. Caption groups use 32% ghosting, so the shift reads
  as intentional.
* **b. Use `OffthreadVideo` for B-roll tiles, not `@remotion/media`
  `Video`.** The media `Video` ignored `objectFit: "cover"` inside grid
  and split tiles (letterboxed tiles with white/black bars).
  `OffthreadVideo` honors it. The main talking-head layer can stay on
  `Video`.
* **c. Waveform audio must be WAV.** `useAudioData()` on an .mp4 failed
  with "Unable to decode audio data". Extract first:
  `ffmpeg -i source.mp4 -vn -ac 1 -ar 44100 public/voice.wav` and pass
  `staticFile("voice.wav")`. Pass `sourceOffsetFrames` = the Sequence's
  start frame so bars follow the voice at that moment.
* **d. `Easing.quart` does not exist in Remotion.** Use
  `Easing.poly(4)`. A missing easing throws "easing is not a function" and
  kills the render.
* **e. ALWAYS pre-trim B-roll into short proxies before building.** A
  six-tile grid pointing at long, long-GOP source files stalled the render
  completely (stuck at one frame for minutes). After trimming each clip to
  just its used span, scaled to tile size, with a short keyframe interval,
  the same 60 grid frames rendered in about 30 seconds:
  `ffmpeg -ss A -t D -i clip.mp4 -an -vf scale=540:-2 -c:v libx264 -preset veryfast -crf 20 -g 6 -pix_fmt yuv420p public/broll/name.mp4`
  (use `scale=1080:-2` for full-screen cutaways). Then reference them with
  `startSec: 0`.
* **f. Render settings.** Keep `--concurrency` at or below `nproc`
  (Remotion refuses higher), pass `--timeout=180000` for B-roll-heavy
  renders, and run renders longer than a few minutes in the background,
  polling the log. Never `pkill -f remotion` from the same shell command
  line that mentions remotion; it kills its own shell.

---

## 9. Matching a reference edit

When the user shares an edit they want copied:

1. Probe it: `ffprobe` (size, fps, duration).
2. Cut rhythm: `ffmpeg -i ref.mp4 -vf "select='gt(scene,0.25)',showinfo"
   -f null -` and read the `pts_time` values. Report cuts per second.
3. Look at it: one frame per second as contact sheets
   (`fps=1,scale=270:480,drawtext=...timestamp...,tile=6x3`), plus a few
   full-size frames on text moments to read fonts, colors and placement.
4. Write a breakdown for the user: every text style (font class, size,
   color, case, position, how it enters), every visual type (face, B-roll,
   grid, split, cards, logos), cut pace, and what you need from them to
   match it. Mark what will be approximate (fonts guessed from frames, 3D,
   audio you can't hear).
5. Map each reference device to the nearest Style B component and retune
   tokens (colors, fonts, sizes, positions, segment length) to match.
6. Confirm the breakdown before building if anything is ambiguous.
7. **Use the reference as a framework, not a blueprint.** Take its look:
   fonts, colors, type treatments, cut pace, energy, the kinds of devices
   it uses. Do NOT copy its sequence of beats, its device order, or any of
   its on-screen words. Then build the structure from the new video's own
   script with the beat map (Section 0, Step 2), choosing devices with the
   "Device fit" table (Section 8.3).

---

## 10. Environment fallbacks

* **Transcription when model downloads are blocked.** `transcribe.py`
  needs faster-whisper weights from huggingface.co, and openai-whisper
  needs openaipublic.azureedge.net; either can be blocked by network
  policy. Fallback that installs only from npm + PyPI: the npm package
  `transcribe2texts` ships the Vosk small English model inside its
  tarball.
  ```bash
  npm pack transcribe2texts && tar xzf transcribe2texts-*.tgz
  pip install vosk --break-system-packages
  ffmpeg -i source.mp4 -ac 1 -ar 16000 -f s16le a.raw
  ```
  ```python
  from vosk import Model, KaldiRecognizer, SetLogLevel
  import json; SetLogLevel(-1)
  r = KaldiRecognizer(Model("package/vosk-model-small-en-us-0.15"), 16000); r.SetWords(True)
  d = open("a.raw","rb").read(); ws = []
  for i in range(0, len(d), 8000):
      if r.AcceptWaveform(d[i:i+8000]): ws += json.loads(r.Result()).get("result", [])
  ws += json.loads(r.FinalResult()).get("result", [])
  out = [{"text": w["word"], "startMs": int(w["start"]*1000), "endMs": int(w["end"]*1000)} for w in ws]
  json.dump(out, open("words_raw.json","w"), indent=1)
  ```
  Vosk output is lowercase with no punctuation and misses more words than
  Whisper. Proofread every caption, fix obvious mishears by meaning (e.g.
  "switching lines" → "switching lanes"), and list any line you could not
  resolve for the user to check instead of guessing.
* **Browser.** If Remotion can't download its headless shell, point it at
  an installed one: `--browser-executable=<path to headless_shell>`.
* **Source size.** AI clips can come in at odd sizes (e.g. 1076×1926).
  `objectFit: "cover"` on a 1080×1920 composition handles it; no
  pre-scaling needed.

---

## Appendix A: `Motion.tsx` (Style B toolkit, render-tested)

Copy into `src/Motion.tsx`. Requires `remotion`, `@remotion/media`,
`@remotion/media-utils`. All components read timing from word timestamps
(`W = { t, ms }`) relative to their Sequence start (`seqFromMs`/`fromMs`).

```tsx
// Editorial Pop toolkit: text styles, B-roll layouts, motion graphics.
// Everything is frame-driven (useCurrentFrame), so it renders deterministically.
import React from "react";
import {
  AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { Video, Audio } from "@remotion/media";
import { visualizeAudio, type AudioData } from "@remotion/media-utils";

// ---------- tokens ----------
export const POP = {
  lime: "#D8FF3C",      // pills, tool-name caps
  gold: "#FFE14D",      // serif punch word
  green: "#1F4A3A",     // word cards
  paper: "#F3F0EA",     // explainer card background
  red: "#E5322D",       // arrows, strike-throughs, circles
  ink: "#0B0B0B",
  sans: "Inter",        // 700 / 800
  serif: "Playfair Display", // 800
  condensed: "Anton",   // 400
};
export const textShadow = "0 4px 18px rgba(0,0,0,0.45), 0 0 2px rgba(0,0,0,0.35)";

export type W = { t: string; ms: number };
export const msToFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

// ---------- word primitive ----------
// One word that pops in at its spoken time. `ghost` = opacity before it is spoken (0 hides it).
// `seqFromMs` = the ms at which the parent Sequence starts.
export const Word: React.FC<{ w: W; seqFromMs: number; ghost?: number; style?: React.CSSProperties }> = ({ w, seqFromMs, ghost = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = msToFrame(w.ms, fps) - msToFrame(seqFromMs, fps);
  const p = interpolate(frame, [local, local + 4], [0, 1], { ...clamp, easing: ease });
  return (
    <span style={{ display: "inline-block", opacity: ghost + (1 - ghost) * p, scale: `${0.88 + 0.12 * p}`, transformOrigin: "50% 80%", ...style }}>
      {w.t}
    </span>
  );
};
const Words: React.FC<{ words: W[]; seqFromMs: number; ghost?: number; sameTime?: boolean }> = ({ words, seqFromMs, ghost = 0, sameTime }) => (
  <>
    {words.map((w, i) => (
      <React.Fragment key={i}>
        <Word w={sameTime ? { ...w, ms: words[0].ms } : w} seqFromMs={seqFromMs} ghost={ghost} />
        {i < words.length - 1 ? " " : ""}
      </React.Fragment>
    ))}
  </>
);

// ---------- 1. caption group (upcoming words ghosted) ----------
export const CaptionGroup: React.FC<{ fromMs: number; words: W[]; top: number }> = ({ fromMs, words, top }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top, left: 90, right: 90, textAlign: "center", fontFamily: POP.sans, fontWeight: 700,
      fontSize: 80, letterSpacing: -2.5, color: "#fff", textShadow, lineHeight: 1.05 }}>
      <Words words={words} seqFromMs={fromMs} ghost={0.32} />
    </div>
  </AbsoluteFill>
);

// ---------- 2. two-tone: sans lead + gold serif punch (punch appears as one unit) ----------
export const TwoTone: React.FC<{ fromMs: number; lead: W[]; punch: W[]; top: number; punchColor?: string }> = ({ fromMs, lead, punch, top, punchColor = POP.gold }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top, left: 60, right: 60, textAlign: "center" }}>
      <div style={{ fontFamily: POP.sans, fontWeight: 700, fontSize: 70, letterSpacing: -2.5, color: "#fff", textShadow, lineHeight: 1 }}>
        <Words words={lead} seqFromMs={fromMs} ghost={0.32} />
      </div>
      <div style={{ marginTop: -4, fontFamily: POP.serif, fontWeight: 800, fontSize: 138, letterSpacing: -4, color: punchColor, lineHeight: 1.05,
        textShadow: "0 0 28px rgba(255,214,40,0.55), 0 6px 18px rgba(0,0,0,0.35)" }}>
        <Words words={punch} seqFromMs={fromMs} sameTime />
      </div>
    </div>
  </AbsoluteFill>
);

// ---------- 3. condensed caps hit ----------
export const CondensedHit: React.FC<{ fromMs: number; lead: W[]; big: W[]; top: number; bigColor?: string; bigSize?: number }> = ({ fromMs, lead, big, top, bigColor = "#fff", bigSize = 190 }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top, left: 50, right: 50, textAlign: "center" }}>
      <div style={{ fontFamily: POP.sans, fontWeight: 700, fontSize: 54, letterSpacing: -1.5, color: "#fff", textShadow, lineHeight: 1.05 }}>
        <Words words={lead} seqFromMs={fromMs} />
      </div>
      <div style={{ fontFamily: POP.condensed, fontSize: bigSize, color: bigColor, lineHeight: 1, letterSpacing: -1, marginTop: 4, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>
        <Words words={big} seqFromMs={fromMs} />
      </div>
    </div>
  </AbsoluteFill>
);

// ---------- 4. lime pill ----------
export const Pill: React.FC<{ text: string; top: number; delay?: number }> = ({ text, top, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ background: POP.lime, color: POP.ink, fontFamily: POP.sans, fontWeight: 700, fontSize: 60, letterSpacing: -1.5,
        padding: "20px 46px 24px", borderRadius: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.28)", scale: `${0.6 + 0.4 * s}`, opacity: Math.min(1, s * 1.6) }}>
        {text}
      </div>
    </div>
  );
};

// ---------- 5. full-screen word card (overlay; audio keeps playing) ----------
export const WordCard: React.FC<{ fromMs: number; words: W[]; dark?: boolean }> = ({ fromMs, words, dark }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: dark ? POP.green : "#fff", opacity: interpolate(frame, [0, 3], [0, 1], clamp), justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: POP.sans, fontWeight: 800, fontSize: 108, letterSpacing: -4, color: dark ? "#fff" : POP.green, textAlign: "center", lineHeight: 1.02, padding: "0 90px" }}>
        <Words words={words} seqFromMs={fromMs} ghost={0.18} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- B-ROLL ----------
// A B-roll clip is always MUTED: the talking-head audio track keeps running underneath.
export type Clip = { src: string; startSec?: number };

const ClipVideo: React.FC<{ clip: Clip; push?: number; style?: React.CSSProperties }> = ({ clip, push = 0.06, style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1, 1 + push], clamp);
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <div style={{ width: "100%", height: "100%", scale: `${scale}` }}>
        {/* OffthreadVideo (not @remotion/media Video): it honors objectFit "cover" inside grid/split tiles */}
        <OffthreadVideo src={staticFile(clip.src)} muted trimBefore={Math.round((clip.startSec ?? 0) * fps)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
};

// 6. full-screen cutaway
export const BRollCut: React.FC<{ clip: Clip }> = ({ clip }) => (
  <AbsoluteFill style={{ background: "#000" }}><ClipVideo clip={clip} /></AbsoluteFill>
);

// 7. grid of clips, tiles pop in one by one
export const BRollGrid: React.FC<{ clips: Clip[]; cols?: number; gap?: number; staggerFrames?: number; bg?: string }> = ({ clips, cols = 2, gap = 10, staggerFrames = 3, bg = "#fff" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = Math.ceil(clips.length / cols);
  return (
    <AbsoluteFill style={{ background: bg, padding: gap, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap }}>
      {clips.map((c, i) => {
        const s = spring({ frame: frame - i * staggerFrames, fps, config: { damping: 14, stiffness: 200 } });
        return (
          <div key={i} style={{ borderRadius: 14, overflow: "hidden", scale: `${0.7 + 0.3 * s}`, opacity: Math.min(1, s * 1.5) }}>
            <ClipVideo clip={c} push={0.04} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 8. split screen (two clips stacked), halves slide in from opposite sides; optional pill on the seam
export const SplitScreen: React.FC<{ top: Clip; bottom: Clip; seamPill?: string }> = ({ top, bottom, seamPill }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, 7], [-1080, 0], { ...clamp, easing: ease });
  const b = interpolate(frame, [0, 7], [1080, 0], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 958, translate: `${a}px 0px` }}><ClipVideo clip={top} /></div>
      <div style={{ position: "absolute", top: 962, left: 0, width: 1080, height: 958, translate: `${b}px 0px` }}><ClipVideo clip={bottom} /></div>
      {seamPill ? <Pill text={seamPill} top={918} delay={5} /> : null}
    </AbsoluteFill>
  );
};

// 9. clip framed in a rounded card on a light background (optional label + drawn arrow)
export const FramedClip: React.FC<{ clip: Clip; label?: string; labelBig?: string; arrow?: boolean; bg?: string }> = ({ clip, label, labelBig, arrow, bg = POP.paper }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ background: bg }}>
      {label || labelBig ? (
        <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", color: POP.ink }}>
          {label ? <div style={{ fontFamily: POP.sans, fontWeight: 700, fontSize: 52, letterSpacing: -1.5 }}>{label}</div> : null}
          {labelBig ? <div style={{ fontFamily: POP.condensed, fontSize: 130, lineHeight: 1 }}>{labelBig}</div> : null}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 290, top: 620, width: 500, height: 890, borderRadius: 36, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)", scale: `${0.8 + 0.2 * s}`, opacity: Math.min(1, s * 1.5) }}>
        <ClipVideo clip={clip} push={0.03} />
      </div>
      {arrow ? <DrawPath d="M 250 560 C 120 700, 110 980, 270 1140" startFrame={6} drawFrames={10} head /> : null}
    </AbsoluteFill>
  );
};

// ---------- MOTION GRAPHICS ----------
// 10. hand-drawn SVG path that draws itself on (arrows, circles, underlines, scribbles)
export const DrawPath: React.FC<{ d: string; startFrame?: number; drawFrames?: number; color?: string; width?: number; head?: boolean; viewBox?: string }> = ({
  d, startFrame = 0, drawFrames = 10, color = POP.red, width = 9, head, viewBox = "0 0 1080 1920" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + drawFrames], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <svg viewBox={viewBox} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <marker id="pop-arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - p} markerEnd={head && p > 0.98 ? "url(#pop-arrowhead)" : undefined} />
    </svg>
  );
};
// circle drawn around a rectangle region (x,y,w,h in canvas px)
export const DrawCircle: React.FC<{ x: number; y: number; w: number; h: number; startFrame?: number }> = ({ x, y, w, h, startFrame = 0 }) => {
  const cx = x + w / 2, cy = y + h / 2, rx = w / 2 + 30, ry = h / 2 + 24;
  const d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx + 8} ${cy + 14}`;
  return <DrawPath d={d} startFrame={startFrame} drawFrames={9} width={8} />;
};
// strike-through across a text line (x from left to right at height y)
export const StrikeThrough: React.FC<{ x1: number; x2: number; y: number; startFrame?: number }> = ({ x1, x2, y, startFrame = 0 }) => (
  <DrawPath d={`M ${x1} ${y + 8} L ${x2} ${y - 8}`} startFrame={startFrame} drawFrames={6} width={14} />
);

// 11. number counter ticking up (e.g. 0 -> 6, 0 -> 80K)
export const Counter: React.FC<{ from?: number; to: number; frames?: number; top: number; suffix?: string; prefix?: string; size?: number; color?: string; format?: (n: number) => string }> = ({
  from = 0, to, frames = 18, top, suffix = "", prefix = "", size = 220, color = "#fff", format }) => {
  const frame = useCurrentFrame();
  const n = interpolate(frame, [0, frames], [from, to], { ...clamp, easing: Easing.out(Easing.quad) });
  const v = format ? format(n) : Math.round(n).toLocaleString("en-US");
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontFamily: POP.condensed, fontSize: size, color, lineHeight: 1, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>
      {prefix}{v}{suffix}
    </div>
  );
};

// 12. transitions / emphasis. Wrap a layer's CONTENT in these.
// Shake: short decaying jitter starting at `at` (frames, relative to the Sequence)
export const Shake: React.FC<{ at?: number; frames?: number; amp?: number; children: React.ReactNode }> = ({ at = 0, frames = 8, amp = 14, children }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const on = t >= 0 && t < frames;
  const decay = on ? 1 - t / frames : 0;
  const x = on ? Math.sin(t * 2.7) * amp * decay : 0;
  const y = on ? Math.cos(t * 3.3) * amp * 0.6 * decay : 0;
  return <AbsoluteFill style={{ translate: `${x}px ${y}px` }}>{children}</AbsoluteFill>;
};
// Whip: content slides in fast from a side with motion blur
export const WhipIn: React.FC<{ from?: "left" | "right" | "up" | "down"; frames?: number; children: React.ReactNode }> = ({ from = "right", frames = 6, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, frames], [1, 0], { ...clamp, easing: Easing.out(Easing.poly(4)) });
  const dist = from === "left" || from === "up" ? -1 : 1;
  const horizontal = from === "left" || from === "right";
  const off = p * dist * (horizontal ? 1080 : 1920);
  const blur = p * 28;
  return <AbsoluteFill style={{ translate: horizontal ? `${off}px 0px` : `0px ${off}px`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>;
};
// Flash: white flash that fades out (put it as the top layer at a cut)
export const Flash: React.FC<{ frames?: number; color?: string }> = ({ frames = 4, color = "#fff" }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: color, opacity: interpolate(frame, [0, frames], [0.85, 0], clamp) }} />;
};
// Punch: quick scale spike on emphasis (wrap the source video layer)
export const Punch: React.FC<{ at?: number; frames?: number; amount?: number; children: React.ReactNode }> = ({ at = 0, frames = 8, amount = 0.08, children }) => {
  const frame = useCurrentFrame();
  const s = 1 + amount * interpolate(frame, [at, at + 2, at + frames], [0, 1, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  return <AbsoluteFill style={{ scale: `${s}` }}>{children}</AbsoluteFill>;
};

// 13. logo card: logo image pops in over soft floating 2D blobs (stand-in for 3D shapes)
export const LogoCard: React.FC<{ logo: string; width?: number; bg?: string; blobs?: string[]; caption?: string }> = ({ logo, width = 620, bg = "#fff", blobs = ["#7CF2C7", "#C59BFF", "#8AD8FF"], caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 11, stiffness: 180 } });
  const pos = [[-120, 220, 420], [760, 1300, 380], [700, -60, 300]];
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {blobs.map((c, i) => {
        const [x, y, r] = pos[i % pos.length];
        const dy = Math.sin((frame + i * 20) / 14) * 26;
        return <div key={i} style={{ position: "absolute", left: x, top: y + dy, width: r, height: r, borderRadius: "38% 62% 55% 45%",
          background: `radial-gradient(circle at 30% 30%, #ffffffcc, ${c} 55%, ${c}88)`, filter: "blur(2px)", rotate: `${frame * 0.8 + i * 60}deg`, opacity: 0.85 }} />;
      })}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <Img src={staticFile(logo)} style={{ width, scale: `${0.5 + 0.5 * s}`, opacity: Math.min(1, s * 1.5) }} />
        {caption ? <div style={{ marginTop: 30, fontFamily: POP.sans, fontWeight: 700, fontSize: 54, color: POP.ink }}>{caption}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 14. versus card: two logos (or two words) with "VS"
export const VersusCard: React.FC<{ left: { logo?: string; text?: string }; right: { logo?: string; text?: string }; bg?: string }> = ({ left, right, bg = POP.paper }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 12 } });
  const b = spring({ frame: frame - 6, fps, config: { damping: 12 } });
  const v = spring({ frame: frame - 3, fps, config: { damping: 9, stiffness: 260 } });
  const side = (x: { logo?: string; text?: string }, color: string) =>
    x.logo ? <Img src={staticFile(x.logo)} style={{ width: 520 }} /> :
      <div style={{ fontFamily: POP.condensed, fontSize: 170, color, lineHeight: 1 }}>{x.text}</div>;
  return (
    <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
      <div style={{ translate: `${(1 - a) * -700}px 0px` }}>{side(left, POP.ink)}</div>
      <div style={{ fontFamily: POP.condensed, fontSize: 230, color: POP.ink, scale: `${v}`, fontStyle: "italic" }}>VS</div>
      <div style={{ translate: `${(1 - b) * 700}px 0px` }}>{side(right, POP.lime)}</div>
    </AbsoluteFill>
  );
};

// 15. explainer card on paper: heading + body box (prompt text) that types in
export const PromptCard: React.FC<{ lead: string; big: string; tag: string; body: string }> = ({ lead, big, tag, body }) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(interpolate(frame, [4, 40], [0, body.length], clamp));
  return (
    <AbsoluteFill style={{ background: POP.paper, alignItems: "center", paddingTop: 300 }}>
      <div style={{ fontFamily: POP.sans, fontWeight: 700, fontSize: 56, color: POP.ink, letterSpacing: -1.5 }}>{lead}</div>
      <div style={{ fontFamily: POP.serif, fontWeight: 800, fontSize: 130, color: POP.ink, lineHeight: 1, marginTop: -6 }}>{big}</div>
      <div style={{ position: "relative", marginTop: 70, width: 760, minHeight: 640, border: "3px solid #CFC8BC", borderRadius: 22, padding: "60px 46px", background: "#FBFAF7" }}>
        <div style={{ position: "absolute", top: -34, left: 290, background: POP.green, color: "#fff", fontFamily: POP.sans, fontWeight: 700, fontSize: 44, padding: "4px 22px", borderRadius: 6 }}>{tag}</div>
        <div style={{ fontFamily: POP.sans, fontWeight: 500, fontSize: 38, lineHeight: 1.35, color: "#55504A" }}>{body.slice(0, chars)}</div>
      </div>
    </AbsoluteFill>
  );
};

// 16. waveform bars driven by the real voice track
// Usage: const audioData = useAudioData(staticFile("voice.wav")); (WAV, see gotcha 8.9-c) and pass it in.
export const Waveform: React.FC<{ audioData: AudioData | null; top: number; bars?: number; color?: string; height?: number; sourceOffsetFrames?: number }> = ({ audioData, top, bars = 48, color = POP.ink, height = 220, sourceOffsetFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!audioData) return null;
  const vals = visualizeAudio({ fps, frame: frame + sourceOffsetFrames, audioData, numberOfSamples: 64, smoothing: true });
  const half = Math.floor(bars / 2);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 7, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        // mirrored: low frequencies (loudest) in the middle, highs at the edges
        const k = Math.min(vals.length - 1, Math.abs(i - half));
        const h = Math.max(10, Math.min(height, Math.sqrt(vals[k]) * height * 4));
        return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: color }} />;
      })}
    </div>
  );
};

// 17. CTA end card: black, lead line, glowing gold word, tail line. Only use when the CTA is actually SPOKEN.
export const CtaCard: React.FC<{ fromMs: number; lead: W[]; glow: W[]; tail: W[] }> = ({ fromMs, lead, glow, tail }) => (
  <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontFamily: POP.sans, fontWeight: 700, fontSize: 70, color: "#fff", letterSpacing: -2 }}><Words words={lead} seqFromMs={fromMs} ghost={0.25} /></div>
    <div style={{ fontFamily: POP.sans, fontWeight: 800, fontSize: 130, color: POP.gold, letterSpacing: -4, lineHeight: 1.05,
      textShadow: "0 0 40px rgba(255,214,40,0.75), 0 0 12px rgba(255,214,40,0.6)" }}><Words words={glow} seqFromMs={fromMs} ghost={0.2} /></div>
    <div style={{ fontFamily: POP.sans, fontWeight: 700, fontSize: 64, color: "#fff", letterSpacing: -2 }}><Words words={tail} seqFromMs={fromMs} ghost={0.25} /></div>
  </AbsoluteFill>
);

// 18. pill burst: several pills fly in from the edges and settle in a stacked cluster
export const PillBurst: React.FC<{ items: string[]; top?: number; stagger?: number }> = ({ items, top = 520, stagger = 2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {items.map((t, i) => {
        const s = spring({ frame: frame - i * stagger, fps, config: { damping: 13, stiffness: 190 } });
        const fromX = (i % 2 === 0 ? -1 : 1) * 900;
        const row = top + i * 120;
        const tilt = (i % 2 === 0 ? -1 : 1) * (3 + (i % 3));
        return (
          <div key={i} style={{ position: "absolute", top: row, left: 0, right: 0, display: "flex", justifyContent: "center",
            translate: `${(1 - s) * fromX}px 0px`, rotate: `${tilt * s}deg` }}>
            <div style={{ background: POP.lime, color: POP.ink, fontFamily: POP.sans, fontWeight: 700, fontSize: 56, padding: "16px 42px 20px", borderRadius: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.28)" }}>{t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export { Video, Audio };
```

## Appendix B: Style B composition pattern

```tsx
// Reel.tsx: talking head + zoom cuts + gradients + timed Sequences.
const f = (ms: number) => Math.round((ms / 1000) * FPS);
export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Source plan={PLAN} src="source.mp4" />   {/* zoom cuts, below */}
    <Gradients />                              {/* top 720px + optional bottom 900px */}
    {/* B-roll first, so text devices render above it */}
    <Sequence from={f(15750)} durationInFrames={f(16790) - f(15750)}>
      <WhipIn from="right"><BRollCut clip={{ src: "broll/products.mp4", startSec: 0 }} /></WhipIn>
    </Sequence>
    {CAPTIONS.map((c, i) => <Sequence key={i} from={f(c.from)} durationInFrames={f(c.to) - f(c.from)}><CaptionGroup fromMs={c.from} words={c.words} top={900} /></Sequence>)}
    {/* TwoTone / CondensedHit / Pill / WordCard / motion graphics the same way */}
  </AbsoluteFill>
);
```
Style B zoom cuts and gradients (self-contained, same deterministic
`random()` rule as Section 7):
```tsx
type Seg = { start: number; end: number; zoom: boolean; a: number; b: number };
const buildPlan = (total: number, fps: number, minS = 1.6, maxS = 2.8, seed = "reel"): Seg[] => {
  const segs: Seg[] = []; let c = 0; let i = 0; let prev = 1;
  while (c < total) {
    const d = Math.min(Math.round(interpolate(random(`${seed}-d-${i}`), [0, 1], [minS * fps, maxS * fps])), total - c);
    const zoom = i % 2 === 0;
    let a = 1, b = 1.08;
    if (!zoom) { const lv = prev === 1.12 ? 1 : 1.12; a = lv; b = lv; }
    segs.push({ start: c, end: c + d, zoom, a, b }); prev = b; c += d; i++;
  }
  return segs;
};
const Source: React.FC<{ plan: Seg[]; src: string }> = ({ plan, src }) => {
  const frame = useCurrentFrame();
  const s = plan.find((x) => frame >= x.start && frame < x.end) ?? plan[plan.length - 1];
  const scale = interpolate(frame, [s.start, s.end], [s.a, s.b], { extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: s.zoom ? Easing.bezier(0.4, 0, 0.2, 1) : Easing.linear });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div style={{ width: "100%", height: "100%", scale: `${scale}`, transformOrigin: "50% 35%" }}>
        <Video src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
const Gradients: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 720,
      background: "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0) 100%)" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 900,
      background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.32) 45%, rgba(0,0,0,0) 100%)" }} />
  </AbsoluteFill>
);
// const PLAN = buildPlan(DURATION, FPS);
```
EDL data shapes used in practice:
`CAPTIONS: {from, to, words: W[]}[]`, `TWO_TONE: {from, to, lead, punch}[]`,
`CONDENSED: {from, to, lead, big}[]`, `PILLS: {from, to, text}[]`,
`CARDS: {from, to, dark, words}[]`, `BROLL: {from, to, layout, clips}[]`,
all in ms from the source start. Add `EMBEDS: {from, to, word}[]` for
embeds (Appendix C).

## Appendix C: Embed behind the subject (`EmbedWord`)

Not yet render-tested in this skill. Prove it on ONE check still before
building the rest of the edit around it, and fall back to the style's
normal big device if it doesn't hold up.

**How it works.** Three layers, bottom to top: the source video, the big
word, then a cutout of the subject (the same frames with everything but
the person made transparent). The cutout sits on top of the word, so the
head and shoulders occlude it. Captions (the rail) render above all
three.

**Step 1: make the subject matte, only for the embed spans.** Cut each
embed span from the FINAL source file (after any full-bleed fix), with
about 0.3s of padding on each side, at the composition fps:
```bash
ffmpeg -ss START -i source.mp4 -t DUR -vf fps=FPS -start_number 0 matte_in/%05d.png
```
Remove the background on every frame. rembg is the simplest:
```python
import glob, os
from PIL import Image
from rembg import remove, new_session
s = new_session("u2net_human_seg")   # or "birefnet-portrait" for better hair
os.makedirs("matte_out", exist_ok=True)
for p in sorted(glob.glob("matte_in/*.png")):
    remove(Image.open(p), session=s).save(p.replace("matte_in", "matte_out"))
```
Then encode the RGBA frames as a VP9 WebM with alpha:
```bash
ffmpeg -framerate FPS -i matte_out/%05d.png -c:v libvpx-vp9 -pix_fmt yuva420p \
  -b:v 0 -crf 28 -auto-alt-ref 0 public/embed_1_subject.webm
```
If the model download is blocked (rembg pulls weights from GitHub), try
another segmenter that runs in the environment. If none does, ask the user
for a transparent "remove background" export of that span from their
editor (CapCut, Runway, DaVinci), or skip the embed. Never fake the
occlusion with a hand-drawn mask.

**Step 2: the component.** The cutout MUST get the exact same zoom scale
and `transformOrigin` as the source layer at every frame, or the subject
and its cutout drift apart. Pull the scale math out of the zoom-cut layer
into a helper and use it in both places (Style A:
`SourceVideoZoomCuts` scale with origin `50% 50%`; Style B: the `Source`
scale in Appendix B with origin `50% 35%`).
```tsx
// EmbedWord.tsx
import React from "react";
import { AbsoluteFill, OffthreadVideo, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

export const EmbedWord: React.FC<{
  word: string;            // spoken word, verbatim
  subjectSrc: string;      // alpha WebM for this span
  padFrames: number;       // padding cut before the word's start in Step 1
  wordFrames: number;      // frames from entrance to start of exit
  zoomScale: number;       // same value the source layer uses at this frame
  zoomOrigin: string;      // "50% 50%" (Style A) or "50% 35%" (Style B)
  top: number; size: number; color: string; fontFamily: string; fontWeight: number;
}> = (p) => {
  const frame = useCurrentFrame();          // 0 = start of the padded span
  const t = frame - p.padFrames;            // 0 = word is spoken
  const IN = 6, OUT = 6;
  const inP = interpolate(t, [0, IN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
  const outP = interpolate(t, [p.wordFrames, p.wordFrames + OUT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const opacity = inP * (1 - outP);
  const scale = (0.86 + 0.14 * inP) * (1 - 0.06 * outP);
  const rise = (1 - inP) * 40;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: p.top, left: 0, right: 0, textAlign: "center",
        fontFamily: p.fontFamily, fontWeight: p.fontWeight, fontSize: p.size, lineHeight: 0.9,
        color: p.color, opacity, scale: `${scale}`, translate: `0px ${rise}px`, whiteSpace: "nowrap" }}>
        {p.word}
      </div>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div style={{ width: "100%", height: "100%", scale: `${p.zoomScale}`, transformOrigin: p.zoomOrigin }}>
          <OffthreadVideo src={staticFile(p.subjectSrc)} transparent muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```
Place it in a `Sequence` that starts `padFrames` before the word's real
timestamp and lasts the padded span, ABOVE the source layer and gradients
and BELOW every caption and text device. `scale` and `translate` are
strings on purpose (Section 7 gotcha).

**Design defaults.** Style B: Anton caps, white or lime, 300-420px, or
gold Playfair 800. Style A (only if approved): Playfair Display 400 in
`#F9FF80`, 240-320px. One word, never a phrase. `whiteSpace: "nowrap"`
and fit the size so the word stays inside x 40-1040. Hold for the beat,
usually 0.8-1.5s, then exit.

**QA on the check still.** Render a still at the middle of the hold. The
subject should cover part of the word (that's the point) but the word must
still read at a glance: no more than about a third of the letters hidden,
and never the first letter. Check the hair edge for halos or crawling, and
step through 3-4 stills to confirm the cutout stays locked to the subject
through any zoom-cut boundary inside the span. If it fails, move the word
up or down, resize it, or drop the embed.

## Style B pre-delivery checklist

- [ ] Video and script analyzed first; beat map built from THIS script.
- [ ] One batch of questions sent before building (script, shot list
      tied to lines, logos/recordings only if used, CTA if not spoken).
- [ ] Style chosen (or reference broken down and used as a framework, not
      copied).
- [ ] Every on-screen word is spoken in the clip and checked against the
      user's script; differences reported, unresolved words asked about.
- [ ] Devices chosen by what each beat does (Device fit), not by the
      order of a past reel or reference.
- [ ] Every spoken word appears in exactly one device; no doubles.
      Filler tagged "drop" is off screen only, never cut from the audio.
- [ ] Rail-first: caption groups carry most of the text. Embeds are
      scarce (at most one per beat, never two adjacent or co-visible, one
      apex max), excluded from the rail, and readable on a check still
      with the subject occluding them.
- [ ] Overlay law: full-screen layouts center on y 960 and run to the
      bottom edge; nothing lifted or shrunk for captions.
- [ ] Captions and every text device sit in the CENTER zone, never on
      anyone's face (including in B-roll), inside x 120-960, below y 220,
      with their bottom above y 1450 so Instagram's UI never hides them.
- [ ] Caption groups break at breath points; upcoming words ghosted.
- [ ] Big devices spaced out, plain caption stretches between them.
- [ ] Word cards and B-roll are overlays; voice track continuous and
      never muted; B-roll muted.
- [ ] Only user-supplied B-roll, logos, fonts and audio used.
- [ ] B-roll pre-trimmed into proxies before the render.
- [ ] CTA card only if the CTA is spoken; otherwise asked for.
- [ ] Position QA stills checked: no text on any face, nothing
      clipped at the edges, B-roll tiles fill with no bars.
- [ ] Unclear transcript words listed for the user, not guessed.