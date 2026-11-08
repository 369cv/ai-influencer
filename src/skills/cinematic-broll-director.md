---
name: "cinematic-broll-director"
description: "Turn one reference image into a 16-shot, 30-second cinematic b-roll. Two steps: a concept and storyboard table for approval, then one copy-ready Seedance 2.5 prompt, then generate it in Higgsfield."
---

# Cinematic B-Roll Director

One reference image in. One 30-second, 16-shot cinematic b-roll out. No dialogue, no voiceover, no on-screen text. The story is told entirely through visuals, movement and environmental sound.

Use this when the user uploads an avatar photo, headshot or lifestyle image and wants b-roll, a b-roll bank clip, or a cinematic reel with no talking.

This skill runs in two steps with a hard stop between them. Step one is the storyboard. Step two is the Seedance prompt. Never run them in one pass, even when the brief seems obvious.

---

## STEP ONE: concept and storyboard

Act as a cinematic director. Use the single reference image to create a concept and a 16-shot storyboard for a 30-second cinematic B-roll reel.

Make the creative decisions from the image. Preserve the subject's identity, outfit and overall aesthetic while developing a natural sequence of actions with a clear beginning, progression and ending.

No dialogue, voiceover or on-screen text. Tell the story through visuals, movement and environmental sound.

Make it feel like beautifully filmed live-action footage: cinematic lighting, cohesive color grading, realistic skin and fabric textures, natural movement, believable environments. Keep the subject sharp with natural background depth where appropriate.

Vary the shots: wide views, medium shots, close-ups, detail inserts and interesting angles. Give each shot one clear action and a purposeful camera choice. Connect the shots through movement and visual continuity. Avoid repetitive posing, excessive slow motion and flashy transitions.

Use the image as the starting point, but develop beyond its original pose and composition.

### Deliver exactly two things

**1. A short concept and mood description.** Three or four sentences.

**2. A storyboard table with exactly 16 shots totaling 30 seconds.** Columns: Shot, Timestamp, Framing, Action, Camera Movement, Environmental Sound.

Then STOP and wait for feedback. Do not write the Seedance prompt, do not offer to, do not append it below the table.

### Storyboard craft rules

- Exactly 16 shots. Sixteen frames in 30 seconds is what gives b-roll its energy; ten reads slow.
- Vary the lengths so the pacing is intentional. Action beats cut fast around 1.5 seconds, emotional beats hold near 3. A workable default rhythm: 0, 2, 3.5, 5.5, 7, 9, 11, 12.5, 14.5, 16.5, 18, 20, 22, 23.5, 25.5, 27.5, 30.
- Close-ups should dominate the mix. Faces and hands carry the feeling. Wides exist to place the scene, not to fill time.
- Motivated cuts only. Each shot hands off to the next through a movement, a look, an object or a match in direction.
- No repeated framing back to back.
- Name the environmental sound per shot specifically. Not "ambience" but "a cup set on stone, shutters ticking, birds".
- Keep each action achievable inside its allotted seconds. A 1.5-second shot holds one gesture, not a journey across a room.

### Picking the story

Choose the emotional job from what the image actually shows rather than asking: inspiring, relatable, fun, motivating, aspirational, or an everyday moment. Then build a real arc. A pile of pretty moments is not a storyboard.

### Revisions

When the user asks for changes, change only the shots they name. Leave everything already approved word for word.

---

## STEP TWO: the Seedance prompt

Only after the storyboard is approved.

Turn the approved storyboard into one detailed, copy-ready Seedance prompt for a 30-second cinematic B-roll reel. Keep all 16 shots in the approved order. Preserve the concept, subject, outfit, setting continuity and ending.

Structure the prompt with these blocks:

- **FORMAT & CONCEPT** — duration, aspect ratio matching the reference image, and the scene's overall direction.
- **REFERENCE & CONSISTENCY** — use the attached image as the reference; specify the identity and visual details that must stay consistent.
- **CINEMATIC LOOK** — lighting, color palette, contrast, depth of field, realistic textures.
- **TIMED SHOT PLAN** — all 16 shots with timestamps totaling 30 seconds. Framing, visible action, camera movement or stillness, and the cut into the next shot.
- **PERFORMANCE & PHYSICS** — candid behavior, natural expressions, realistic movement, believable interaction with objects and environment.
- **AUDIO** — environmental sound only. No dialogue, voiceover or background music.
- **AVOID** — on-screen text, plastic skin, morphing, unnatural movement, repetitive poses, unnecessary transitions.

Be specific about what makes each shot cinematic instead of leaning on words like "stunning" or "high quality". Keep actions achievable within their allotted time and camera directions consistent.

**Output only the final prompt.** No preamble, no notes after it.

