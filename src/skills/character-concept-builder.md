---
name: character-concept-builder
description: 'Step 1 of building a consistent, photorealistic AI character. Helps decide WHO to create (age, look, niche, signature features), then writes a detailed, copy-paste GPT Image 2.0 prompt for a front-facing FACE on a plain WHITE BACKGROUND: the anchor image that keeps the character looking like the same real person across later images and videos. Also builds the character from a SELFIE or reference photo dropped in the chat, either reproducing that person''s exact face or using the photo as loose inspiration. Use whenever the user wants to invent, design, define, or lock in an AI character, persona, model, or influencer, or says "I don''t know what face to make", "design my AI model", "create a consistent character", "turn this selfie into a character", "use my photo as reference", or "reference face on white background". Always the FIRST step of a consistent-character workflow. Outputs a ready-to-paste prompt, or generates the image directly if a Higgsfield/image MCP is connected. Tuned for ultra-realism.'
---

# Character Concept Builder

This is step 1 of building a consistent AI character. The goal: turn a vague
idea ("a young woman", "a rugged guy", "no idea yet") into a fully defined,
believable person, then output one prompt — a **front-facing face on a plain
white background** — that renders as a real human, not a CGI doll. That single
image is the anchor every other tool in the kit refers back to. If the anchor
is generic, symmetrical, or plastic, everything downstream inherits the
fakeness. So realism and distinctiveness here are non-negotiable.

## Why realism lives or dies in this step

The default failure mode of every text-to-image model on faces is **plastic
skin and perfect symmetry** — poreless cheeks, airbrushed glow, flawless
features. Real human faces have pores, peach fuzz, slight asymmetry, stray
hairs, faint redness, under-eye softness. The anchor must bake in this texture
explicitly, because the model will not add it on its own. A realistic anchor
also forces every downstream generation to stay realistic; a plastic anchor
poisons the whole pipeline.

## Why a white-background anchor

A neutral, evenly lit, front-facing portrait on white is the cleanest possible
identity reference. No busy scene to copy, no dramatic light locking it to one
mood, no costume fighting the face. It isolates the only thing that must stay
constant — bone structure, eye color, skin texture, hair — while you freely
change pose, lighting, outfit, and scene later.

## How GPT Image 2.0 wants to be prompted

This is the model the anchor is written for, and it has a specific grammar.
Follow it or the realism collapses:

- **Named UPPERCASE sections**, not one long sentence. GPT Image 2.0 follows a
  structured brief (FACE, HAIR, SKIN, LIGHTING…) far more faithfully than
  prose. One section = one subject; never mix outfit details into LIGHTING.
- **Inline negatives in parentheses** on any detail with a likely wrong
  neighbour. "green eyes" alone drifts to neon green; write
  "deep dark hazel-green eyes (NOT bright green), (NOT brown)". This single
  habit prevents most identity drift.
- **Concrete, measurable detail** over vague praise. Not "beautiful face" but
  "high defined cheekbones, soft full lower lip, slightly hooded eyes". Every
  adjective must be something the model can actually paint.
- **No SD/Midjourney mantras.** Delete "masterpiece, 8k, ultra HD, award
  winning, trending on artstation". GPT Image 2.0 doesn't read these as
  quality signals; they just pollute the prompt. Use focal length, lighting
  type, film feel instead.
- **Keep it ~250-350 words.** Past ~500 the model starts distorting. The
  sweet spot for a rich face prompt is around 300 words.

## Working from a reference selfie (optional image input)

If the user drops a selfie or a reference photo into the chat, the character
can be built from it. There are two very different modes — always ask which
one the user wants, because the prompt is written completely differently:

### Mode 1 — Reproduce the exact person

Goal: the AI character IS the person in the photo, kept faithful. This is an
image-to-image job: the user feeds the selfie into GPT Image 2.0 as a
reference and the prompt's job is to **preserve identity, not reinvent it.**

The critical rule: **do NOT redescribe the face.** Re-describing what's already
in the photo makes GPT Image 2.0 reinterpret it and drift away from the real
person. Instead, anchor the identity explicitly and only state what changes
(here, just the framing and background):

```
Use the reference photo to keep the EXACT same person — same face, same eyes,
same nose, same hair, same skin, same identity. Do NOT modify or beautify the
face. Do NOT change the apparent age or ethnicity.

Re-render this exact person as a front-facing studio portrait on a seamless
plain white background, vertical, head and shoulders. Neutral relaxed
expression, lips closed, looking into the lens.

SKIN: keep the real skin texture — visible pores, peach fuzz, natural
imperfections. NO smoothing, NO beauty filter, NO plastic look.

LIGHTING: soft even frontal studio light, minimal shadow, neutral white
balance.

CRITICAL — what to AVOID:
- DO NOT alter the face, eyes, hair, or skin from the reference
- DO NOT add features that are not in the photo
- DO NOT beautify, slim, or smooth the face
- Only change the framing, background, and lighting
```

