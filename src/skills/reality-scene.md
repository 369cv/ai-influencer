---
name: "reality-scene"
description: "Build candid reality-TV conversational video scenes for Seedance as ONE single 30-second prompt under a hard 9,000 character cap. Writes original overheard-conversation banter, then shoots it with a proven craft architecture: real conversational pace (never rushed), timed 0.5s and 1s beats filled with reactions, full delivery direction on every line (voice, face, reaction), close-ups in most shots, rotating angles, overlaps on interruptions, mid-word cuts, imperfect handheld with slow hand zooms, shallow 85mm f1.4, warm ungraded light, audio perspective, imperfect faces. Use for two-person conversational scenes, sequel clips, or when a scene comes back rushed, robotic, emotionless, stiff, staged, silent, like an ad, or rejected by Seedance."
---

# Reality Scene

Reproduces a scene that went viral, for any concept.

Two references, and they do different jobs. Read both before writing anything.

- **`references/proven-prompt.md`** is the craft. How a scene is shot, paced, cut, delivered and sounded. Lift its phrasings, compressed to fit the length cap below. The proven prompt itself runs about 11,000 characters, so it is never pasted in whole.
- **`references/scripting-framework.md`** is the writing. What the people actually say. Every conversation is built from this, never from the proven prompt.

### The proven prompt is craft, never content

It is a delivery reference. It is not a story to retell. Nothing about its conversation carries over: not the first date, not the restaurant, not the sarcastic opener about not wanting to reply to his text, not the joke reveal, not "so what do you do," not the fake AI avatars jab, not its beat order, not any of its lines rephrased.

What carries over is only this: the pacing rule, the framing rule, the camera behavior, the look, the audio, the character-building method, the shot list format, the negative block, and the way delivery is directed line by line. Study how richly the proven prompt directs each line ("the charm gone out of his face," "totally sarcastic, totally straight, no smile, no wink"). That depth of delivery is the standard. For the pacing wording itself, use Block 2 of this file, which adds timed beats on top of the proven prompt's overlap rule.

If a draft contains a first date, a wine sip used as punctuation, a joke that turns out to be a joke, or somebody asking what the other does for a living, it has copied the wrong layer. Start the conversation again from the scripting framework.

## How to run this skill

**Do the work. Do not interview.** A one line vision is a complete brief. The setting, the cast, the dynamic, the beats, the lines, the camera plan, the delivery, all of it is yours to decide. Decide, then hand over a finished prompt.

**Ask about exactly one thing: a real fact you cannot invent.** A revenue number, a client result, a price, the name of the offer. One tight batch, nothing else, and never invent them.

**Never hand back a prompt with a bracket or a placeholder in it.** Ready to paste, every time.

**Every prompt stays under the length cap.** Measure it before handoff. A prompt Seedance refuses to run is worth nothing, however good the craft.

**Close-ups carry every scene.** Most shots are close-ups, the angle rotates on every cut, and the framing line in every shot names its shot size and angle. Shortening a prompt never shortens the camera plan.

**Delivery carries every line.** Nothing lands without the right delivery. Every spoken line gets a delivery note (how it is said, what the face does, when it shifts), every shot where the camera holds the listener gets a reaction line, and the emotional turns get timed beats. Delivery, reactions and beats are protected exactly like dialogue and framing. Shortening a prompt never strips them. If the prompt is over the cap, cut look, audio, wardrobe and negatives first.

**Real speed, never rushed.** A scene crammed with words makes people sound like puppets on 2x speed. The pace is fast, natural banter at the speed real people talk, with overlaps on interruptions and quick comebacks, and timed beats where a real person would react. Fast comes from overlaps and cuts, never from packing in more words.

### The script is law

If the user gives lines, those exact words ship. Word for word, in order, nothing tightened, rephrased, or improved. Your job on a supplied script is everything around the words: which shot each line sits in, the timing, the overlaps, the delivery, the camera, the sound. The word budget and the length cap do not authorize editing it. If it runs long, say so and offer to trim or split, then wait. Direction gets cut to make room, never dialogue and never framing.

If their lines are British and no accent was specified, keep the words exactly. Their words outrank the American default.

### One scene, one prompt

Seedance renders the full 30 seconds in one generation. One prompt, copy-paste, run once. The cuts live inside it as a shot list. Never hand back separate clip prompts to stitch. Past 30 seconds is a sequel clip, covered at the end of this file.

### Image references

Use the image tag exactly as the user wrote it in their message, for example `@[Image 1](image_1)`. Never rewrite it into a different format. If the user gave no tag, write `the supplied reference image`.

---

# The length cap

Seedance refuses prompts that run too long and does not say that length is the reason. Tested: a 15,700 character prompt was rejected, and the same scene rewritten at 8,300 characters ran. A 10,000 character prompt also ran.

**Target 7,500 to 9,000 characters. Hard ceiling 9,000.** Count every character of the finished prompt, including spaces and line breaks, by running `wc -c` on it before handoff. Never estimate.

State the count in one line under the prompt: `8,420 characters.`

## Budget per block

| Block | Characters |
|---|---|
| Header and quoted-text rule | 400 |
| Pacing and delivery rule | 900 |
| Coverage | 450 |
| Characters | 850 |
| Voices and dynamic | 650 |
| Camera, faces and emotion | 800 |
| Look and audio | 600 |
| Shot list, 10 to 11 shots, with delivery, reactions and beats | 3,850 |
| Physics and negative | 400 |
| Total | about 8,900 |

The shot list is the biggest block on purpose. That is where delivery lives.

## Compression rules

- **Framing is protected.** Every shot keeps a framing line naming shot size and angle, and the coverage block is never shortened below its template. Camera angles and close-ups are protected exactly like dialogue and timecodes.
- **Delivery is protected.** Every delivery note, every reaction line and every timed beat stays. These are what make the scene feel alive, and they are the first thing that disappears when a prompt gets squeezed. Never trade them for character count.
- **Say every instruction once.** If the pacing rule says no silence, the negative block does not list silence five different ways. If the character block says no makeup at wake-up, the shot does not repeat it in full.
- **No continuity block.** The character and look blocks already fix wardrobe, hair and location. A shot mentions wardrobe in three words at most, only where it changes.
- **Short lines, not paragraphs.** Write direction as short declarative lines the way a call sheet reads. No explaining why an instruction matters inside the prompt. The why lives in this skill, not in the prompt.
- **Delivery notes are 20 words or fewer** and cover the voice and the face in behavior, not mood labels. Reaction lines are 15 words or fewer. Beats are one line.
- **Shot blocks carry only what changes.** Line, delivery, reaction, beat, framing, cut. Drop a separate action line when the delivery note already covers what the hands and body do. Never drop the framing, delivery or reaction lines.
- **Audio is one line per location** plus one sentence of perspective and one of mic handling.
- **The negative block is 25 items or fewer** and only lists what is not already stated positively above it.
- **The invented character's flaw list can drop to five flaws** when space is tight.
- **When over the cap, cut in this order:** duplicate negatives, look detail, audio lists, repeated wardrobe in shots, physics detail, separate action lines, flaws down to five. Never cut dialogue, timecodes, the pacing and delivery rule, the coverage block, any framing line, any delivery note, any reaction line or any timed beat.

