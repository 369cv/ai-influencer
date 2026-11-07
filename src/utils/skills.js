// Skills: reusable instructions you bring to Muse Studio (the same idea as a
// SKILL.md file). They're used as the system prompt when Claude drafts ideas,
// hooks, scripts and captions in Plan and Content, and prompts in Studio.
//
// uses: ideas · caption (Plan, Content) · photo · video (Studio prompt step) ·
//       reference (shown and exportable, never run in the app)
// connectors: ids from connectors.js the skill's output is made for.
import { readJSON } from './localJson'

// The skill library (src/skills/*.md, the creator's own SKILL.md files) loads
// only when a skill is run, customized or exported.
const LIBRARY_FILES = import.meta.glob('../skills/*.md', { query: '?raw', import: 'default' })

export const SKILLS_KEY = 'muse_skills'

// Built-in starters. Copy one to edit it; your own skills sit next to these.
export const BUILTIN_SKILLS = [
  {
    id: 'builtin_ideas', builtin: true, enabled: true, uses: ['ideas'],
    name: 'Content idea generator',
    description: 'Short-form content ideas that fit the influencer and the niche.',
    instructions: `You plan short-form content (Reels, TikTok, Shorts) for an AI influencer.
Return 5 ideas. For each: a one-line title, the hook (first 2 seconds), the format (talking head, POV, GRWM, b-roll montage, carousel…), and why it fits this influencer.
Favour ideas a viewer would save or share. Keep each idea under 50 words. No hashtags.`,
  },
  {
    id: 'builtin_hooks', builtin: true, enabled: true, uses: ['ideas', 'caption'],
    name: 'Hook writer',
    description: 'Scroll-stopping first lines for a video or post.',
    instructions: `Write 8 hooks for the post described. Each hook is spoken or shown in the first 2 seconds, is under 12 words, and opens a question the video answers.
Mix styles: curiosity gap, bold claim, relatable pain, "POV:", list ("3 things…"), contrarian. Return a numbered list only.`,
  },
  {
    id: 'builtin_caption', builtin: true, enabled: true, uses: ['caption'],
    name: 'Caption + hashtags',
    description: 'Platform-ready caption with a CTA and a short hashtag set.',
    instructions: `Write one caption for the post described, in the influencer's voice.
Structure: hook line, 1–3 short lines of value or story, a call to action that invites a comment or a save, then 5–8 relevant hashtags on the last line.
Under 150 words. Plain text, no markdown, no quotation marks around the caption.`,
  },
]

const lib = (file, name, description, uses, connectors, extra = {}) =>
  ({ id: `lib_${file}`, file, builtin: true, library: true, enabled: true, name, description, uses, connectors, instructions: '', ...extra })

export const LIBRARY_SKILLS = [
  lib('character-concept-builder', 'Character concept builder', 'Step 1. Decide who to create, then write a GPT Image 2 prompt for a front-facing anchor face on white.', ['photo'], ['higgsfield', 'claude']),
  lib('character-angle-sheet', 'Character angle sheet', 'Step 2. The same face from front, three-quarter, profile and more, as GPT Image 2 prompts.', ['photo'], ['higgsfield', 'claude']),
  lib('consistent-character-video', 'Consistent character video', 'Step 3. Image-to-video prompts (Seedance, Kling) that keep the character identical across clips.', ['video'], ['higgsfield', 'kling', 'claude']),
  lib('short-form-content-writer', 'Short-form content writer', 'Step 4. Hooks, 15–60s scripts, and TikTok and Instagram descriptions and hashtags.', ['ideas', 'caption'], ['claude', 'instagram', 'tiktok']),
  lib('fashion-influencer', 'Fashion influencer walk', 'Avatar photo + outfit photo → one Seedance prompt for a candid paparazzi-style street walk.', ['video'], ['higgsfield', 'claude']),
  lib('grwm-reels', 'GRWM reels', 'Avatar + outfits + setting → one Seedance get-ready-with-me prompt, with an optional snap transition.', ['video'], ['higgsfield', 'claude']),
  lib('yap-video', 'Yap video', 'Base image + script → one Seedance prompt for a 30-second raw talking video (selfie, tripod, car).', ['video'], ['higgsfield', 'claude']),
  lib('reality-scene', 'Reality scene', 'Candid reality-TV conversation scenes as one 30-second Seedance prompt under 9,000 characters.', ['video'], ['higgsfield', 'claude']),
  lib('cinematic-broll-director', 'Cinematic b-roll director', 'One reference image → a 16-shot, 30-second cinematic b-roll prompt for Seedance.', ['video'], ['higgsfield', 'claude']),
  lib('brand-design-system-builder', 'Brand design system builder', 'Builds brand guidelines and a design system from your Notion Content OS.', ['ideas'], ['claude', 'notion']),
  lib('talking-head-reel-editing', 'Talking-head reel editing', 'Remotion + ffmpeg editing workflow for talking-head Reels. Reference only: it runs in Claude Code, not in the browser.', ['reference'], ['googledrive', 'capcut'], { enabled: false }),
]

// Fills in a library skill's instructions from its SKILL.md (frontmatter stripped).
export async function loadSkill(skill) {
  if (!skill?.file || skill.instructions) return skill
  const load = LIBRARY_FILES[`../skills/${skill.file}.md`]
  if (!load) return skill
  const text = await load()
  return { ...skill, instructions: parseSkillMarkdown(text, skill.name).instructions, markdown: text }
}

export function readSkills() {
  const mine = readJSON(SKILLS_KEY, [])
  const overridden = new Set(mine.map(s => s.basedOn).filter(Boolean))
  return [...BUILTIN_SKILLS, ...LIBRARY_SKILLS].filter(b => !overridden.has(b.id)).concat(mine)
}

// Skills made for a connector (shown on its page in Settings → Connections).
export const skillsForConnector = (id, skills = readSkills()) => skills.filter(s => s.connectors?.includes(id))

export function skillsFor(use, skills = readSkills()) {
  return skills.filter(s => s.enabled !== false && !s.uses?.includes('reference') && (!s.uses?.length || s.uses.includes(use)))
}

// Parse a SKILL.md-style file: optional YAML frontmatter (name, description),
// then the body becomes the instructions.
export function parseSkillMarkdown(text, fallbackName = 'Imported skill') {
  let name = '', description = '', body = String(text || '')
  const fm = body.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (fm) {
    body = body.slice(fm[0].length)
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^\s*(name|description)\s*:\s*(.*)$/i)
      if (m) {
        const v = m[2].trim().replace(/^["']|["']$/g, '')
        if (m[1].toLowerCase() === 'name') name = v
        else description = v
      }
    }
  }
  if (!name) {
    const h = body.match(/^#\s+(.+)$/m)
    name = h ? h[1].trim() : fallbackName
  }
  return { name: name.slice(0, 80), description: description.slice(0, 300), instructions: body.trim() }
}

export function skillToMarkdown(s) {
  return `---\nname: ${s.name}\ndescription: ${s.description || ''}\n---\n\n${s.instructions || ''}\n`
}
