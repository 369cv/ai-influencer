---
name: consistent-character-video
description: 'Step 3. Writes copy-paste-ready image-to-video prompts that ANIMATE a consistent, realistic AI character across multiple clips, using the character''s reference images (front + angles, or a character sheet) as input. Covers two models with completely different grammars: Kling 3.0 (the right tool for consistent HUMAN characters — image-to-video, start + end frame chaining) and Seedance 2.0 (6-part cinematic formula, single-shot and timeline). Crucially encodes a hard real-world limit: Seedance 2.0 BLOCKS realistic human face references, so for a recurring human character you lean on Kling. Use this skill whenever the user wants to "animate my character", "turn my reference into a video", "image to video", "Kling prompt", "Seedance prompt", "make my AI character talk/walk/move", "consistent video of my character", or "multiple clips same character". Outputs prompts plus the reference-image setup, or generates the clips directly if a Higgsfield/video MCP is connected.'
---

# Consistent Character Video

The animation step. The user has a defined realistic character and reference
images (ideally the front + angle set or character sheet from step 2). The
goal: animate that character across multiple clips while it stays the same
believable person. This skill writes prompts for **Kling 3.0** and
**Seedance 2.0**, each with its own grammar, and — most importantly — tells the
user which one to use, because picking wrong wastes generations.

## Pick the model FIRST (this decides everything)

The prompt grammar is totally different per model, and one of them has a hard
restriction that breaks the naive workflow. Decide before writing:

### The key fact most people get wrong

**Seedance 2.0 blocks photorealistic human face references.** If you pass a
realistic human face as a reference image, it refuses or produces garbled
output — this is an identity-protection content filter, not a bug. So the
obvious "generate a realistic person, then animate her in Seedance" pipeline
does NOT work for recurring human characters.

For a **consistent realistic human character**, the right tool is **Kling 3.0**:
it accepts a realistic face as the start frame, supports start + end frame
chaining, and holds identity well across a clip and across chained clips.

Reach for **Seedance 2.0** when the subject is NOT a realistic human reference:
products, environments/locations, action and VFX, atmospheric scenes, or
non-photographic (stylized/3D) character sheets. It's also excellent for
cinematic multi-beat timeline shots. If the human character only appears
briefly or doesn't need to recur identically, Seedance's describe-only mode is
fine.

Quick decision:

- Recurring realistic human, face must stay identical → **Kling 3.0**.
- Product / location / action / cinematic atmosphere → **Seedance 2.0**.
- Talking face is the whole point → Kling 3.0 (or a dedicated talking-face
  model if the user has one).

## Reference images: identity comes from the image, not the text

The face stays consistent mostly because of the **input image**, not the
prompt. The text directs motion; the reference holds identity. So:

- Use the cleanest, most front-facing frame as the **start frame**.
- If the model accepts it, a character sheet or a second three-quarter angle
  helps the model understand the face in 3D — this is why step 2 exists.
- Generate any extra reference frame you need (new outfit, new setting) with
  the image skills first, then bring it here as input. The video step consumes
  images; it does not invent identity.
- Keep the character's signature markers visible in the frame you pick.

---

## Kling 3.0 grammar

Kling reads a **motion-focused** prompt on top of a start image. The image
already defines who and where, so do NOT redescribe the static frame —
describe what moves and how the camera behaves. Redescribing the face actually
causes drift. Keep it tight and physical.

Write in this order:

1. **Subject reference (brief)** — "The woman in the reference image…". One
   short clause; the image carries the look.
2. **Action** — ONE clear primary action with explicit intensity. Verbs, not
   adjectives: "slowly turns her head toward the camera and gives a soft
   smile."
3. **Camera move** — ONE move only. "Slow push-in." / "Static locked shot." /
   "Gentle handheld drift." Never stack moves.
4. **Micro-motion** — the small life that sells realism: a blink, hair
   shifting, fabric settling, breath, a strand moving. Realistic micro-motion
   is what separates a believable clip from an uncanny one.
5. **Mood / pace** — "calm, natural pace" or "energetic, snappy".

Kling tips:

- **Start frame** = your best reference image. For a controlled motion, set an
  **end frame** too and describe the motion that bridges the two; Kling
  interpolates between them.
- **Chain clips for continuity**: take the last frame of clip A and use it as
  the start frame of clip B. This keeps one continuous character across shots.
- **One beat per clip.** Over-describing motion in a short clip causes warping
  of the face. Keep each clip to a single action.