## If Seedance still refuses a prompt under the cap

Ask the user for the exact error text. Without it, cut the prompt to about 7,000 characters, still keeping every framing line, delivery note, reaction line and beat, and try again before changing anything else.

---

# The skeleton

Fourteen blocks, in this order. The templates below are already compressed to budget. Blocks 1 to 4 and 8 to 14 are close to constant. Blocks 5 to 7 carry the concept.

## Block 1: the header line

```
9:16 vertical, 30 seconds. Candid reality show scene, [who and where, one clause]. Mockumentary handheld, MTV reality style, close-ups throughout. Fast natural banter at real speaking speed, overlapping on interruptions, emotion on every face.
```

## Block 2: the pacing and delivery rule

Goes second, labelled as the most important instruction, because the model weights what is labelled important. Change nothing except the named physical break.

```
PACING AND DELIVERY. The most important instruction in this prompt:
Real conversational speed. Never rushed, never sped up, never recited. They talk like real people: overlapping on interruptions and comebacks, cutting themselves off, restarting words, laughing inside words.
Every line is acted. The voice rises, drops, breaks and trails on the words marked. Faces change on specific words and show real emotion.
Timed BEATS are real moments, 0.5s or 1s, always filled with a visible reaction: a look, a laugh through the nose, a swallow, a jaw setting, a [sip / bite / drag]. Never empty air.
Reactions play on the listener's face under the other person's line.
The clip opens with a mouth already moving. Cuts land mid-word. Cuts to a new location land on a finished thought.
```

Pick the physical break from whatever is in their hands in this setting.

### Timed beats: how the scene breathes

A scene with zero space between lines sounds like two robots reading at double speed. A scene with loose, unfilled pauses goes dead. The fix is the timed beat: a pause with a length and a job.

- **Every beat has a length and something in it.** Written in the shot block as `BEAT 0.5s: he stops chewing, eyes flick up to her.` or `BEAT 1s: she stares at him, then a laugh escapes through her nose.`
- **Beats go on the turns.** After a line that surprises, stings or reveals. Before the comeback that wins the exchange. On the moment someone realizes. Never between two ordinary lines.
- **Three to five beats per 30 seconds,** totalling 2 to 4 seconds. At least one 1s beat on the biggest emotional turn.
- **Everything between beats moves.** Quick exchanges overlap. Nobody waits politely for their turn.

### Phrasings that create dead air

These words with no length and nothing inside them render as frozen faces. Never write them as they are:

- hold on her face before she speaks
- takes a breath and holds it
- loaded and waiting
- a real beat of consideration
- she pauses
- a moment passes
- she lets it land

Rewrite any of them as a timed, filled beat: `BEAT 1s: she lets it land, one eyebrow lifts, lips press together to hold back a smile.` The length and the visible action are what turn a stall into drama.

### The arithmetic that keeps it natural

Pace problems come from the shot list, not the rule. Too many words in a shot and they speed-talk. Too few with no beat and the face does nothing.

**Speaking time per shot = shot length minus any beat inside it.**
**Words per second of speaking time: 2.2 to 3.0.** Under 2.2 with no beat, the shot goes dead. Over 3.0, they sound rushed and robotic.

| Speaking time | Words inside it |
|---|---|
| 1.5s | 3 to 4 |
| 2.0s | 4 to 6 |
| 2.5s | 6 to 7 |
| 3.0s | 7 to 9 |
| 3.5s | 8 to 10 |
| 4.0s | 9 to 12 |

Overlapping lines count once for the time they share, so an overlap buys room without rushing anyone.

Audit every shot before the prompt goes out. Too many words: cut words or lengthen the shot. Too few: add a line, add a filled beat, or shorten the shot.

**No shot runs longer than 4 seconds** unless two people are talking across each other inside it, and even then 5 is the ceiling.

**Most shot blocks end with the next line already started** off screen, mid-word, carrying across the cut. The exception is a shot that ends on a beat, where the cut lands on the reaction.

**Never write a shot with no dialogue and no timed beat.** A shot that only says what a face is doing, with no length and no line under it, is a request for silence.

## Block 3: only quoted text is spoken

Put this right after the pacing rule. Without it the model reads stage directions aloud.

```
Only words inside quotation marks are spoken. Everything else is direction and is never voiced.
```

## Block 4: coverage

Close-ups are the default and they carry the drama. A chest-up floor was too loose and made the scene feel observed from across the room. This block is never shortened.

```
COVERAGE: close-ups dominate and carry the scene. At least two thirds of the shots are close-ups or tight over-the-shoulder close-ups on the 85mm. Never crop the top of a head or the chin.
Change both angle and shot size on every cut, rotating close-ups, over-the-shoulder singles, three-quarter mediums, a low side two-shot, and one wide. Never the same setup twice in a row.
Every punchline cuts to a close-up of the listener's face under the next line.
[Name] is camera left, [name] camera right, always.
```

**The shot plan.** Across 10 to 12 shots: at least 7 close-ups or tight over-the-shoulder close-ups, 2 or 3 three-quarter mediums or low two-shots for the setting, and exactly 1 wide, used where the location itself matters. Close-ups go on every punchline, every reaction and every emotional beat. Mediums and the wide go on movement and reveals only.

**Blocking.** Use two or three areas of the location, keep hands busy with small things, and allow one walking shot at most, motivated by a line.

## Block 5: the characters

One block per person, in caps, plus one line for background people.

**The person matched to a reference image.** One line tying them to the image tag as the user wrote it, then wardrobe, jewelry, hair and makeup as short noun lists. Every noun, no adjectives doing the work.

**Any character invented from nothing must be built imperfect on purpose.** This is the most load-bearing part of the character block. Without it the model returns a rendered model. Write six to eight specific flaws in one or two lines (five when space is tight):

