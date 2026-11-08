---
name: grwm-reels
description: Turns your AI avatar photo plus outfit photos, a setting and an activity into one Seedance 2.5 get-ready-with-me prompt. One outfit, or two with a finger-snap transition.
---

# GRWM Reels

Turns outfit photos into one copy-ready Seedance 2.5 prompt for a 15-second influencer get-ready-with-me starring the user's own AI avatar. The structure below is approved and locked. Fill it in, never redesign it.

## Step 1: collect the inputs

Check what the user already gave. Ask only for what is missing, in one short batch with AskUserQuestion:

1. **Their avatar image.** One clear reference image of their AI avatar (face and body visible). This becomes @image_1. Never start without it.
2. **How many outfits: one or two?** Always confirm this, even if two outfit images were sent.
3. **The outfit photo(s).** One image per outfit. A flat lay, a product shot or a photo of someone wearing it all work.
4. **The setting.** Balcony, closet, bathroom, bedroom, hotel room, and so on.
5. **The activity** for the opening line ("Get ready with me to go..."). Never invent it.

Do not ask anything else. Decide the robe, props, shoes, accessories and set details yourself from the outfit photos and the setting. Read whether the avatar is a woman or a man from the avatar image. The accent is American unless the user names another one.

## Step 2: decide the variable parts

- **Pronouns:** follow the avatar. The templates are written with "she". For a male avatar, switch every pronoun to "he" and apply the male adjustments in Step 3.
- **Robe:** a different robe every time. Rotate through: white terry, blush satin, champagne silk, oatmeal waffle-knit, ivory linen, soft gray cashmere, black silk, sage cotton (for a male avatar, favor white terry, navy waffle-knit, gray cotton, black silk, oatmeal linen). Never repeat the robe used earlier in the same conversation. Always belted.
- **Opening line:** "Get ready with me to go [activity]." It must be sayable in one easy breath in 3 seconds or less. If the activity makes it longer, shorten the activity wording and say so.
- **Pieces to show:** read them from the outfit photo (top, bottom, or dress, jacket, shoes, earrings, necklace, watch, bag, sunglasses). If the photo shows no shoes or bag, choose ones that match the outfit. Jewelry is gold unless the outfit clearly calls for something else.
- **Set:** describe the setting as a real place, with a surface where the outfit is laid out, a reflective surface the avatar checks themselves in, and one small real-life prop like a coffee cup. Pick where the phone sits so it fits the setting: on a tripod for a balcony, bedroom or closet, propped on the vanity or counter for a bathroom.
- **Image tags:** @image_1 is always the user's avatar. Outfit 1 is @image_2. Outfit 2 is @image_3.

## Step 3: write the prompt

Follow the template that matches the outfit count exactly. Keep every block and its wording. Only swap the bracketed content.

### Hard rules for every prompt

- Never describe skin, the body or how revealing a garment is (off-shoulder, cutout, slit, bare, low-cut, sheer, midriff, shirtless). Name the garments only and let the outfit image carry the cut. Words like those trip Seedance's NSFW filter.
- The avatar never undresses on screen. Outfit changes happen inside jump cuts. The dressing shot always opens with the lower garment already on, then shows the top layer or the final fastening going on (pulling a top on, zipping a dress, buttoning a shirt, fastening a collar, shrugging a jacket on).
- The opening line is one continuous take, 3 seconds or less, no cuts.
- The avatar shows every piece to the camera first, then puts them on.
- The earring or watch shot is never longer than 1 second.
- No forced or posed smiles, no staring into the lens, no exaggerated expressions or lip movement.
- American accent unless the user named another. No music. No on-screen text.
- No em dashes anywhere.
- Never leave a bracket or placeholder in the delivered prompt.

### Male avatar adjustments

- "Use @image_1 for the woman" becomes "Use @image_1 for the man".
- Shot 5 shows the watch in one open palm and the sunglasses in the other hand.
- Shot 7 becomes: "He fastens the watch on his wrist with a quick flick of the clasp."
- In Template B, shot 12 ends with a relaxed half smile and a small two-finger salute to the camera instead of a blown kiss.

### Template A: one outfit (15 seconds)