Note for the user: if the photo is a real, identifiable person (not
themselves), they should have the right to use that likeness. The skill keeps
the face faithful; consent is on them.

### Mode 2 — Use the photo as loose inspiration

Goal: borrow the vibe (a hairstyle, a bone structure, an energy, a styling)
but create a NEW, distinct person — not the same individual. Here you describe
the new character in full using the normal anchor sections below, and reference
the photo only for the specific traits being borrowed, explicitly breaking the
exact likeness:

```
Inspired by the reference photo's [vibe / hairstyle / styling], but create a
DIFFERENT, new person — NOT the same individual in the photo. Change the face
shape and features so it is clearly someone else.

[then build the full FACE / HAIR / SKIN / EXPRESSION / LIGHTING / CAMERA
sections as usual, describing the new character you want]
```

When in doubt about which mode, ask one question: "Do you want this to be the
exact same person from the photo, or a new character inspired by it?" Then
build accordingly. Everything below (sections, vocabulary, SKIN formula) still
applies — in Mode 1 you mostly skip the FACE description and let the image
carry it; in Mode 2 you write the full FACE section for the new person.

## Workflow

### 1. Lock the concept (guide, don't interrogate)

If the user already has a clear character, skip ahead. If vague, help them
decide by offering concrete options, not open questions they can't answer.
Settle these dimensions:

- **Identity basics** — apparent age range, gender presentation, ethnicity /
  regional look. Be specific: "Mediterranean late 20s" beats "a woman".
- **Niche / vibe** — what is the character for? fitness, fashion, luxury,
  streetwear, cozy lifestyle, beauty, travel, gaming. The niche drives every
  later styling choice, so name it now even loosely.
- **Signature features** — one or two memorable, repeatable traits. This is
  the single biggest lever for consistency, because it gives downstream tools
  an unmistakable anchor. Good signatures: a specific freckle pattern, a
  beauty mark in a fixed spot, heterochromia, a gap tooth, a strong jaw, a
  faint eyebrow scar, an unusual hair color. Push for at least one.
- **Realism target** — clean/polished or raw/imperfect. For believable
  characters, lean raw: real skin, slight asymmetry, lived-in look.

Push for distinctiveness. The most common reason a "consistent character"
keeps morphing into different people is that the face was too average to be
memorable. One or two strong, specific markers fix this.

### 2. Build the prompt from these sections

Fill each section with concrete detail. Pull from the vocabulary banks below;
adapt, don't copy verbatim. Required sections for the anchor:

- **Opening line** — sets photoreal + front-facing + plain white studio +
  vertical. e.g. "Ultra-photorealistic front-facing studio portrait on a
  seamless plain white background, vertical, head and shoulders."
- **FACE** — complexion first, then eyes (with a NOT), bone structure, nose
  (NOT if specific), lips, and the signature markers. This section carries
  identity; make it the most specific.
- **HAIR** — cut + texture + color + how it falls. Add a NOT if the texture
  could drift ("straight (NOT wavy)").
- **EXPRESSION** — neutral, relaxed, mouth closed or barely parted, looking
  into the lens. Neutral keeps the anchor reusable across moods later.
- **SKIN** — the realism anchor. Always explicit (see formula below).
- **LIGHTING** — soft, even, frontal studio light, minimal shadow. Flat on
  purpose so the anchor isn't married to a mood.
- **CAMERA / FRAMING** — head-and-shoulders, centered, eye level, 85mm look,
  sharp focus on the eyes, seamless white backdrop filling the frame.

### 3. Vocabulary banks (pick and adapt)

**Complexion (always lead FACE with this):** light olive Mediterranean with a
slight golden tan · pale European with very light freckles · warm porcelain
with a subtle rosy undertone · deep umber with a cool undertone · sun-tanned
olive with visible texture · fair Nordic, slightly translucent · mid-tan East
Asian with smooth even tone.

**Eyes (always pair with a NOT):** deep dark hazel-green (NOT brown), intense
direct gaze · soft warm amber (NOT yellow) · pale ice-blue (NOT grey) · dark
almond-shaped brown with golden flecks · slightly hooded grey-green ·
wide-set dark espresso.

**Bone structure:** sharp angular features with high defined cheekbones · soft
round face with low natural cheekbones · strong sculpted jawline · soft
tapered jawline with minimal definition · pronounced brow ridge, deep-set
eyes · heart-shaped face with a pointed chin.

**Nose (NOT if specific):** long straight aquiline (NOT bumpy) · small button
nose, slightly upturned tip · Roman nose with a pronounced bridge · slim Greek
nose, perfectly straight profile.

**Lips:** full natural lips, soft pink tone, slightly parted · thin pale lips,
neutral resting position · pronounced cupid's bow, medium fullness · slightly
chapped with natural texture.