- hair too long at the front, flat on one side like he slept on it
- a nose very slightly off center
- one eyebrow sitting higher than the other
- uneven stubble with a patch missed under the chin
- faint redness across the cheeks and the bridge of the nose
- a small healing shaving nick, a stray freckle, a chipped nail
- shine on the forehead in the light
- clothing wrinkled at the elbows, a collar sitting unevenly

Close it with the standard the model has to hit: `He looks like a real man someone met on an app, not a rendered leading man.` Rewrite that line for whoever the character is, always ending on a comparison to a real person in a real situation.

**Background people** get one line: hands, a forearm, a back moving through frame, face never in focus.

**An invented character must be impossible to confuse with anyone in the reference images.** Build the difference into bone structure, coloring, hair, age and build, then say so in one line: `He is an entirely new person who does not appear in any reference image.`

**Reference image roles** get one line each, especially the negative ones: `[tag] is a lighting and mood reference only. Copy no face from it.`

## Block 6: the voices

One or two lines each, described physically, by what the voice is not, and by its natural speed.

```
VOICES
Her: [texture, pitch, pace], American, [what lives under it].
Him: ordinary speaking voice, American, [pitch and quirk]. Runs words together, laugh breaks. Not smooth, not resonant, not radio-warm.
Both talk at real conversational speed, never hurried.
```

**American accents by default.** Stated in the voices block and once in the negative block, unless the user says otherwise. Write American words too: almost not nearly, pretty not quite, no way not you're joking, do you have not have you got, college not uni, on the weekend not at the weekend, mom not mum. American spelling throughout.

## Block 7: the dynamic

Who wants what, written as physical fact in two or three lines.

```
DYNAMIC
[A wants X. B does not.] [What A's eyes and body do.] [B is warm, fast, at ease.] The tell: she never leans in, she stays where she is while he keeps closing the distance.
```

Every scene needs an imbalance. One person is chasing something the other is not giving: interest, approval, an answer, a confession.

**If they are friends, write the closeness physically.** A hand on an arm, leaning into a shoulder while laughing, taking food off the other's plate. The teasing reads as affection.

**Reactions are real and readable.** Sized like a real person caught off guard: a smile they try to hide, eyes narrowing, a jaw that drops a little then closes, a laugh that escapes. Real, never sitcom. Say this in the prompt in one line.

## Block 8: camera

```
CAMERA
Handheld throughout, reacting slightly late, small natural shake.
Close-ups on an 85mm around f1.4, very shallow depth of field, only the face sharp, background dissolved into [practical] bokeh.
Three slow hand zooms into close-ups: the frame drifts as it tightens, overshoots, corrects, focus hunts briefly. Never smooth or fast.
Frame past [foliage / a doorway / a shoulder].
```

**No snap zooms and no punch-ins.** The drama comes from the imperfection of the move, not its speed. Put the hand zooms on the timed beats and the biggest reactions.

## Block 9: faces and emotion

```
FACES AND EMOTION: every face is alive the whole time. Expressions change on specific words, slightly asymmetric. Laughs start in the eyes and shoulders and break mid-word. Eyes move with the thought, glancing away and snapping back. Irregular blinking. Swallows, lip presses, nostrils flaring, a smile fought down. Real emotion, sized like real life.
```

## Block 10: look

```
LOOK: warm natural color, no grade. [Practical light sources]. [One strong color] against [muted counterweight] and [neutrals]. Photorealistic skin, visible pores, flyaway hair.
```

Say the light, not the grade. One saturated color against a warm base. Grading language pulls it toward a commercial.

| Setting | Practicals | Strong color | Counterweight |
|---|---|---|---|
| Outdoor restaurant at night | Candles, string bulbs | Cobalt dress | Olive greenery |
| Kitchen, evening | Pendant plus window bounce | Red wine bottle | Deep green cabinets |
| Car at dusk | Streetlights passing | Tan leather | Blue dusk outside |
| Nail salon | Ring light plus window | Dusty pink | Chrome and mint |
| Hotel room getting ready | Vanity bulbs, lamp | Emerald slip | Cream and brass |
| Tennis club, late afternoon | Low sun through fence | Red clay | Green windscreen |

## Block 11: audio

```
AUDIO: [setting] ambience runs continuously across every cut: [four layers]. No music, no transition sounds.
Close-ups: voices close and dry, room drops back. Wide: room comes forward. Off-screen voices slightly off-mic.
Soft mic handling bumps on the hand zooms.
```

The perspective and mic handling lines are what make it sound like a crew was there. Compress them, never drop them. The ambience also fills every timed beat, so a beat never plays in dead silence.

## Block 12: continuity

No separate block. Wardrobe, hair, makeup and location are fixed once in the character and look blocks. Add one line only if something changes mid-scene.

## Block 13: the shots

Ten to twelve shots across 30 seconds, none longer than 4 seconds, each inside the words-per-second range from the arithmetic table.

**Numbered with timecodes, always.** Never merge shots into a prose blob. The clock is what controls the pace.

**Dialogue goes first in every shot block,** with its delivery note directly under it. Action happens underneath the line. Action written first gets staged first.

**Every delivery note covers two things:** the voice (speed, pitch, where it breaks, what word it leans on) and the face (what it does and on which word it changes). Add a real-life cue where it fits: a hand, an object, a glance.

**Every shot has a framing line that opens with the shot size,** then the angle, lens, handheld behavior and any zoom: `Framing: close-up, three-quarter from camera left, 85mm, handheld drift.` Check the shot list against the shot plan in block 4 before handoff: count the close-ups.

```
SHOT 4 [0:05.5 to 0:09.0]
HER: "[line]"
Delivery: [voice and face, 20 words or fewer, tied to specific words.]
HIM, off screen, over her last word: "[line]"
Reaction: [the face on camera under the off-screen line, 15 words or fewer.]
BEAT 0.5s: [what fills it.]
Framing: [shot size], [angle], [lens / handheld / zoom], [who is camera left or right].
Cut mid-word on "[word]" / Cut on the reaction.
```

A worked example of the level of delivery required, taken from the proven scene:

```
HER: "I didn't even wanna respond to your text, so," quick sip, "tell me about it."
Delivery: totally sarcastic, totally straight, no smile. She watches him the whole time.
HIM, off screen, starting during the sip: "Wait, rea-"
Reaction: the charm drains out of his face, he is genuinely thrown.
```

**Retime the whole list every time the script changes.** A shot list that no longer matches its dialogue is where rushing and dead air come back.

Close the shot list with the physics line:

```
PHYSICS: nothing moves on its own. [Objects] move only when touched, with real weight. [Fabric] settles with weight. Real-time pacing.
```

## Block 14: the negative

Twenty-five items or fewer, only what is not already stated positively above.