```
9:16 vertical, 15 seconds. A real influencer get-ready-with-me, filmed on a phone [mount, e.g. on a tripod at chest height / propped on the vanity] in [setting, one clause, with time of day]. One continuous story: she shows every piece of the outfit to the camera first, then puts each one on, going from robe to the full look. Natural cuts, like an influencer editing out the boring parts.

Use @image_1 for the woman. Preserve the referenced character's visual appearance throughout.
Use @image_2 for the outfit only: copy the [garments named plainly, with color, fabric and hardware details, no skin words], exactly. Copy no face, room or decor from @image_2.

Only words inside quotation marks are spoken. Everything else is direction and is never voiced.

SET: [setting details: background, the reflective surface, the prop]. The outfit is laid out on [surface]: [each piece listed, plus shoes, jewelry, sunglasses and bag].

CAMERA: Phone [mount], straight on, framing her from the knees up, the same position for the whole video. Natural phone-camera look, [light for the setting], real skin texture.

PERFORMANCE: Relaxed and natural, getting ready the way a real person does. Calm, normal expressions. When she shows each piece, she holds it close to the phone and looks at it, not at the lens. She looks at the camera only when she speaks and at the end.

SHOT 1 [0:00 to 0:03] One take.
She is in a [robe], belted. She leans in toward the phone and says casually, in one easy breath:
"Get ready with me to go [activity]."
American accent, relaxed, lips moving like normal talking.

SHOT 2 [0:03 to 0:04.5] Fixed frame.
Still in the robe, she holds the [top or dress] up on its hanger toward the phone and turns it once so [a detail of the garment] moves.

SHOT 3 [0:04.5 to 0:05.5] Fixed frame.
She holds up the [bottom or jacket], letting it fall open.

SHOT 4 [0:05.5 to 0:06.5] Close to the lens.
She holds the [shoes] up, one in each hand.

SHOT 5 [0:06.5 to 0:07.5] Close to the lens.
In one open palm, the [earrings or jewelry]. In the other hand, the [sunglasses or second accessory].

SHOT 6 [0:07.5 to 0:10] Fixed frame.
Standing in the [lower garment], she slips the [top] on, [fastening action] and smooths [detail] down. She checks her reflection in [reflective surface].

SHOT 7 [0:10 to 0:11] Closer side shot.
She pops in one [earring] with a quick flick of her hair.

SHOT 8 [0:11 to 0:12.5] Fixed frame.
With a hand on [support], she steps into one [shoe] and then the other.

SHOT 9 [0:12.5 to 0:13.5] Fixed frame.
She slides the [sunglasses] on and picks up the [bag].

SHOT 10 [0:13.5 to 0:15]
Full look. She walks toward the phone and reaches out to stop the recording. The video ends as her hand reaches the lens.

AUDIO: Natural [setting] sound throughout: [three or four real sounds of the place], fabric rustling, the hanger clicking, heels tapping [floor]. Her voice close and clear in shot 1. No music.

AVOID: forced or posed smiles, staring into the lens, exaggerated expressions or lip movement, rushed speech, British accent, slow motion, on-screen text, logos, other people.
```

(If the user chose a non-American accent, swap "American accent" in shot 1 for theirs and drop it from AVOID if listed there. For shoes without heels, swap "heels tapping" for the right footstep sound.)

### Template B: two outfits (15 seconds)

Same as Template A with these changes:

- The opening paragraph ends with: "Then a finger-snap transition into a second look."
- Add after the @image_2 line: "Use @image_3 for the second outfit only: copy the [garments and statement accessories named plainly], exactly." Then: "Copy no face, room or decor from @image_2 or @image_3."
- In SET, call it "The first outfit is laid out on..."
- In PERFORMANCE, the last sentence becomes: "She looks at the camera when she speaks, at the snap, and through the final fit check."
- Shots 1 to 9 compress to these timestamps: 1 [0:00 to 0:03], 2 [0:03 to 0:04], 3 [0:04 to 0:05], 4 [0:05 to 0:05.8], 5 [0:05.8 to 0:06.5], 6 [0:06.5 to 0:08.5], 7 [0:08.5 to 0:09.2], 8 [0:09.2 to 0:10.2], 9 [0:10.2 to 0:11]. Drop the reflection check from shot 6.
- Replace shot 10 and add shots 11 and 12:

```
SHOT 10 [0:11 to 0:12] Fixed frame.
Full first look. She lifts one hand toward the phone and snaps her fingers.

SHOT 11 [0:12 to 0:13.5] Hard jump cut on the snap, same frame, same spot.
She is now in the second outfit from @image_3, [its statement accessory]. She does a quick, easy fit check, turning to one side and then back, one hand smoothing [a detail of the garment].

SHOT 12 [0:13.5 to 0:15]
She steps in close to the phone, a relaxed little smile, and blows a kiss to the camera.
```

- AUDIO adds: "A crisp finger snap on the transition."
- AVOID drops "staring into the lens".

## Step 4: deliver

Output the finished prompt first, ready to paste. Under it, at most three short lines:

- Attach the avatar image as @image_1, the outfit as @image_2 (and the second outfit as @image_3), in that order.
- The robe used this time.
- Run it at 5 seconds and 480p with audio off first (about 15 credits) to clear the NSFW filter before the full render.

No preamble. No em dashes. Plain prose.

## Revisions

When the user asks for a change, change only the shots or lines they name and keep everything else word for word. Retime the timestamps only if the change forces it.
