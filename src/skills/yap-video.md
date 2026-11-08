---
name: yap-video
description: "Turn a base image plus a script into ONE Seedance 2.5 prompt for a 30-second raw influencer-style talking video, selfie, tripod or driver's seat. Grounded mellow delivery with no performance or urgency, quotation marks reserved for dialogue only so lines are never spoken twice, dialogue broken at breath points with pacing notes, cuts anchored by timestamp, and real-world physics held including seatbelts when driving. Use whenever the user wants a yapping video, a selfie video, a talking-to-camera clip, or hands over a script and an avatar image and wants a Seedance prompt back."
---

# Yap Video

Input: a base image and a script. Output: one Seedance 2.5 prompt for a 30 second video of that person talking to camera like a real creator posting daily.

No production, no polish, no cinematography. She picked up her phone and started talking.

---

## The three hard rules

These break more videos than everything else in this file combined. Check them before anything else.

### 1. Quotation marks are for her lines and nothing else

Seedance speaks whatever it finds inside quotation marks. A note like `taps the air on "foundation"` makes her say the word foundation a second time, and the video comes back with lines doubled.

- Quotation marks wrap her actual dialogue. Nowhere else in the entire prompt.
- Reference a word without quoting it, or better, do not reference words at all. Say what she does, not which word she does it on.
- This applies to cut notes, gesture notes, delivery notes, the register line, the style tags, everything.

### 2. Anchor cuts by timestamp, not by word

The old word-anchored format is exactly what breaks rule 1. Write cuts as time plus the mid-sentence requirement:

`Cut at about five seconds, mid-sentence, to a slightly lower angle.`

Seedance places it fine from the timing, and nothing bleeds into the dialogue.

### 3. Grounded, never performed

The default register is mellow. She is sharing a thought with one person. Not selling, not announcing, not building to anything. No urgency, no aggression, no emphasis pushes, no hype.

This is a real trap: correcting a stiff video by adding expression notes swings it straight into performance. The fix for stiffness is **constant small movement, not punctuated big movement.** Eyes moving, regular blinking, small settling shifts, a hand that rests and occasionally lifts. Not eyebrow jumps, not lean-ins, not widened eyes, not chin lifts.

Write it into the register line every time: grounded and mellow, sharing a thought rather than selling one, calm and unhurried, no emphasis pushes, movement constant and small rather than punctuated.

---

## The two inputs

**The base image is the identity.** Reference it as `@image` in the prompt. Never re-describe her face, hair, makeup, outfit, or the room. The image already carries all of it and repeating it wastes the front of the prompt where Seedance is paying most attention. The only exceptions are a prop she actively uses in the motion, and a deliberate continuity override (a Part 2 opening with sunglasses already pushed up, say), which is stated once and flagged to the user.

**The script is law.** Her words ship exactly as written, in order, with her spelling, her lowercase, her ellipses, her fragments. Never tighten, rephrase, fix grammar, or improve a joke. The exception is when the user asks for fillers or a rewrite, which they sometimes will.

Spell out numbers and symbols the way she would say them. Seedance reads $0 and 50k wrong. Write zero dollars and fifty thousand.

If no script is given, write one, and only then do the writing rules at the bottom of this file apply.

---

## Prompt priority

Seedance 2.5 front-weights its attention, so the order is not cosmetic:

1. Visual hook and motion
2. Dialogue
3. Delivery and emotional register
4. Camera rig and physics
5. Style tags last

Tight prompts beat long ones. Keep the whole thing under about 350 words for 30 seconds.

---

## Timing

**A conversational 30 second video is 90 to 115 words. Target 100.**

This is lower than a words-per-second calculation suggests, and deliberately so. Room to breathe is what separates a person talking from a person reciting. A script at 130 words technically fits in 30 seconds and still comes back sounding chased, because there is nowhere for a pause, a filler, or a physical beat to live.

Check the script before writing anything:

- **Under 85 words:** it will run short and Seedance may pad it. Ask for more script rather than inventing lines.
- **Over 120 words:** offer to split into Part 1 and Part 2 rather than compressing. Two 30 second videos at a human pace beat one rushed video every time, and the split is a native format anyway.

When splitting, break at the idea seam. Part 1 carries the problem and the reframe, Part 2 carries the ask and the proof. Each part needs its own opening hook, since each posts as its own video. If the pair will be watched back to back, carry physical continuity forward (sunglasses that came off in Part 1 stay off) and say so.

---

## The visual hook, first three seconds

Every video opens on a physical action, and **the hook and her first words happen at the same time.** She is already talking as it happens. It never takes its turn first.

It has to be possible for the rig:

**Selfie, one hand on the phone:** hair falling in her face and getting tucked back, glancing off screen at a noise then snapping back, setting a drink down, pushing a door open with her shoulder, sitting down mid-sentence, wiping her hands on a towel.

**Driver's seat:** checking the mirror, turning the music down, pushing sunglasses up onto her head, glancing at the road and coming back.