```
AVOID: rushed or sped-up speech, flat recited delivery, blank or frozen faces, empty untimed pauses, line-pause-line rhythm, sitcom mugging, metronome blinking, swapped screen direction, long [sips], snap zooms, smooth mechanical moves, transition sounds, synchronized movement, stiff posture, slow motion, direct-to-camera address, posing, music, visible crew, deep focus, model-perfect faces, broadcast voices, British accents, spoken stage directions, cropped foreheads or chins, repeated angles.
```

---

# Writing the scene

## The conversation

Written from `references/scripting-framework.md`. The whole of it applies. The parts that most often get skipped:

**Enter thirty seconds into a conversation that was already happening.** The first line is a statement, an opinion, a confession, a disagreement, or a story already underway. Never a setup, never a question that exists to introduce the topic.

**One idea per scene, and nobody talks like a marketer about it.** They can discuss it directly. They cannot explain it.

**No interview dynamics.** Statement into counterstatement, story into reaction, opinion into disagreement, confession into judgment, joke into callback.

**The second person has a personality, not a function.** They tease, they take it too far, they call out hypocrisy, they agree for the wrong reason, they say what the viewer is thinking.

**Humor comes from the side.** The joke does not have to be about the topic. Let them land on their outfits, someone across the room, how tired they are, each other.

**One small detour and back.** Real conversations wander for two lines and return.

**Leave the curiosity gap open.** If the viewer finishes knowing exactly how the system works and what it costs, it was over-explained.

**The offer enters in one exchange and the scene moves on.** No benefits, no tone change, and ideally it costs the speaker something in the moment.

**The ending does not need a giant punchline.** A callback, a dry line, a concession, an interruption, someone walking off, or the conversation simply continuing.

Then run the golden test at the end of the framework file. If the answer to any of the three is no, rewrite the conversation before touching the prompt.

## Dialogue

**Budget 65 to 90 words, hard ceiling 95.** The proven scene ran about 95 words across 30 seconds with heavy overlap, and that is the top end. Past it, people speed-talk and the delivery dies. Under about 55, the model invents dead air. Expect a quarter to a third of the words to land on top of somebody else. Then check it shot by shot against the arithmetic table.

How the lines have to be built:

- **Lines overlap on interruptions and comebacks.** Write the overlap into the attribution: `HER, off screen, over his last word`.
- **Lines get cut off mid-word,** marked with a trailing hyphen. Never an em dash, anywhere in the prompt.
- **Restarts and repairs.** "Wait, rea-", "That's- no, that's great."
- **Laughing inside words, not after them.**
- **Fillers as real speech.** "Umm," "okay," "oh my god," "no no," and repeats like "that's fair, that's fair."
- **Turns are wildly uneven.** Two words against twenty.
- **Nobody explains.** The longest line in the proven scene is thirteen words.
- **Mark the word each line leans on.** The delivery note names it, so the stress lands where a real person would put it.
- **Read every line out loud.** If there is no place to breathe wrong in it, rewrite it.

## Delivery direction

Every spoken line gets a delivery note of 20 words or fewer, about behavior, not mood labels. "Excited" or "sad" does nothing. Direct what the voice and face physically do:

- The voice: `sheepish, swallowing the end of "tonight."` / `voice cracks up on "three," she can't finish it.` / `drops almost to a whisper on "him."`
- The speed: `rattles it off, she's said it a hundred times.` / `slows right down on the last three words.`
- The face: `no smile. She watches him the whole time.` / `smile fights through on "fine" and loses.`
- The hands and real-life cues: the sip used as punctuation, a hand coming up and dropping, pushing the plate away.
- What arrives late: `small smile on the last word.`

Every shot where the camera is on the listener gets a reaction line. The reaction is half the scene. A punchline with no face reacting to it does not land.

---

# Working with the user

**Say the counts out loud.** Every time: dialogue words, beats, close-ups, characters. "78 words of dialogue, 4 timed beats, 8 of 11 shots are close-ups, 8,420 characters." If a script is short, ask for more lines rather than padding it with empty pauses or invented dialogue.

**Flag a supplied script that is too long to say at real speed.** If it runs over 95 words for 30 seconds, say it would come out rushed and offer to trim or split it into a sequel. Never cram it.

**Hand over the dialogue on its own** when the user wants to edit or approve it, as a clean block with no camera or delivery notes. Then rebuild the shot list around whatever comes back.

**A supplied script ships word for word.** If something structural forces a change, for example removing a character, do it by deletion only and say exactly which lines were cut.

**Retime everything after any script change.** Never patch one shot and leave the rest of the timecodes as they were.

**When the user pastes a long prompt to rewrite,** rebuild it to the cap rather than editing in place, and keep its camera angles, close-ups and delivery direction. Long pasted prompts are usually already near or over the limit, and adding their notes on top pushes them past it.

# Sequels

To continue past 30 seconds, generate the scene, then prompt a second clip from the finished video.

Open with the continuation header: direct continuation from the uploaded clip, same place, same characters, same conversation, picking up the instant it ended, with what the last frame was doing.

Carry every block across, compressed to the same cap, with the same close-up shot plan and the same delivery depth. Add to the negative: no change of wardrobe, hair, lighting or location from the uploaded clip.

A reaction with no line of its own is allowed in a sequel, either underneath someone else's voice or as a timed filled beat, never on screen for more than two seconds.

---

# Diagnostics

