// Skills: reusable instructions you bring to Muse Studio (the same idea as a
// SKILL.md file). They're used as the system prompt when Claude drafts ideas,
// hooks, scripts and captions in Plan and Content.
import { readJSON } from './localJson'

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

export function readSkills() {
  const mine = readJSON(SKILLS_KEY, [])
  const overridden = new Set(mine.map(s => s.basedOn).filter(Boolean))
  return [...BUILTIN_SKILLS.filter(b => !overridden.has(b.id)), ...mine]
}

export function skillsFor(use, skills = readSkills()) {
  return skills.filter(s => s.enabled !== false && (!s.uses?.length || s.uses.includes(use)))
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
