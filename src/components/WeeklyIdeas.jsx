import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { hasClaude, runSkill, influencerContext } from '../utils/claudeAssist'
import { outlierOf } from '../pages/Tracking'
import { newId } from '../utils/localJson'

// Home: "This week's ideas". Claude drafts three ideas from the chosen
// persona, the top outlier posts in Plan → Creators, and recent Plan ideas.
// Each one goes to Plan's Ideas column in one click. Per workspace.

const FORMATS = ['Reel', 'Carousel', 'Photo', 'Story', 'Talking video']

export function parseIdeas(text) {
  const raw = String(text || '')
  const m = raw.match(/\[[\s\S]*\]/)
  if (m) {
    try {
      const arr = JSON.parse(m[0])
      if (Array.isArray(arr)) {
        return arr.map(x => ({
          format: FORMATS.find(f => f.toLowerCase() === String(x.format || '').toLowerCase()) || String(x.format || 'Reel').slice(0, 20),
          title: String(x.title || '').trim().slice(0, 140),
          hook: String(x.hook || '').trim().slice(0, 240),
        })).filter(x => x.title).slice(0, 3)
      }
    } catch { /* fall through to line parsing */ }
  }
  return raw.split(/\n+/).map(s => s.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean).slice(0, 3).map(title => ({ format: 'Reel', title: title.slice(0, 140), hook: '' }))
}

function weekOf(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x.toISOString().slice(0, 10)
}

export default function WeeklyIdeas() {
  const [influencers] = useInfluencers()
  const [tracked] = useWorkspaceStore('muse_tracked')
  const [planIdeas, setPlanIdeas] = useWorkspaceStore('muse_ideas')
  const [saved, setSaved] = useWorkspaceStore('muse_weekly_ideas', null)
  const list = influencers || []
  const [influencerId, setInfluencerId] = useState(() => saved?.influencerId || list[list.length - 1]?.id || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inf = list.find(i => i.id === influencerId)
  const items = saved?.items || []

  async function generate() {
    setBusy(true); setError('')
    try {
      const top = (tracked || [])
        .flatMap(c => {
          const avg = [...(c.snapshots || [])].sort((a, b) => b.at - a.at).find(s => s.avgViews > 0)?.avgViews
          return (c.posts || []).map(p => ({ who: c.name || c.handle, title: p.title, x: outlierOf(p.views, avg) }))
        })
        .filter(p => p.x != null).sort((a, b) => b.x - a.x).slice(0, 5)
      const recent = (planIdeas || []).filter(i => i.status !== 'archived').slice(0, 8).map(i => `- ${i.title}`)
      const context = [
        influencerContext(inf),
        top.length && `Posts that over-performed for tracked creators:\n${top.map(p => `- ${p.who}: "${p.title}" (${p.x.toFixed(1)}× their average)`).join('\n')}`,
        recent.length && `Already in the plan (don't repeat):\n${recent.join('\n')}`,
      ].filter(Boolean).join('\n\n')
      const task = `Suggest exactly 3 fresh content ideas for this week${inf ? ` for ${inf.name}` : ''}. Reply with only a JSON array: [{"format":"Reel|Carousel|Photo|Story|Talking video","title":"short idea, max 12 words","hook":"the first line said or shown"}]`
      const ideas = parseIdeas(await runSkill({ task, context, maxTokens: 600 }))
      if (!ideas.length) throw new Error('No ideas came back. Try again.')
      setSaved({ weekOf: weekOf(), influencerId, items: ideas.map(x => ({ ...x, id: newId('wk') })) })
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  function addToPlan(item) {
    const id = newId('idea')
    setPlanIdeas(l => [{ id, title: item.title, notes: [item.format && `Format: ${item.format}`, item.hook && `Hook: ${item.hook}`].filter(Boolean).join('\n'), influencerId: saved?.influencerId || null, source: { type: 'weekly-ideas' }, status: 'inbox', createdAt: Date.now() }, ...l])
    setSaved(s => ({ ...s, items: s.items.map(x => x.id === item.id ? { ...x, ideaId: id } : x) }))
  }

  const stale = saved?.weekOf && saved.weekOf !== weekOf()

  return (
    <section className="muse-recent" aria-labelledby="weekly-h">
      <div className="muse-section-head" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <h2 id="weekly-h">This week's ideas{stale && <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 8 }}>from last week</span>}</h2>
        {hasClaude() && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {list.length > 0 && (
              <select className="muse-input" style={{ minHeight: 36, width: 'auto', maxWidth: 160 }} value={influencerId || ''} onChange={e => setInfluencerId(e.target.value || null)} aria-label="Influencer for ideas">
                <option value="">No influencer</option>
                {list.map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
              </select>
            )}
            <button type="button" className="muse-btn muse-btn-tonal" style={{ minHeight: 36 }} onClick={generate} disabled={busy}>{busy ? 'Thinking…' : items.length ? 'Regenerate' : 'Generate'}</button>
          </div>
        )}
      </div>

      {!hasClaude() ? (
        <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-secondary)' }}>
          Add your Anthropic key to get three ideas a week from your persona and tracked creators. <Link to="/settings?section=connections" className="muse-text-btn">Connect</Link>
        </p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-secondary)' }}>
          Generate three ideas from {inf ? `${inf.name}'s persona` : 'your persona'}, your tracked creators' outlier posts and what's already in Plan.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {items.map(item => (
            <article key={item.id} className="muse-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{item.format}</span>
              <strong style={{ fontSize: 'var(--font-size-body)', lineHeight: 1.35 }}>{item.title}</strong>
              {item.hook && <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>“{item.hook}”</p>}
              <span style={{ flex: 1 }} />
              {item.ideaId
                ? <span style={{ fontSize: 'var(--font-size-label)', color: 'var(--text-secondary)' }}>Added ✓ · <Link to="/plan" className="muse-text-btn">Open Plan</Link></span>
                : <button type="button" className="muse-btn muse-btn-tonal" style={{ alignSelf: 'flex-start', minHeight: 36 }} onClick={() => addToPlan(item)}>Add to Plan</button>}
            </article>
          ))}
        </div>
      )}
      {error && <p className="muse-error" role="alert">{error}</p>}
    </section>
  )
}