| Symptom | Cause | Fix |
|---|---|---|
| Seedance refuses to run the prompt | Prompt over the length limit | Measure with wc -c, cut to under 9,000 characters using the cut order. If it still fails under the cap, get the error text and cut to 7,000, keeping every framing line, delivery note and beat |
| Rushed, robotic, puppets on 2x speed | Too many words for the time, or delivery notes stripped while shortening | Dialogue 65 to 90 words, 3.0 words per second of speaking time at most, a delivery note on every line |
| No emotion, forced or blank faces | No reaction lines, delivery written as mood labels, or reactions told to be tiny | Reaction line on every listener shot, delivery names what the voice and face physically do and on which word, faces and emotion block present |
| No drama, every line lands the same | No timed beats | Three to five filled beats of 0.5s or 1s on the turns |
| Gaps, turn-taking, line-pause-line | Shots given more time than their dialogue fills, or untimed pauses | Run the arithmetic: 2.2 words per second of speaking time minimum. Add words, add a filled beat, or shorten the shot |
| Scene feels observed from across the room | Too few close-ups, or framing lines dropped while shortening | At least two thirds close-ups, framing line with shot size in every shot, close-ups on every punchline and reaction |
| A pause opens the clip | An establishing beat or an action written before the first line | Open on a mouth already moving, dialogue first in the shot block |
| A pause lands right on a cut | Shot ended on a finished sentence with no beat | End on the next line already started off screen, or end on a timed filled beat |
| One dead patch in an otherwise fast scene | A shot with no dialogue and no timed beat | Never write a shot that only describes a face with no length and no line under it |
| Stage directions read aloud | Missing the quoted-text rule | Add block 3 |
| Foreheads and chins cropped | No framing floor | Add block 4 |
| The invented character looks like a model | Flaw list too short or too vague | Five to eight specific physical flaws plus the real-person comparison line |
| Voices sound like radio | Only described positively | Say what the voice is not: not smooth, not resonant, not radio-warm |
| Zooms look mechanical or snappy | Zoom written as a move instead of an operator | Slow, hand-pushed, drifting, overshooting, correcting, focus hunting |
| Scene feels flat despite good lines | No dynamic block, or no delivery on the lines | Name who wants what and give the body tell, then direct every line |
| Sounds like a studio recording | No audio perspective line | Close and dry on singles, room forward on the wide, off-mic off screen |
| Looks like an ad | Grading language, music, or the mention landing smoothly | Warm natural color no grade, no music, make the mention cost something |
| Cuts feel clean and edited | Cutting at the ends of sentences | Every cut mid-word or on a reaction |
| British accent or phrasing | Stated once or not at all | American in the voices block and in the negative, and check the word choices |
| The scene copies the proven scene's conversation | Craft reference used as a content template | Rewrite the conversation from the scripting framework, keep only the craft blocks |
| Dialogue reads as an interview | Question and answer structure | Statement into counterstatement, story into reaction, opinion into disagreement |
| The user's own lines came back reworded | Word budget or cap applied to a supplied script | Restore their exact words, cut look and audio instead, flag length |

# Checklist

- [ ] Both reference files read before writing
- [ ] The conversation is original, sharing nothing with the proven scene's setting, beats, jokes or questions
- [ ] Opens mid-conversation with a statement, opinion, confession or disagreement
- [ ] No question-and-answer structure anywhere
- [ ] One detour off topic and back
- [ ] The curiosity gap is left open
- [ ] Golden test passed on all three questions
- [ ] One prompt, all 30 seconds, no brackets, no placeholders
- [ ] Any supplied script appears word for word
- [ ] Image tag written exactly as the user wrote it
- [ ] Pacing and delivery rule placed second and labelled most important
- [ ] Quoted-text rule and full coverage block both present
- [ ] At least two thirds of the shots are close-ups, exactly one wide, close-ups on every punchline and reaction
- [ ] Every shot has a framing line opening with shot size and angle
- [ ] Angle and shot size both change on every cut, no setup repeated back to back
- [ ] Every invented face has five to eight specific flaws and the real-person line
- [ ] Reference image roles stated, including what not to copy
- [ ] Both voices described physically, by what they are not, and at real speed
- [ ] Dynamic block names the imbalance and the body tell
- [ ] Three slow imperfect hand zooms into close-ups, no snap zooms
- [ ] 85mm f1.4 shallow separation, background dissolved
- [ ] Warm natural color no grade, one strong color, practicals named
- [ ] Ambient layers, audio perspective line, mic handling line, no music
- [ ] Ten to twelve shots, none over 4 seconds
- [ ] Every shot audited against the words-per-second table: 2.2 to 3.0 per second of speaking time
- [ ] Three to five timed beats, 0.5s or 1s, each filled with a visible reaction, placed on the turns
- [ ] Every spoken line has a delivery note naming voice and face behavior on specific words
- [ ] Every listener shot has a reaction line
- [ ] Faces and emotion block present
- [ ] Every shot ends with the next line started off screen or on a timed beat
- [ ] Dialogue written first in every shot block
- [ ] No untimed stalling phrasings anywhere
- [ ] Screen direction locked and named
- [ ] Reactions real and readable, closeness written physically if they are friends
- [ ] Every cut lands mid-word or on a reaction
- [ ] 65 to 90 words of dialogue, 95 at most, overlapping on interruptions
- [ ] Delivery notes 20 words or fewer, reaction lines 15 or fewer
- [ ] No continuity block, no instruction stated twice, negative block 25 items or fewer
- [ ] Physics line and negative block at the end
- [ ] Somebody voices the audience's objection out loud
- [ ] The offer enters in one exchange and the scene moves on
- [ ] Finished prompt measured with wc -c, under 9,000 characters, with word count, beat count, close-up count and character count stated under the prompt

---

# Reference: references/proven-prompt.md

# The proven prompt

> **Craft reference only. Never a content template.**
> Use this for how a scene is shot, paced, cut, delivered and sounded. Never reuse its conversation, its setting, its beats, its jokes or its lines. Every conversation is written fresh from `scripting-framework.md`. If a draft has a first date, a wine sip as punctuation, a joke that turns out to be a joke, or someone asking what the other does for a living, the wrong layer was copied.

This scene went viral. It is the standard. Read it before writing anything, and lift its phrasings directly rather than paraphrasing them, because these exact words are what produced the result.

The concept changes. The architecture does not.

---

## Why it works, block by block

- **The pacing rule is stated first and labelled as the most important instruction.** Not buried in a list. The model gives weight to what is announced as important.
- **The imperfect character.** The male lead is built out of asymmetries and flaws on purpose. Without that list the model returns a rendered leading man and the scene dies.
- **The dynamic is written as a body fact, not a feeling.** He keeps closing the distance, she never moves. That single line does more than any adjective.
- **Zooms are slow, hand-pushed, and imperfect,** with overshoot, correction, and a focus hunt. Snap zooms were explicitly excluded.
- **Audio perspective changes per shot.** Close and dry on the singles, room forward on the wide, off-mic when the speaker is off screen. This is what makes it sound like a crew was there.
- **Every cut lands mid-word.** Nothing ends on a full stop.
- **Reactions play underneath the other person's dialogue.** The camera holds one face while the other talks off screen, which is how the scene stays wall to wall without losing the reaction.
- **A long negative block.** Used here and it worked. Keep it.

---

## Part one, verbatim