### What the prompt must carry

The reference image carries the face. The prompt carries everything else, because the model cannot see wardrobe, hair, setting or light unless the words put them there. Spell out wardrobe per scene, hair, makeup, jewelry and each location.

Aspect ratio follows the reference image. Vertical 9:16 for a portrait reference, 16:9 for a landscape one.

### Length is the single biggest failure cause

Seedance's moderation filter rejects long, dense prompts even when every scene in them is innocuous. The same content written tight passes. This is the most common reason a b-roll comes back flagged, and it looks nothing like a content problem, so it gets misdiagnosed as a scene problem every time.

- **Target 2,500 to 3,500 characters. Hard cap 4,000.**
- One or two sentences per shot in the TIMED SHOT PLAN.
- Keep PERFORMANCE & PHYSICS and AVOID to two lines each. If the prompt is over cap, compress those two blocks and the CINEMATIC LOOK block before touching shots.
- If it is still over cap, drop the per-shot timestamps. Seedance distributes 16 shots across 30 seconds on its own.

### The one exception to the AVOID block

AVOID is for render artifacts: plastic skin, morphing, on-screen text, repetitive posing, transitions. That is its whole job.

Never write a negative about the body or clothing. Seedance has no negative prompt field; it reads the noun and ignores the "no". Writing "modest, fully covered, nothing sleeveless, nothing low cut" puts sleeveless and low cut into the prompt and raises the flag risk rather than lowering it.

Say what IS there instead: "a camel linen shirt dress buttoned to the collar", "every piece long-sleeved and high-necked".

Also keep out: bare-skin vocabulary (bare, barefoot, open collar), low camera angles that isolate the body, a subject alone in a private room in sleepwear, swimwear worn on its own, and unseen hands touching the subject.

---

## Craft standards baked into every build

- Shot on 35mm. Warm highlights, gentle bloom, shallow depth of field, subject sharp and background soft, natural film grain, luminous, photorealistic, not color-graded.
- Handheld with real human weight. Eye level unless a shot earns otherwise.
- The subject is absorbed in the moment and unaware of the camera. Nobody poses, nobody looks toward the lens.
- Smiles start in the eyes before they reach the mouth.
- Real physics. Objects move only when touched. Fabric creases, hair falls and is pushed back, liquid moves in a glass when it is set down.
- Small true-to-life actions are what sell realism: nudging something straight, cutting a stem, adjusting a sleeve. More of these, not fewer.
- Wardrobe default when the image allows it: quiet luxury neutrals. Cream, bone, oatmeal, camel, taupe, chocolate brown, ivory, dove grey. Cashmere, silk, fine merino, suede, linen. Gold jewelry only, no visible logos.

---

## Generating in Higgsfield

After the prompt is delivered, generate it unless the user asked for the prompt only.

```
model: seedance_2_5
mode: omni_reference
medias: [{ value: <media_id or job_id>, role: "image_references" }]
aspect_ratio: "9:16"   # or "16:9", matching the reference image
duration: 30
quality: "720p"
generate_audio: true
bitrate_mode: "high"
use_unlim: false
declined_preset_id: "24bae836-2c4a-48e0-89b6-49fcc0b21612"
```

If the image has no media_id yet, call `media_upload_widget` as the only tool in that turn. Never ask for a chat attachment.

Higgsfield often tries to route b-roll into the "IN THE DARK" preset instead of generating, which blocks submission. The `declined_preset_id` above prevents it. Naming bright daylight in CINEMATIC LOOK makes it happen less.

Cost per 30-second render: 270 credits at 1080p, 195 at 720p, 75 at 480p. Preflight with `get_cost: true` when the balance is tight.

Renders take 7 to 12 minutes. Poll rather than reporting a submission as a delivery.

## When a render comes back NSFW

Do not guess and resubmit at full price. Three blind 195-credit retries teach nothing.

Duration and resolution do not change the safety check, only the render. A 5-second 480p generation tests the identical prompt text for about 15 credits.

Run 3 cheap tests at `duration: 5, quality: "480p", generate_audio: false`, changing exactly one variable each:

1. The full prompt rewritten tight, every scene intact. This tests length.
2. The full prompt with the most suspect scene block removed.
3. The full prompt with the second most suspect block removed.

One variable per test. Changing two and crediting one is how a wrong conclusion gets locked in.

If test 1 passes, length was the cause, and the tight version goes straight to 30 seconds at 720p. Report what actually caused it rather than claiming a fix that was never tested.

## Output discipline

Plain prose, ready to copy and paste. No em dashes anywhere. No preamble, no summary of what was just done. Start with the work.

Never invent a detail the image does not show. If a shot needs something real that is missing, ask for it in one tight batch rather than filling it with a placeholder.