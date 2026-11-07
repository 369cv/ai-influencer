---
name: character-angle-sheet
description: Step 2. Takes an existing anchor face (a defined photorealistic AI character) and writes copy-paste-ready GPT Image 2.0 prompts to render that SAME person from multiple camera ANGLES and poses — front, three-quarter left/right, profile, slight high/low angle — either as separate images or as a single multi-angle CHARACTER SHEET. This reference set is what keeps a character CONSISTENT when you feed it into image-to-video tools, because the model can see the face in 3D instead of guessing the sides. Use this skill whenever the user says "give me more angles", "I need my character from different sides", "make a reference sheet / turnaround / character sheet", "angle variations", "side profile of my character", or has a base face and wants a consistent reference set. Covers BOTH the per-angle prompt approach and the single-image character-sheet format that video models prefer. Outputs prompts, or generates the images directly if a Higgsfield/image MCP is connected.
---

# Character Angle Sheet

This is step 2. The user already has a defined character — ideally the clean
white-background realism anchor from step 1. This skill produces a **set of
angle and framing variations of that same person**, and explains how to
package them so image-to-video tools stay locked on one identity. Feeding a
video model several angles of a face (or one well-built character sheet)
keeps it consistent; feeding it a single front shot lets it invent the sides
and drift.

## The one rule that beats drift

Drift is the enemy: each new generation slowly becomes a different person. You
beat it by keeping the **identity description byte-identical** in every angle
prompt and changing only the camera and pose. Paraphrasing the FACE section
between shots is exactly how eye color, nose shape, and signature markers
wander. So: write the identity block once, reuse it unchanged everywhere, swap
only the ANGLE / POSE line.

## Two ways to produce the set (pick based on the user's downstream tool)

### Option A — separate per-angle images (most control)

Generate each angle as its own image. Best when the user wants high-resolution
individual frames, or wants to hand-pick which angle becomes a video start
frame. Each is the frozen identity + one new angle.

### Option B — single multi-angle character sheet (best for video models)

Generate ONE image containing several angles of the character in a grid. This
is the format image-to-video tools read most reliably as a consistency
reference, because all the angles live in one file the model can cross-check.

**Character-sheet format that works:**

- Two rows: top row full-body or bust shots, bottom row face close-ups.
- The same character in 4-6 panels / angles (front, three-quarter left,
  three-quarter right, left profile, right profile, back optional).
- Plain neutral background across all panels.
- Identical clothing, hair, and lighting in every panel — only the angle
  changes.
- Even spacing, each panel clearly separated.

Default to Option B when the user's next step is video; offer Option A when
they want individual hero frames.

## How image-to-image angle generation actually works

If the user feeds the anchor image into GPT Image 2.0 as a reference (image-to-
image) to make an angle, **do not redescribe the face in the prompt.** Re-
describing makes the model reinterpret and drift. Instead, anchor identity
explicitly and describe only the change:

> Keep the EXACT same face — same eyes, same hair, same skin, same identity.
> Do NOT modify the face. Only change the camera angle to a three-quarter
> right view.

When generating angles from text alone (no reference attached), you must paste
the full frozen identity block instead. Tell the user which mode you're
writing for.

## Workflow

### 1. Get the locked identity

You need the precise identity. In order of preference: reuse the FACE / HAIR /
SKIN sections from the concept-builder anchor verbatim; or a description the
user pastes; or an attached reference image (describe its identity precisely,
then reuse that description word for word). If the identity is vague, ask for
the anchor prompt or a reference image first — angles from a fuzzy identity
guarantee drift, so it's worth one question.

Freeze the identity into a reusable block: FACE, HAIR, SKIN, and every
signature marker. This block is copied into every prompt unchanged.

### 2. Choose the angle set

Core set for downstream video consistency:

1. Front — straight-on, eye level (matches the anchor).
2. Three-quarter left — head turned ~30-45° to camera left.
3. Three-quarter right — head turned ~30-45° to camera right.
4. Left profile — full side view.
5. Right profile — full side view.

Optional: slight high angle, slight low angle, plus framing variations
(extreme close-up on the face, bust, half-body). Keep the background and
lighting constant across all of them. Most image-to-video tools only need the
front + both three-quarters + both profiles, so deliver those five unless the
user wants more.

### 3. Write each prompt

