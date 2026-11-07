---
name: "brand-design-system-builder"
description: "Walks a creator step by step through building their brand guidelines deck and design system in Claude, pulling from their Notion Content OS, then uses it first for every design."
---

# Brand Design System Builder

This skill builds the user's brand guidelines deck and turns it into a design system in Claude. It walks them through every step, asks for what it needs and runs the same quality checks every time. After that, Claude uses their brand first whenever they ask for a design.

Two jobs:

- **Job A, set up the brand.** The guided build: settings check, gather, interview, style read, brand deck, design system, default, memory, test. It ends with three things: a brand guidelines deck (a Slides artifact), a design system (a Design System artifact) and their rules saved to memory.
- **Job B, design with the brand.** Every later request for a carousel, lead magnet, thumbnail, landing page, webinar deck or any visual loads their design system FIRST, then designs.

**Which job:** list the user's artifacts of type "Design System" first.

- If they have one and want a new design, go to Job B.
- If they have several, ask which one is their brand. Tell them to delete or rename the others so Claude always picks the right one.
- If they have none, or they asked to build or rebuild their brand, run Job A.

---

## How to run Job A

The user should never need to paste a prompt. You lead every step.

- **Open the walkthrough.** Start with a short map of the 8 steps and roughly how long the whole thing takes (about an hour). Then start Step 0.
- **Name each step.** Open every step with "Step X of 8: <name>" and one line on what happens. End each step by saying what they now have and what comes next.
- **Wait at checkpoints.** Wait for the user only at the checkpoints marked **CHECKPOINT**. Between checkpoints, keep working.
- **One chat.** Run everything in one conversation so nothing they told you is lost.
- **Never invent.** No facts, numbers, results, quotes, testimonials, fonts or colors they didn't give you or that you didn't pull from their material. If something is missing, ask.
- **Write like a person.** Plain words. No em dashes.

### Step 0. Settings check (1 minute)

Confirm these before anything else. Check what you can yourself: try listing artifact types, and check whether memory tools exist. Ask the user only about what you can't check.

- **Paid Claude plan:** Pro, Max, Team or Enterprise.
- **Code execution and file creation** is on, in Settings > Capabilities.
- **Memory** is on, so their rules carry into new chats.
- **Artifacts:** the Slides and Design System types are available to them.

If something is missing, say exactly which setting to turn on and wait. If the Slides type isn't available, tell them you'll build the deck as a hand-built HTML page instead. If the Design System type isn't available, tell them the design system will be a single brand page artifact, and that memory will point to it.

### Step 1. Pull what Claude already knows (automatic, 2 minutes)

Before asking anything, gather what's already available so the interview only asks for gaps.

- **Notion / Content OS.** If Notion is connected, search it for their Content OS and read what exists:
  - **Brand Compass** (or any brand strategy page): niche, audience, positioning, brand pillar, voice, banned words.
  - **Knowledge Hub:** frameworks and signature methods.
  - **Digital Products Hub / offer ladder:** offers, lead magnets, CTA keywords.
  - **Visual Assets:** avatar character sheets, photo libraries, existing logos, colors or fonts.
  - **Content Library:** their best-performing posts.
- **Other sources.** Also use memory or past chats about their brand, and any connected Drive folder of photos.
- **Instagram (optional).** If an Instagram scraper is connected (for example Apify), offer to pull their top posts by engagement as style references.

Then tell them, in a short list, what you found and where you found it. Mark anything you inferred as a recommendation, not a fact. For example, "Your Brand Compass says your pillar is X. I'd recommend a deep green and cream palette because your photos are warm and neutral. Confirm or change it."

If nothing is connected, say so in one line and move on. The interview covers it.

### Step 2. Gather and interview (15 minutes) **CHECKPOINT**

Send ONE message with every question that Step 1 didn't answer. Mark the questions Step 1 already answered as "confirm" rather than asking them fresh.

1. **Who they are:** name, handle, what they sell, who buys it, the transformation they promise.
2. **The brand pillar:** the one idea the brand stands for.
3. **5 to 10 posts they love:** screenshots or links of carousels or covers. These are their best performers, or posts whose style they want. These teach Claude their look.
4. **15 to 30 photos of them or their avatar:** newest first, on plain backgrounds (a wall, sky, a studio). Tell them busy backgrounds don't cut out cleanly.
5. **Existing fonts, colors or a logo**, if they have them. If not, you'll pull them from their posts and photos.
6. **Formats they make:** carousels, lead magnets, Substack or YouTube thumbnails, webinar slides, web pages.
7. **Voice rules:** words they always use, banned words, things they never want to see.
8. **Offers and CTAs:** comment keywords, the lead magnet, the paid offer.
9. **Their design do's and don'ts, in their own words.** Give examples to prompt them: never put words on my face, no busy photos behind text, always mix bold and italic in headlines.

Wait for the answers and files. If they skip something essential (photos, reference posts or the pillar), ask again. Never guess.

### Step 3. Style read (5 minutes) **CHECKPOINT**

Study the reference posts and photos, then write a SHORT style read they can correct. Cover:

- **Title size and placement:** what share of the slide the title takes up.
- **How much of the slide they take up:** and where their face sits.
- **Typefaces:** name the closest free Google Fonts for display, body, script and typed notes.
- **Photo treatment:** cutout on a solid color, full bleed, or polaroid.
- **Recurring elements:** circled words, arrows, arches, stickers, frames, icons.
- **A proposed palette:** 6 to 10 named colors with hex codes, drawn from their posts and photos.
- **5 proposed signature visual moves**, each in one line.

Ask them to confirm or correct it, for example "my covers are always cutouts on a solid color" or "I never use script fonts". Everything after this builds on it, so don't move on until they agree.

### Step 4. Build the brand deck (20 to 30 minutes, 2 to 4 rounds) **CHECKPOINT**

Create a Slides artifact at 1920x1080 with exactly these 23 slides, in this order.

**General rules for the deck:**

- Every slide is mostly visual, never a wall of text.
- Every slide uses their real photos, their palette, their fonts and their elements.
- Never repeat a photo anywhere in the deck.
- Every slide has a masthead (their name on the left, the section label on the right, a thin rule) and at least one element or icon.

**The 23 slides:**

1. **Cover:** a photo collage, the pillar as the headline with mixed roman, italic and script, one circled word and a short ticker of the brand's themes along the bottom.
2. **Contents:** the sections as a menu of numbered cards with icons, plus a photo.
3. **Brand pillar:** the one idea as a row of arches or pillars (what it stands on), with a hero photo.
4. **Signature moves:** the 5 visual moves, each shown as a mini slide with a one-line caption.
5. **Palette:** named color circles with hex codes and roles (grounds, accents, text), plus a pairing rule.
6. **Colors from the photography:** two photos, each with the swatches pulled from it.
7. **Typography:** each typeface on a tile, with its role and use, plus one headline mixing them.
8. **Anatomy of a slide:** one real cover with numbered callouts for the title, note, circled word, cutout, arch and swipe arrow.
9. **Art direction:** realism rules for their photos or avatar (light, lens, skin, settings), shown with polaroids.
10. **Styling:** wardrobe ALWAYS and NEVER cards next to two photos.
11. **Campaign:** one concept shot as a full set (cover, close-ups, motion), with a flow from concept to carousels.
12. **Graphic elements:** a sticker sheet of circles, scribbles, arrows, sparkles, tape, polaroids, buttons, tags and tickers in their colors.
13. **Carousel examples:** a cover, a value slide and a CTA slide.
14. **Sales funnel:** post, comment, DM, lead magnet, offer, as connected cards beside a phone mockup.
15. **Web and webinar:** a website hero and a webinar title card.
16. **Title slide templates:** 3 variations, all cutouts on a solid color with the huge title behind the head:
    - the two-liner
    - the reveal
    - the arc
17. **Title and body set:** one title slide and three body slides that match it, built from their own past post if they shared one they want kept.
18. **Body slide templates:**
    - the numbered tip
    - the statement (no photo, one circled word, three icons)
    - the framework (numbered boxed steps)
19. **CTA slide templates:** 3 variations:
    - comment keyword with an arch-framed photo
    - save and send
    - the lead magnet cover
20. **16:9 thumbnail templates:** Substack and YouTube, with the cutout on a flat color, a huge title and the head in front of the biggest word.
21. **Voice:** a hook, a note and an ask in their voice, plus their banned words as crossed-out tags.
22. **Do's and don'ts:** each of their rules as a small DON'T or DO diagram, never just text.
23. **Closing:** a checklist of what every piece must have, beside a photo.

**Photos.** Prepare them before building:

- Remove backgrounds for covers and templates (for example rembg with a human or portrait model).
- Clean the edges: keep the largest subject, and trim halos and colored fringe.
- If a cutout still has a halo, pick another photo.
- Bake each cutout into a PNG cropped to its card, so it never spills outside the frame.
- Put each cutout on a ground color that contrasts with the outfit.

**Quality checks.** Render every slide and look at it before showing anything. Fix and re-render until all of these pass:

- No word sits on a face. Big title words go behind the head, in the negative space.
- No text is boxed away from the image, and there is no plain overlay text.
- No busy photo sits behind text.
- All text is at least 28px inside every card and at least 64px inside the slide edges. Nothing overflows or gets clipped.
- Text blocks share left edges. A big numeral spans exactly from the cap top of the first line beside it to the bottom of the last line. Measure the ink of the letters, not the text boxes.
- Fonts actually loaded. A generic fallback serif means the fonts are broken.
- No photo repeats.
- There are no em dashes and no copy they didn't give you.

Then share the deck and ask for feedback slide by slide.

**Handling feedback.** Teach them how to give feedback that sticks:

- Point at the exact spot, say what's wrong and say why.
- Show them two or three "instead of / say" examples. For example, instead of "fix the spacing", say "too much space between the subtitle and the title, pull them closer."
- When a fix should apply to every future design, they can say "make that a rule". Add it to the hard rules list you'll put in the design system.