- **Talking clips**: describe the speaking action and emotion ("speaks calmly,
  natural lip movement, subtle head nods") rather than exact words.
- Settings: 16:9 / 9:16 / 1:1, duration 3-15s, `pro` mode for quality.
- Phrase everything positively — most video models ignore negative prompts.
  Instead of "no blur", write "tack sharp".

Kling example (image-to-video, start frame = front reference):

```
The woman in the reference image slowly turns her head from three-quarter
toward the camera and gives a soft, natural smile. Slow push-in. Her hair
shifts gently, she blinks once, soft fabric movement on the shoulder. Calm,
natural pace, photorealistic.
```

Start frame: the front/anchor reference · for a sequence, set the
three-quarter angle as the end frame and let Kling interpolate the turn.

---

## Seedance 2.0 grammar

Seedance is a visual pattern matcher, not a script reader. It loses focus past
~100 words and ignores camera brands, film-stock names, exact speed
percentages, and post-production jargon. Remember the face restriction above —
use it for products, locations, action, atmosphere, or describe-only humans.
Build every prompt from the **6-part formula**:

```
CAMERA + SUBJECT + ACTION + ENVIRONMENT + LIGHTING + STYLE
```

- **Camera** — ONE move (static, slow dolly in/out, tracking, orbit, crane,
  pan/tilt). Use focal-length feel (24mm wide, 35mm normal, 50mm/85mm
  portrait, macro), never brand names.
- **Subject** — specific and visual; 3-4 anchors (age, build, hair, one
  signature garment). Keep it short and consistent with the start frame so
  text and image agree. No real people's names — the content filter blocks
  likenesses.
- **Action** — ONE primary action with an explicit intensity word (gently,
  slowly, powerfully, violently). Use animatable verbs (walks, turns, reaches,
  exhales, leaps, shatters). Describe speed in words ("extreme slow motion"),
  never percentages.
- **Environment** — a specific place PLUS at least one atmospheric particle the
  model can render dynamically: rain, fog, dust, smoke, sparks, snow, steam,
  embers, dust motes. These give Seedance dynamic data to lock onto.
- **Lighting** — direction and type; the #1 quality lever. Golden hour, blue
  hour, rim/backlight, low-key side light, volumetric, neon, practical lights
  only, three-point. A prompt without lighting direction looks flat and "AI-y".
- **Style** — close with 2-3 keywords (cinematic film grain, shallow depth of
  field, warm amber tones / anamorphic flare, desaturated grade, handheld
  feel) plus optionally one mood word (intimate, visceral, serene).

Word count: **single shot 50-70 words**; **timeline 100-150 words** with 3-4
timestamped segments `[0:00-0:03]`. Hard ceiling ~200 words — past that
Seedance ignores the prompt.

Seedance single-shot example:

```
Slow 50mm push-in, shallow depth of field. A woman in her late 20s in a cream
coat walks toward camera through a quiet city street at golden hour, smiling
softly. Warm sunlight rim-lights her hair, faint dust drifts in the light.
Cinematic film grain, warm amber tones.
```

Seedance timeline example (~120 words):

```
35mm, shallow depth of field. A woman in a cream coat moves through a sunlit
apartment, calm and natural. Soft window light, warm tones, cinematic film
grain.

[0:00-0:03] Static shot. She stands by a tall window, turns her head toward
the camera and smiles softly. Hair shifts in a faint breeze.

[0:03-0:07] Slow push-in. She lifts a coffee cup and takes a relaxed sip,
eyes returning to the lens. Steam rises gently from the cup.

[0:07-0:10] She sets the cup down and leans back against the window frame,
soft golden light wrapping her face. Calm, intimate, cinematic.
```

For Seedance, the start-frame image carries identity; keep the SUBJECT text
short so it doesn't fight the image.

### Workarounds if you must use Seedance with a human

Imperfect, but worth knowing: obscure part of the face in the reference (e.g.
holding a product that partly covers it); use a clearly non-photographic
(stylized/3D) character sheet that the filter doesn't read as a real person;
or skip the reference and describe the character in the prompt, accepting that
consistency between separate generations isn't guaranteed. If identical
recurring human identity is essential, just use Kling 3.0.

---

## Extending past a single clip / 15 seconds

Both models cap a single generation short (Kling up to ~15s, Seedance 5/10/15s,
10s is the sweet spot). For longer sequences: generate clip 1, grab its last
frame, use that as the start frame of clip 2, and write a prompt that picks up
where it left off. Repeat to build a continuous narrative with one consistent
character.

## Workflow

1. **Confirm the reference images** the user has (front + angles, or a sheet).
   If only a front shot, suggest generating a three-quarter angle or sheet with
   the angle-sheet skill first.
2. **Pick the model** by the decision rule above — and warn about the Seedance
   face restriction if the subject is a realistic human.
3. **Write the prompt** in that model's grammar (motion-only for Kling, 6-part
   for Seedance).
4. **For multi-clip sequences**, plan continuity: chain last-frame→next-start
   (Kling), or keep SUBJECT text identical across Seedance shots.
5. **Deliver** each clip prompt in its own fenced code block, plus a one-line
   note on which reference to use as the start (and end) frame and the
   recommended settings.

## Consistency rules

- Identity comes from the **image**; never rely on text alone for a recurring
  face.
- Keep the subject description short and identical across clips so it agrees
  with the reference.
- One action and one camera move per clip — stacking causes warping and drift.
- Realistic micro-motion (blink, breath, hair) sells realism; over-animation
  breaks it.
- For continuous sequences, chain frames (Kling) or reuse the same start
  reference.

## Optional: generate directly with the Higgsfield MCP

If the user has the Higgsfield MCP (or any video-generation MCP) connected, you
can generate the clip for them in the chat instead of only writing the prompt.
Video generations are expensive, so confirm the parameters before you fire —
ask in one short question:

- **Model** — Kling 3.0 (recurring realistic human faces) or Seedance 2.0
  (scenes, products, action). Pick per the decision rule above, and remember
  Seedance blocks realistic face references.
- **Duration** — e.g. 5s or 10s (10s is usually the sweet spot).
- **Aspect ratio / dimensions** — 9:16 (Reel/social), 16:9 (cinematic), 1:1.
- **Start frame** (and end frame if chaining) — which reference image to use
  as the first frame; for a sequence, which image is the end frame.
- **Resolution** — pick the highest the MCP offers if quality matters.

Then call the MCP with the motion prompt and the chosen start (and end) frame,
show the result, and offer to refine or chain the next clip from its last
frame. If no MCP is connected, just deliver the prompt as text.

## When NOT to use this skill

- Defining the character or making stills → image skills (concept, angles).
- Captions, hooks, descriptions, CTAs → short-form content skill.
- Models other than Kling 3.0 / Seedance 2.0 → different grammar, not covered.