```
9:16 vertical, 30 seconds. Candid reality show scene, two people on a first date at an outdoor restaurant at night. Mockumentary handheld coverage, MTV reality style. Rapid overlapping banter, wall to wall, zero dead air.

THE PACING RULE. This is the most important instruction in the prompt:
No moment in this clip goes more than half a second without someone speaking. Not one. Every line begins before the previous line has finished. They talk on top of each other constantly, cut themselves off, restart words, answer before the question is done, and laugh inside words instead of after them.
Reactions never happen in silence. A reaction always plays underneath the other person's dialogue, which is why the camera holds on one face while the other person talks off screen.
The only two breaks in speech are quick half-second sips of wine, and someone is talking over both of them.
Every cut lands in the middle of a word, never at the end of a sentence.

HER: match @image_1 exactly for face, skin and body. Cobalt electric-blue liquid satin halter maxi from @image_2, deep scooped neckline, bare shoulders, fully open back. Thin gold necklace, small gold hoops, one thin gold bracelet on her right wrist. Hair and makeup: high voluminous messy updo, warm honey and caramel highlights, wispy face-framing tendrils, dewy bronzed glam, sculpted highlight, warm smoky liner, glossy mauve-nude lip.

HIM: an entirely new original face. Attractive in an ordinary way, not model handsome. Around thirty. Dark brown hair slightly too long at the front and flat on one side like he slept on it. Nose very slightly off center. One eyebrow sits a little higher than the other. Uneven stubble along the jaw with a patch missed under the chin. Faint redness across his cheeks and the bridge of his nose. A small healing shaving nick near his left jaw. Slight shine on his forehead in the candlelight. Real skin with visible pores and a few small marks, no smoothing. Navy shirt, top two buttons open, wrinkled at the elbows, collar sitting unevenly. He looks like a real man someone met on an app, not a rendered leading man.

SERVER: background only. Hands, a forearm, a back moving through frame. Face never in focus.

@image_2 is a lighting and mood reference only, for the warm night restaurant look. Do not copy any face from it. Neither character resembles anyone in @image_2.

THE VOICES
Her: warm soft natural, low, slightly husky, American, slow and sweet in rhythm, a smile living under every line.
His: an ordinary real speaking voice, not a broadcast voice. Mid range, slightly nasal on the vowels, a little dry in the throat. He runs words together and swallows the ends of some of them. His laugh breaks instead of coming out clean. Not smooth, not resonant, not radio-warm. He sounds like a guy talking, a little nervous underneath the confidence.

THE DYNAMIC
He is into her. She is not into him. His eyes stay on her and never leave. He leans in and stays leaned in. She is warm, funny, fast, fully present and completely at ease. She holds eye contact easily. What tells you she is not falling for him is her body: she never leans in to meet him, she stays exactly where she is, relaxed, while he keeps closing the distance.

CAMERA
Handheld throughout, reacting late, with constant small natural shake from a real operator holding the camera.
Three times the operator zooms in slowly by hand on the lens. These zooms are slow and imperfect: the frame drifts and shakes as it tightens, the operator overshoots slightly and corrects by hand, the focus hunts for a moment before it catches. Never smooth, never mechanical, never fast.
Shot wide open around f1.4 on an 85mm. Extremely shallow depth of field, only the face in frame is sharp, everything behind dissolved into warm candle and string-bulb bokeh.
Frame from just outside the table, sometimes past foliage or another diner's shoulder.

LOOK
Warm natural color, no grade. Amber candlelight and string bulbs, her cobalt dress as the only strong color against it, olive greenery behind, cream tablecloth. Photorealistic skin on both of them, visible pores and texture, faint under-eye, flyaway hair.

AUDIO
Restaurant night ambience runs continuously and never stops or restarts across any cut: distant traffic hum, other tables talking with cutlery and glass, a shaker from the bar inside, a chair scraping somewhere off screen. No music. No transition sound effects, no swooshes, no whooshes on any camera move or cut.
The audio perspective changes with each shot the way a real camera and boom move with an operator. On tight close-ups their voices are close, dry and intimate and the room drops back. On the wide shot the room comes forward with air around the voices. When someone speaks off screen while the camera is on the other person, that voice is slightly off-mic and less present than the face we are watching.
Faint mic handling on the handheld zooms: a soft low bump or brush of fabric as the operator adjusts grip.

CONTINUITY
One outdoor terrace at night. Same table, cream cloth, two wine glasses, a green bottle, a lit candle, greenery behind. Her dress, updo and glam unchanged in every shot. His shirt unchanged.

SHOTS

SHOT 1 [0:00 to 0:00.5]
Wide. Both of them at the table from behind and to one side, her bare back and the halter tie of the cobalt dress clearly visible, the restaurant alive around them. She is already lifting a hand toward a passing server and already talking. He is turned toward her.
Wide shot from across the terrace, partly past foliage in the foreground. Eye level. Handheld with natural shake, drifting slightly.
HER, already mid-sentence as the clip opens: "one more—"
Cut while she is mid-sentence.

SHOT 2 [0:00.5 to 0:02.5]
Close on her, finishing the order, tapping her empty glass once with a nail, glancing up past camera at the server then straight back to him. His voice starts off screen before she is done.
Close-up. Eye level, slightly from his seat. Handheld, small drift.
HER: "—of these, thank you."
HIM, off screen, starting over her last word: "I'm gonna be honest—"
Cut while he is mid-sentence.

SHOT 3 [0:02.5 to 0:05.5]
On him, already talking, leaning in on his forearms, half smiling, a little sheepish, going for charming. Her voice starts off screen before he has finished.
Over-the-shoulder single on him, her bare shoulder soft in the foreground. Eye level. Handheld with natural shake.
HIM: "—I almost cancelled tonight."
Delivery: sheepish, hoping it lands as charming, swallowing the end of "tonight."
HER, off screen, starting over his last word, completely flat: "I feel ya—"
Cut while she is mid-sentence.

SHOT 4 [0:05.5 to 0:10.5]
On her, already talking, delivering it stone cold with no smile at all. Mid-sentence she lifts her wine and takes a fast half-second sip, sets it straight back down and finishes the line deadpan. His voice comes in over the top of the sip.
Close-up. Eye level. Slow shaky handheld zoom in across the line, drifting, overshooting and correcting.
HER: "—I didn't even wanna respond to your text, so," quick sip, "tell me about it."
Delivery: totally sarcastic, totally straight, no smile, no wink. The sip is fast and casual, half a second, used as punctuation rather than a pause. She watches him the whole time.
HIM, off screen, starting during the sip: "Wait, rea—"
Cut while he is mid-word.

SHOT 5 [0:10.5 to 0:14]
On him, genuinely thrown, the charm gone out of his face. She cuts in over him twice before he can finish anything. Four lines land in three and a half seconds and they overlap the whole way.
Tight close-up. Eye level. Handheld with natural shake.
HIM: "Wait, rea—"
HER, off screen, over him, flat: "No no, I'm kidding."
HIM, overlapping her: "Oh my—"
HER, off screen, over him again, now laughing: "I'm kidding! You should see your face."
Cut on him breaking into a laugh.

SHOT 6 [0:14 to 0:17.5]
On her, laughing, delighted with herself, one hand briefly coming up and dropping. Stay on her the whole shot while he talks off screen. Three lines overlapping.
Close-up. Eye level. Handheld, small drift.
HIM, off screen, laughing, a real one that breaks: "You fully had me."
HER, quick, over him, grinning: "A little bit."
HIM, off screen, immediately over her: "A lot. That was mean."
Cut on his laugh.

SHOT 7 [0:17.5 to 0:19.5]
On him, still laughing, rubbing his jaw, completely charmed, going straight into the question with no pause at all.
Medium close-up. Eye level. Handheld drifting slightly.
HIM: "Okay, so what do you do?"
Delivery: laughing into the first word, then easy and genuinely curious, no gap between the laugh and the question.
Cut on her already reaching for her glass.

SHOT 8 [0:19.5 to 0:24]
On her, already mid-motion with the glass. A fast half-second sip, glass down, and she answers immediately with her eyes on him the whole time. A small warm smile arrives on the last word. A loose strand of hair moves against her cheek and she leaves it.
Medium close-up, candle glowing in the lower foreground. Eye level from his seat. Slow shaky handheld zoom in across the line, drifting, correcting, focus hunting once and catching on her eyes.
HER, straight after the sip with no gap: "Umm, I teach people how to build their personal brands with AI."
Delivery: easy and fluent, a line she has said a thousand times. She stays on him the whole way through. The smile lands at the end.
HIM, off screen, starting before she finishes, laughing into it: "Ohhh. Like those—"
Cut while he is mid-word.

SHOT 9 [0:24 to 0:27]
On him, mid-laugh, restarting his own sentence, finishing the jab. She fires back off screen immediately over the top of him.
Tight close-up. Slight low angle. Handheld with natural shake.
HIM: "—like those fake AI avatars?"
HER, off screen, immediately over him: "No! Oh my god, no."
Cut on his grin widening.

SHOT 10 [0:27 to 0:30]
On her, laughing and caught out, one hand briefly to her mouth then dropping. She concedes it with her face while he talks over her, and throws one word back through the laugh.
Close-up on her holding through the whole shot. Eye level. Slow shaky handheld zoom in, drifting and correcting.
HIM, off screen, delighted, quick: "That's exactly what one of them would say."
HER, laughing over the end of his line: "okay that's fair, that's fair"
End on her face, still laughing, about to answer.

Respect natural laws of physics. Nothing moves on its own. Glasses, cutlery and chairs move only when a hand touches them, with real weight. The satin folds and settles with weight and ripples only when she moves. Natural real-time pacing.

Negative: no silence longer than half a second at any point, no gaps between lines, no waiting for turns, no line-pause-line rhythm, no long sips, no fast or snap zooms, no smooth mechanical camera moves, no transition sound effects, no synchronized movement between the two characters, no stiff posture, no robotic timing, no sped up motion, no slow motion, no direct-to-camera address, no posing, no music, no visible crew, no deep focus, no symmetrical or model-perfect male face, no smooth broadcast voice, no moment where he looks away from her, no resemblance to anyone in the mood reference image.
```