Each prompt = frozen identity + one ANGLE / POSE section + the same LIGHTING
and BACKGROUND lines, in GPT Image 2.0's named UPPERCASE format. Keep lighting
and background identical across the set so only the angle reads as different —
that sameness is what makes them one person.

Practical shortcut: write the IDENTITY + LIGHTING + BACKGROUND block once, then
output each angle as that block with only the ANGLE / POSE swapped, each in its
own copyable code block.

### 4. Deliver

For Option A, give each angle as its own labeled code block ("Three-quarter
left", etc.). For Option B, give one code block describing the full sheet.
After the blocks, one or two lines: same ratio as the anchor (or 1:1 / 4:3 for
a sheet grid), and a note that this set feeds the image-to-video step.

## Consistency rules to enforce

- **Identity text is byte-identical across all angles.** Never reword the FACE
  section between shots.
- **Repeat every signature marker in every prompt** (the beauty mark,
  freckles, scar). Drop it on the profile and the profile becomes a stranger.
- **Lighting and background stay constant.** Change only the angle/pose.
- **One change at a time.** Don't combine "low angle + new outfit + sunset" in
  one variation — that's no longer a clean reference.
- **Same realistic SKIN line everywhere**, so no angle suddenly turns plastic.

## Worked examples

Frozen identity block (reused in every prompt):

```
IDENTITY:
FACE: Light olive Mediterranean complexion. Oval face, refined high
cheekbones, deep warm hazel eyes (NOT brown), full natural brows, slim
straight nose, full rosy lips. Signature: small dark beauty mark below the
left eye.
HAIR: Shoulder-length dark chestnut brown, straight (NOT wavy), center-parted.
SKIN: Hyper-realistic, very visible pores, peach fuzz, slight asymmetry,
micro-imperfections, NO smoothing, NO beauty filter.
```

Option A — Three-quarter right (text-only):

```
Ultra-photorealistic three-quarter-right studio portrait on a seamless plain
white background, vertical. Head turned about 35 degrees to camera right,
eyes looking toward the lens.

[paste the IDENTITY block here verbatim]

ANGLE / POSE: Head rotated ~35° to camera right, chin level, gaze toward
camera. Far cheekbone and jawline clearly visible, near ear partly hidden.

LIGHTING: Soft even frontal studio lighting, large softbox, minimal shadow,
catchlights in both eyes. Neutral white balance.

BACKGROUND / CAMERA: Seamless plain white backdrop filling the frame,
head-and-shoulders, eye level, 85mm look, sharp focus on the eyes.
```

Option B — single character sheet:

```
Ultra-photorealistic character reference sheet on a plain neutral grey
background, one image, evenly spaced panels.

LAYOUT: Two rows. Top row: three bust shots — front, three-quarter left,
three-quarter right. Bottom row: three face close-ups — left profile, front,
right profile. Six panels total, evenly spaced, clearly separated.

[paste the IDENTITY block here verbatim]

CONSISTENCY: The exact same person in every panel — identical face, hair,
skin, and the beauty mark below the left eye in all six. Identical neutral
clothing and identical soft even lighting in every panel. Only the camera
angle changes between panels.

CAMERA: Eye level, 85mm look, sharp focus on the face in every panel.
```

Reference set for GPT Image 2.0 · Option A at the anchor's ratio, Option B at
1:1 or 4:3 · these become the reference images for the consistent-character
video step.

## Optional: generate directly with the Higgsfield MCP

If the user has the Higgsfield MCP (or any image-generation MCP) connected, you
can generate the angle set or the character sheet for them in the chat instead
of only writing prompts. Confirm the parameters first so you don't waste
generations:

- **Aspect ratio / dimensions** — match the anchor for separate angles (3:4 or
  1:1); use 1:1 or 4:3 for a multi-panel character sheet.
- **Model** — which image model to use (keep it the same one used for the
  anchor so the look matches).
- **Which output** — separate per-angle images, or one combined character
  sheet (Option A vs Option B above).
- **Reference image** — confirm the anchor face is attached, so the angles are
  generated from the real identity rather than from scratch.

Then call the MCP with each angle prompt (or the sheet prompt), passing the
anchor as the reference image, and show the results. Generate the angles in a
consistent batch so the lighting stays identical. If no MCP is connected,
deliver the prompts as text.

## When NOT to use this skill

- Defining a brand-new character → concept-builder skill.
- Animating the character → consistent-character video skill.
- Captions, hooks, scripts → short-form content skill.
