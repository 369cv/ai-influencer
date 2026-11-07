// Small helper for the "Draft with a skill" buttons in Plan and Content.
// Calls the existing /api/claude proxy with the user's own Anthropic key.
import { getClaudeKey } from './connections'
import { loadSkill } from './skills'

export const ASSIST_MODEL = 'claude-sonnet-5-5'

export function hasClaude() { return !!getClaudeKey() }

export async function runSkill({ skill, task, context = '', maxTokens = 1200 }) {
  const key = getClaudeKey()
  if (!key) throw new Error('Add your Anthropic API key in Settings → Connections first.')
  skill = await loadSkill(skill)
  const system = [
    'You help a creator run AI influencer accounts in Muse Studio.',
    skill ? `Follow this skill exactly.\n\n# Skill: ${skill.name}\n${skill.instructions}` : '',
  ].filter(Boolean).join('\n\n')
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: ASSIST_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: [context && `Context:\n${context}`, `Task:\n${task}`].filter(Boolean).join('\n\n') }],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || `Claude request failed (${res.status})`)
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
}

export function influencerContext(inf) {
  if (!inf) return ''
  const niche = inf.niche || (inf.niches || []).join(', ')
  return [
    `Influencer: ${inf.name || 'Untitled'}${inf.age ? `, ${inf.age}` : ''}${inf.gender ? `, ${inf.gender}` : ''}`,
    niche && `Niche: ${niche}`,
    inf.vibeWords?.length && `Vibe: ${inf.vibeWords.join(', ')}`,
    inf.backstory && `Story: ${String(inf.backstory).slice(0, 800)}`,
  ].filter(Boolean).join('\n')
}