**Signature markers:** a few scattered freckles across the nose bridge · a
small natural beauty mark on the right cheek · a faint scar through the left
eyebrow · subtle under-eye darkness (NOT puffy) · a small mole below the lip.

**Hair:** short slicked-back wavy dark brown, slightly tousled · medium wavy
chestnut, loosely center-parted · long straight jet-black past the shoulders ·
tightly coiled black, short fade on the sides · shoulder-length auburn with
sun-bleached ends · loose curly honey-blond, voluminous on top.

### 4. The SKIN formula (the realism core)

Always include an explicit SKIN section. Standard formula to adapt:

> Hyper-realistic skin with very visible pores, peach fuzz, light freckles,
> micro-imperfections, slight T-zone shine, faint natural asymmetry, subtle
> under-eye softness. NO smoothing, NO beauty filter, NO plastic look.

Variants: for a raw/casting look add "slight redness, the kind of skin you'd
see in an unedited shoot file"; for mature characters add "visible fine lines
around the eyes, subtle sunspots, slightly weathered cheeks".

### 5. Add a CRITICAL block only if the anchor is at realism risk

If the brief leans "real / candid / imperfect", append a short avoid-block to
stop GPT Image 2.0 from defaulting to a clean corporate headshot:

```
CRITICAL — what to AVOID:
- NO plastic or over-smoothed skin
- NO perfectly symmetrical face
- NO corporate headshot / LinkedIn profile vibe
- Retain real human imperfection and texture
```

Skip it for short, low-risk prompts.

### 6. Deliver

Present the prompt in a single fenced code block, one-click copyable, no
comments inside. After the block, two lines max: confirm it's a
white-background realism anchor for GPT Image 2.0, recommended ratio (3:4 or
1:1), and that this image feeds the angle-sheet step next. Don't explain each
section — the user wants to paste.

## Worked example

User: "I want a consistent AI woman, clean luxury vibe, but I haven't nailed
the look." After locking the concept (early-30s Northern Italian, luxury
fashion niche, signature beauty mark under the left eye, raw realism):

```
Ultra-photorealistic front-facing studio portrait on a seamless plain white
background, vertical, head and shoulders.

FACE:
- Light olive Mediterranean complexion with a subtle warm undertone
- Oval face with refined high cheekbones and a softly defined jawline
- Deep warm hazel eyes (NOT brown, NOT bright green), calm direct gaze
- Full natural eyebrows, lightly groomed, slightly darker than the hair
- Slim straight nose, narrow bridge (NOT bumpy)
- Full natural lips, soft rosy tone, no lipstick
- Signature: a single small dark beauty mark just below the left eye

HAIR:
Shoulder-length dark chestnut brown, straight (NOT wavy), center-parted,
smooth and natural with a few loose strands across the temple.

EXPRESSION:
Relaxed neutral expression, lips closed, looking directly into the lens.
Calm and composed, no smile.

SKIN:
Hyper-realistic with very visible pores, faint peach fuzz, light natural
asymmetry, subtle under-eye softness, micro-imperfections, slight T-zone
shine. NO smoothing, NO beauty filter, NO plastic look.

LIGHTING:
Soft even frontal studio lighting, large softbox straight on, minimal shadow,
gentle catchlights in both eyes. Neutral white balance.

CAMERA / FRAMING:
Head-and-shoulders portrait, centered, eye level, 85mm look, sharp focus on
the eyes. Seamless plain white backdrop fully filling the frame, no props.

CRITICAL — what to AVOID:
- NO plastic or over-smoothed skin
- NO perfectly symmetrical face
- NO corporate headshot vibe
- Retain real human imperfection and texture
```

White-background realism anchor for GPT Image 2.0 · 3:4 or 1:1 · this becomes
the reference face for the angle-sheet step.

## Optional: generate directly with the Higgsfield MCP

If the user has the Higgsfield MCP (or any image-generation MCP) connected, you
don't have to stop at the prompt — you can generate the anchor face for them
right inside the chat, instead of handing them text to paste elsewhere. Don't
just fire it off, though: confirm the few parameters the model needs first so
you don't waste a generation.

Ask, in one short question:

- **Aspect ratio / dimensions** — 9:16 (vertical/social), 1:1 (square), 3:4
  (portrait), 16:9 (landscape). For the anchor face, default to 3:4 or 1:1.
- **Model** — which one to use (GPT Image 2.0 fits this realism work; the user
  may prefer another the MCP offers).
- **Variations** — how many options to generate (2-4 is a good default).
- **Reference photo** — if Mode 1/2 above, confirm the selfie is attached.

Then call the MCP with the exact prompt you wrote, show the result, and offer
to regenerate or tweak the prompt. If no MCP is connected, just deliver the
prompt as text for the user to paste into their tool.

## When NOT to use this skill

- Generating multiple angles of an already-defined face → angle-sheet skill.
- Animating the character → consistent-character video skill.
- Captions, hooks, or scripts → short-form content skill.