---

## What part two added

The sequel prompt continued the same scene from the uploaded clip and introduced four rules worth carrying into every scene from now on.

**1. Only quoted text is spoken.** Stated as a CRITICAL line near the top:

> only text inside quotation marks is spoken aloud. Every other sentence is camera and performance direction and must never be voiced by anyone.

**2. A framing floor.** Part one used tight close-ups and the sequel corrected for it:

> never frame tighter than a chest-up medium close-up. Always keep shoulders and some of the table, the candle or the room in frame. Never crop the top of a head, never fill the frame with only a face. Change both the angle and the shot size on every single cut, rotating through over-the-shoulder singles, three-quarter medium shots, chest-up close-ups, a low two-shot from the side of the table, and a wide from across the terrace. Never repeat the same setup twice in a row.

**3. A silent reaction is allowed, but only under someone's voice.** His face falling while she keeps talking off screen, and never on screen for more than two seconds.

**4. Prose shot form.** Part two dropped the numbered timecode format and wrote the shots as flowing prose, each new setup introduced with a cut trigger: "Cut on her starting to smile to a handheld chest-up close-up on her from his side of the table." Both forms work. Numbered with timecodes gives tighter control of the clock. Prose flows better and reads more like direction.

**5. The continuation header.** Direct continuation from the uploaded clip, same table, same characters, same night, same conversation, picking up the instant it ended, plus a negative line covering no change of wardrobe, hair, lighting or location.

**6. The offer moment.** She pivots from flirting to mentioning the webinar and it visibly kills the moment. His grin dies while she keeps going, unaware. The offer costing her something is what made it funny instead of an ad.


---

# Reference: references/scripting-framework.md

# Scripting: the overheard conversation

How to write the actual conversation. `proven-prompt.md` governs how a scene is shot, paced and delivered. This file governs what the people say, and the two never mix. Read both before writing.

## The goal

The camera accidentally caught two people in the middle of a genuinely interesting conversation. The scene IS about a specific marketing, business, AI, content or entrepreneurial idea. It must never feel like content built to teach or sell that idea.

The viewer should think "wait, I want to hear the rest of this," not "oh, this is an ad." Curiosity comes from the conversation itself.

**Runtime.** The framework is written for 45 to 60 second scenes. Seedance renders 30 seconds per generation, so a scene that long is a 30 second clip plus a sequel clip continued from it, split on a natural moment. Write the whole conversation first at its real length, then decide where it breaks. Do not compress a 60 second conversation into 30 by cutting the wandering and the throwaway lines, because those are what make it feel overheard. Cut an idea instead.

---

## Rule 1: we are eavesdropping

Never set the topic up for the audience. The conversation existed before the camera arrived. Start thirty seconds into an imaginary conversation.

The opening line can be a statement, a counterstatement, a confession, a continuation, an opinion, a story already underway, a disagreement, or an observation. Shapes that work:

- "I've basically stopped going to them."
- "No, that's exactly why I think everyone is doing it wrong."
- "I haven't filmed anything in almost three weeks."
- "...which is why I finally just built the whole thing around my avatar."
- "So he looks at me and goes, wait, that's not actually you?"
- "No. Creating more content is literally the last thing she needs."

We do not need to know what came before. Missing context makes it feel more authentic.

## Rule 2: the topic is the conversation, not the pitch

One specific idea per scene. Why most networking is useless. Why an avatar without a system solves nothing. Why someone is getting views but no customers. Why consistency was never the problem.