**Both hands free, tripod:** putting her hair up while talking, dropping something and catching it, something falling over behind her, tying a shoelace, folding laundry.

Rules: it happens inside the first two to three seconds, overlapping with dialogue, it feels accidental rather than staged, and it is not the same hook as the last video.

**Then hook it again.** Put a second physical beat somewhere between eight and twenty seconds: she sits up, swaps position, pulls a knee up onto the seat, pushes her sunglasses up, runs a hand through her hair, holds up fingers for a number, gets distracted for half a second. It is smaller than the opening hook and it is never announced.

**Comedy beats.** A deliberate dead beat can work: she stops talking, does something faintly ridiculous, then picks up. Make the physical action match the actual object. A chair with legs gets short hopping scoots with the legs knocking; a chair with wheels glides and reads wrong. If a sound cue rides with it, say explicitly that it stops, or Seedance runs it under the whole video.

---

## Cuts

A 30 second unbroken shot of a face reads as a webcam recording. Break it with **two to four jump cuts**, which is the native influencer edit anyway.

- **Anchor by timestamp, never by a quoted word.** See hard rule 2.
- **Every cut lands mid-sentence.** Cutting on a full stop looks like a chapter break. Say mid-sentence explicitly.
- **Same rig, same place, small change.** Her position shifts slightly, the framing changes a little. Nothing else changes: same outfit, same hair, same light.
- **A location change needs a physical exit.** She stands, walks, opens a door. Never teleport her.
- **The phone logic has to hold.** In a selfie cut she is still holding it, in the same hand. If the next shot is wider than an arm's length, she propped it against something and it needs saying.
- **A physical beat plays uncut.** If she does something that needs to be seen, say it plays uncut and do not put a cut on top of it.
- **A framing change caused by a physical action is permanent.** If she moves closer to the camera, every shot after it stays at that size.

---

## Camera and physics

**Selfie:** one hand on the phone, the phone never appears in frame, real handheld selfie shake in every shot, the other hand doing something specific.

**Driver's seat:** selfie shake plus small road vibration. **Seatbelt fastened and visible across her chest, always.** Her eyes move between the lens and the windshield throughout rather than staring at the camera. The free hand rests on the wheel and leaves it only briefly to gesture, then returns. Light moves across her face as the car moves. If a driving video feels risky for the user's audience, the swap is a parked car with the engine running.

**Tripod or filmed by someone else:** say which explicitly. Steady frame, both hands free.

**Always:** the laws of physics hold. Nothing appears or disappears mid-shot, props stay where they were put, a prop stays in the same hand for the whole video, no floating objects, no teleporting props, and she never looks at anything except the lens unless a note says so.

---

## Delivery

One register line near the top, written as behavior rather than mood, carrying the grounded default from hard rule 3 and the pacing intent: real pauses, audible breaths, never a steady recital rhythm.

### Break the dialogue at breath points

This is what decides whether the video sounds like a person or a recitation. A long unbroken block of dialogue comes back read at one steady clip no matter how good the register line is.

**Split the script into the chunks she would actually say in one breath, and put a note between every chunk.** A chunk is usually one sentence; a long sentence splits at its natural breath, and two short punchy sentences can ride together. Six to nine chunks is normal for 30 seconds.

Chunking changes where the line breaks fall, never a single word.

### What the notes contain

Weight them toward how she is talking and where her attention is, not toward her face:

- **Pacing:** trails off, small breath, half-beat pause, slows here, offhand and slightly quicker, lets it sit.
- **Volume:** voice drops, quieter almost to herself, said plainly with no emphasis.
- **Attention:** eyes flick to the road and back, eyes go to the lens and stay, glances away mid-phrase.
- **Small body:** one small nod, one shoulder settles, free hand lifts palm up and returns, one small flat gesture.
- **Face, rarely and small:** softens around the eyes, small headshake, regular blinking.

Keep every note to about three to eight words. No quotation marks in any of them.

### The smile trap

A standalone smile note in a silent gap makes Seedance stretch the lips wide and hold it, which lands somewhere between uncanny and clownish. So:

- No smile, grin, or laugh note in a gap between chunks.
- State it positively in the register line: between phrases her mouth stays relaxed and slightly parted with a loose jaw, and any smile happens while words are still coming out.
- If it still happens, shorten the silent beats rather than adding more mouth direction. It only makes that face when it has empty frames to fill.

Micro-movements go in the motion section and have to be specific. Eyes moving between two points, regular blinking, small settling shifts in her seat, hair moving when she turns. Never "natural movements."

**American by default** unless the user says otherwise, in the voice tag and in the word choices.

---

## The prompt template