Expect 2 to 4 rounds of changes. Tell them that's normal, and that it's where the deck becomes theirs. Move on only when they say they're happy with the deck.

### Step 5. Create the design system (2 to 5 minutes)

Create an artifact of the Design System type from the approved deck. Name it after their brand, for example "<Name> Brand". Its README must include:

- **Hard rules** at the top, written as checks to run against every design: the defaults below, plus every rule they added in feedback.
- Who it speaks to, and the creative direction.
- The 5 signature moves.
- The palette with hex codes and roles, the fonts with their roles and sizes, and any accessibility notes. For example, use a darker accent for small text.
- Template descriptions: title, body, CTA, thumbnail, and lead magnet pages if they make them.
- Voice rules and banned words.
- A link to the brand deck, and an instruction to read the deck's template slides before designing.

Also add tokens (colors, type styles) and components where the Design System type supports them.

### Step 6. Make it the default (1 minute) **CHECKPOINT**

You can't change this setting for them. Tell them exactly what to do: open the design system and set it as their **default** in its settings, so every new design starts from their brand. Tell them not to skip this, and wait until they confirm.

### Step 7. Save to memory (automatic, 1 minute)

If memory tools exist, save these yourself:

- "Whenever I ask you to design anything (carousel, lead magnet, thumbnail, landing page, webinar slides), use my <Name> Brand design system first and follow my do's and don'ts every time."
- The design system's name and link.
- The brand deck's link.
- Their hard rules.

Tell them what you saved. If memory is off or unavailable, ask them to turn it on and paste: "Remember: whenever I ask you to design anything, use my brand design system first, and follow my do's and don'ts every time."

### Step 8. Test it (5 to 10 minutes)

Ask them to open a NEW chat and paste one line with their own copy: "Design a carousel from this copy: [their copy]". Don't attach anything.

It should come out in their brand without them attaching anything. If it doesn't:

- Check that Step 6 is done (the design system is set as default).
- Check that Step 7 is done (memory is on and the rule was saved).

### Finish

End with:

- **What they have:** the deck link, the design system link, and what's in memory.
- **Everyday prompts:**
  - A carousel: "Design a carousel from this copy. The CTA keyword is [KEYWORD]: [COPY]".
  - A lead magnet: "Design my lead magnet from this outline: [OUTLINE]".
  - A thumbnail: "Make a 16:9 thumbnail for this title: [TITLE]".
  - A landing page: "Design a landing page for [OFFER] using my brand."
  - A webinar deck: "Build my webinar deck from this outline: [OUTLINE]".
  - A new template: "Add a new body slide template to my brand deck, based on this post I like." (attach it)
- **What to expect:** clean, on-brand designs that get them posting more. Not senior-designer polish on the first try, but better with every rule they add.

---

## Job B: design with the brand (every request)

1. **Load first.** Read the design system README (hard rules especially) and the deck's template slides before writing anything. Re-read the user's stored design preferences.
2. **Ask only for what's missing:** the copy, the job of the piece, the CTA keyword and photos. Use their copy word for word, and never add lines they didn't write.
3. **Pick templates** from the deck: a title template for the cover, body templates for the middle and a CTA template for the end. Adapt the structure to the topic. Not every carousel is a numbered list.
4. **Prepare photos** as in Step 4: cutouts for covers, clean edges, baked to the card, on a ground color that contrasts with the outfit.
5. **Build.**
   - Sizes: 1080x1350 for Instagram, 1920x1080 for 16:9, US Letter for PDF lead magnets.
   - Carousel slides carry the @handle at the top, a page count at the bottom left and a swipe arrow at the bottom right.
   - Lead magnets: an editorial cover with a cutout, alternating dark and light pages, copy-and-paste prompt boxes, icons in circles, numbered steps and a final checklist. Lots of graphics, never text-heavy.
6. **Check before showing**, every time. Render the pages and run the Step 4 quality checks.
7. **Deliver.**
   - PNGs plus a contact sheet for posting.
   - A Design canvas artifact (one artboard per slide) for editing in Claude.
   - For Canva, a PDF with live text and embedded static fonts (Canva opens it as an editable design). Never use Canva's own generator to reproduce a design, because it redesigns it and loses the fonts.
8. **Push back** in one line on copy that hurts conversion (unbackable claims, too much text on a slide), with the stronger version.
9. **Learn.** When they say "make that a rule", add it to the design system's hard rules and to memory.

## Default hard rules (every brand, unless the user overrides them)

- Never put words on top of a face.
- Covers and title slides use a cutout on a solid color, with the huge title in the space around the subject and the head in front of the biggest word.
- Big editorial words go behind the subject, in the negative space.
- No busy photos behind text.
- Never box the text in a section separated from the image, and no plain overlay text.
- Every slide has structure: sections, rules, numbered steps, borders or arches.
- Always use elements and icons: circled words, hand-drawn arrows, stars, arches, numbered circles and line icons.
- Mix roman, italic and bold inside headlines, plus a script note.
- Align to a grid, and keep everything inside the margins.
- Editorial feel always: mastheads, numerals, rules and white space.