They are allowed to talk about these things directly. What they cannot do is start speaking like marketers.

Bad: "That's why my program teaches entrepreneurs how to implement an AI content system."

Good: "You built all of that yourself?" / "Eventually." / "Eventually?" / "I wasted three months making my avatar look pretty before realizing she had nothing intelligent to say."

## Rule 3: one shares, the other adds

Never interview dynamics. No question, answer, question, answer, objection, explanation. That reads as scripted instantly.

Use instead: statement into counterstatement, story into reaction into related story, opinion into disagreement, observation into tease, confession into judgment, claim into challenge, joke into callback.

One person can run two or three sentences before the other responds. People do not perfectly alternate.

## Rule 4: humor comes from the side

Do not set up jokes constantly. Funny things happen around the subject. If the topic is AI avatars, the joke does not have to be about AI. They can land on dating, their outfits, someone across the room, how tired they are, something embarrassing, their friendship, or something physically happening in the scene. This makes the world bigger than the message.

## Rule 5: let them wander, but not far

Real conversations leave the subject and come back. Topic, then a dating joke, then a reaction, then back to the topic. One small detour per scene is what makes written dialogue feel lived in.

## Rule 6: do not over-optimize every line

Not every sentence has to teach, advance, joke or explain. Some lines exist because humans talk that way: "Exactly." "No, I know." "That's what I'm saying." "Okay, fair." "Whatever." "You're ridiculous." A look. A laugh. Someone keeps eating. These carry the rhythm.

---

## The thread

Not an arc, a thread.

**1. Enter mid-thought.** Specific enough to be interesting, incomplete enough to create curiosity.

**2. Let them have an actual opinion.** Interesting people have opinions. "I think that's completely backwards." "I stopped doing that." "That's such a waste of time." "I learned that the expensive way." "See, that's where everyone loses me." Strong opinions create curiosity without manufactured hooks.

**3. Make it personal.** Move from the idea into something that happened to them. Not "AI avatars let entrepreneurs scale content" but "I used to lose an entire Tuesday filming." / "Every Tuesday?" / "Hair, makeup, lights, the whole production." / "And now?" / "Now Tuesday has been returned to society."

**4. Let the second character interpret it.** They do not exist to ask convenient questions. They have a personality. They might misunderstand, call out hypocrisy, make fun of the speaker, agree for a completely different reason, challenge the logic, relate it to themselves, notice something ironic, say what the audience is thinking, or take the idea too far.

> "I haven't filmed in a month."
> "Meanwhile you're posting more than me."
> "That's because AI me has discipline."
> "Can she go to Pilates for you too?"
> "Working on it."

That is banter.

---

## The invisible structure

Underneath the casual conversation, quietly build **idea, experience, insight, proof, curiosity.** Never label these beats and never let a character narrate them.

Nobody pitches anything, and by the end the second character wants to know more, which means the viewer does too.

## The curiosity gap

Do not answer everything. If the viewer finishes knowing exactly what the system is, how it works, what tools are involved, what it costs and why they need it, it was over-explained.

They should be left with "how is she doing that," "what's her system," "I have this exact problem," "I want what she has."

## How the offer enters

It enters because the conversation earned it, in one exchange, then the scene moves on.

- "You should literally teach this." / "I do."
- "Can you just show me how you built yours?" / "That's literally what I'm doing Thursday."
- "Okay, I need whatever you have." / "You're exactly why I made the program."

Do not explain it, do not list benefits, do not change tone. The CTA lives outside the scene.

Best of all is when the mention costs the speaker something in the moment, a killed flirtation, a friend going quiet, a joke at her expense. That is what stops it reading as an ad.

## Chemistry

Write relationships, not characters. They have history. They interrupt, they know each other's habits, they tease without explaining the joke, they reference things the audience was not there for.

> "Don't."
> "I didn't say anything."
> "Your face did."

Three lines, a whole friendship.

## The realism filter

Delete any line that exists because the audience needs information. Especially:

"So how does that work?" / "Tell me more." / "What do you mean?" / "Why is that important?" / "So you're saying..." / "Can you explain?"

A real friend says: "That's insane." / "Okay, but..." / "Absolutely not." / "See, THAT I would do." / "You've lost me." / "Wait, back up." / "That's actually smart." / "You're so annoying."

---

## Performance rhythm

Write these in and let the shot list carry them. We are observing people, not blocking a commercial, so do not choreograph every gesture.

- half-finished sentences
- small laughs inside dialogue, not after it
- people speaking while eating, drinking or walking
- eye contact breaking naturally
- someone checking their phone
- interruptions and overlapping reactions
- a character starting a new thought before the last one resolves
- a facial expression carrying a moment instead of a line, always underneath the other person's voice and never in a gap
- small physical actions unrelated to the conversation

One reconciliation with the pacing rule: when an expression is better than a line, the expression still plays underneath the other person's voice. The face gets the moment, the scene never goes quiet.

## Punchlines

Lines have to land. The punch comes from character and timing, not from a setup and a topper.

- **Specificity is the joke.** "Tuesday has been returned to society" is funnier than "I saved time." Name the exact thing.
- **Flat topper.** The funniest line is delivered like the least funny one. No wink, no smile, no lift at the end.
- **Escalate then undercut.** One person takes it too far, the other lands one word on it. "Working on it."
- **Callback.** Something from the first ten seconds returns at the end, changed slightly.
- **The tease that concedes.** Getting caught out and admitting it lands better than winning: "okay that's fair, that's fair."
- **Turn the joke on the speaker,** never on the viewer and never on the audience's objection. The skeptic in the scene is right and gets to be right.

## The ending

Do not force a giant punchline into the last line. Strong endings are a callback, a dry observation, a sarcastic response, a subject change, a facial reaction, an interruption, a small insult between friends, someone walking away, or the conversation simply continuing.

The camera can leave before the conversation ends. That is what makes it a moment rather than a skit.

---

## The final command

Given any topic, message, setting and characters: do not write a skit about the topic.

Imagine these two genuinely care about it and were already discussing it before the camera arrived. Enter at the most interesting moment. Let personality, opinions, personal experience, disagreement, teasing and small tangents carry the information. Hide the structure underneath the conversation. Create curiosity instead of explaining. Make the viewer feel like they are overhearing something they were not supposed to.

## The golden test

Before delivering, ask three questions:

1. If the CTA and the brand were removed entirely, would anyone still want to listen to these two talk?
2. Did I learn something interesting about the topic without feeling taught?
3. Does it feel like the conversation started before the video and continues after it?

Any no means rewrite.