```
[VISUAL HOOK, one sentence: what she does in the first two to three seconds while already talking]

30-second ultra-realistic influencer-style [selfie / tripod / driver's seat] video of the woman in @image. [Rig context in a clause.] Talking to the camera the way you talk to a friend.

[REGISTER: grounded and mellow, sharing a thought rather than selling one, calm and unhurried, no emphasis pushes, movement constant and small rather than punctuated. Between phrases her mouth stays relaxed and slightly parted with a loose jaw, and any smile happens while words are still coming out.]

Dialogue:
"[first breath-chunk, verbatim]"
[note, no quotation marks]
"[next breath-chunk]"
[note]
[continue for every chunk, six to nine of them]

Motion:
[Hook action in the first two seconds while already talking]. [Cuts by timestamp, each stated as mid-sentence]. [Physical beats by timestamp, stated as playing uncut]. [Rig and physics]. Natural micro-movements: [three specific ones].

Ultra-realistic. Natural skin texture. Clean lip sync. Restrained understated performance, relaxed neutral mouth between phrases. 4K.
Soft low American voice, calm and even. Slow conversational pacing with real pauses and audible breaths. [Physics and ambient sound]. No background music.
```

---

## Worked example

Script supplied by the user, 92 words, driver's seat:

```
She checks her side mirror, then brings her eyes back to the lens, already mid-sentence, seatbelt across her chest.

30-second ultra-realistic influencer-style selfie video of the woman in @image, filming herself from the driver's seat while driving, seatbelt fastened. Talking to the camera the way you talk to a friend in the passenger seat.

Grounded and mellow. She is sharing a thought, not selling one. Calm and unhurried, no emphasis pushes, no performance. Her movement is constant and small rather than punctuated. Between phrases her mouth stays relaxed and slightly parted with a loose jaw, and any smile happens while words are still coming out.

Dialogue:
"okay so if you have a fear of being seen..."
Trails off. Small breath. Eyes flick to the road and back.
"but you still want to make money online and grow your personal brand, umm, I need you to pay attention for a second."
Said evenly, no push. Free hand lifts off the wheel palm up and settles back.
She stops talking, pushes her sunglasses up onto her head with her free hand, blinks in the light, glances at the road, comes back to the lens.
"because it's 2026 and the rules have changed. in your favor."
Softens around the eyes. One small nod.
"aaand AI avatars aren't just for fun random AI videos anymore."
Slightly quicker, offhand. Small headshake.
"they're the new foundation for personal branding."
One small flat gesture with her free hand, then back to the wheel.
"which is exactly why people like you and me, who genuinely hate being on camera, are using them to build multiple income streams."
Warm and easy. Eyes go to the road mid-phrase and come back.
"like, actual income streams. not a hobby."
Quieter. One shoulder settles. Eyes return to the road and stay there.

Motion:
Mirror check in the first two seconds while already talking. Cut at about five seconds, mid-sentence, to a slightly lower angle with the phone still in the same hand. The sunglasses beat at about eight seconds plays uncut. Cut at about seventeen seconds, mid-sentence, to a slightly closer frame. Around twenty-two seconds she runs her free hand back through her hair and returns it to the wheel. Real handheld selfie shake plus small road vibration, phone never in frame, free hand resting on the wheel and leaving it only briefly. Natural micro-movements: eyes moving between the lens and the windshield throughout, regular blinking, small settling shifts in her seat, dappled light passing across her face.

Ultra-realistic. Natural skin texture. Clean lip sync. Restrained understated performance, relaxed neutral mouth between phrases. 4K.
Soft low American voice, calm and even. Slow conversational pacing with real pauses and audible breaths. Seatbelt fastened throughout, hands and car obeying real physics. Faint engine hum and road noise under her voice. No background music.
```

---

## If no script is given

Write one at 90 to 115 words, then apply everything above.

- Open mid-thought. No greeting, no hey guys, no setup of the topic.
- One idea only, and it is a real opinion, not a tip list.
- Talk about something that happened to her, with the specific detail in it.
- Say it the way she talks: lowercase energy, run-on clauses, ellipses where she trails and picks back up, a filler where a real person stalls.
- One line that lands, delivered flat.
- End on the thought continuing rather than a summary, and never on a punchline that announces itself.

---

## Checklist

- [ ] Quotation marks appear around her dialogue and nowhere else in the prompt
- [ ] Cuts anchored by timestamp, each stated as mid-sentence, no quoted words
- [ ] Register line says grounded, mellow, no emphasis pushes, movement constant and small
- [ ] No smile, grin, or laugh note sitting in a silent gap
- [ ] Relaxed neutral mouth between phrases stated positively
- [ ] Script word for word, numbers and symbols spelled out as spoken
- [ ] 90 to 115 words, or split into two parts at the idea seam
- [ ] Dialogue broken into six to nine breath-chunks with a note between every one
- [ ] Visual hook in the first two to three seconds, overlapping the first words
- [ ] A second physical beat between eight and twenty seconds, playing uncut
- [ ] Rig named; seatbelt fastened and eyes moving to the road if she is driving
- [ ] Props stay in the same hand, physics hold, nothing appears or disappears
- [ ] No description of face, hair, outfit or room anywhere
- [ ] Three specific micro-movements
- [ ] Under about 350 words total
- [ ] Ends on the style tags and no background music