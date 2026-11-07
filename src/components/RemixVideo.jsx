import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfluencers } from '../store'
import { useWorkspaceStore } from '../context/workspace'
import { Dialog, Field, InfluencerSelect } from './ui'
import { hasClaude, runSkill, influencerContext } from '../utils/claudeAssist'
import { newId } from '../utils/localJson'

// Remix a video (Studio): paste a reference link and its transcript or
// captions → Analyze (cheap, text only) into a blueprint → Write my version in
// the persona's voice → Add to Plan. Nothing is generated or spent on
// Higgsfield here. No automatic transcription yet: the user pastes the words.

const SECTIONS = [
  { key: 'hook', label: 'Hook' },
  { key: 'bridge', label: 'Bridge' },
  { key: 'body', label: 'Body' },
  { key: 'devices', label: 'Persuasion' },
  { key: 'cta', label: 'Call to action' },
  { key: 'style', label: 'Visual style' },
]

const asList = v => (Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : v ? [String(v).trim()] : [])

export function parseBlueprint(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    const o = JSON.parse(m[0])
    const bp = {
      hookType: String(o.hookType || o.hook_type || '').slice(0, 40),
      hook: String(o.hook || '').slice(0, 300),
      bridge: String(o.bridge || '').slice(0, 400),
      body: asList(o.body).slice(0, 8).map(x => x.slice(0, 240)),
      devices: asList(o.devices || o.persuasion).slice(0, 8).map(x => x.slice(0, 80)),
      cta: String(o.cta || '').slice(0, 240),
      style: asList(o.style).slice(0, 8).map(x => x.slice(0, 80)),
    }
    return bp.hook || bp.body.length ? bp : null
  } catch { return null }
}

export const blueprintText = bp => [
  `Hook${bp.hookType ? ` (${bp.hookType})` : ''}: ${bp.hook}`,
  bp.bridge && `Bridge: ${bp.bridge}`,
  bp.body.length && `Body:\n${bp.body.map((b, i) => `${i + 1}. ${b}`).join('\n')}`,
  bp.devices.length && `Persuasion: ${bp.devices.join(', ')}`,
  bp.cta && `Call to action: ${bp.cta}`,
  bp.style.length && `Visual style: ${bp.style.join(', ')}`,
].filter(Boolean).join('\n')

export default function RemixVideo({ onClose, defaultInfluencerId = null }) {
  const [influencers] = useInfluencers()
  const [, setIdeas] = useWorkspaceStore('muse_ideas')
  const [url, setUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [influencerId, setInfluencerId] = useState(defaultInfluencerId)
  const [bp, setBp] = useState(null)
  const [script, setScript] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const inf = (influencers || []).find(i => i.id === influencerId)
  const validUrl = !url.trim() || /^https:\/\/\S+$/i.test(url.trim())

  async function analyze() {
    setBusy('analyze'); setError(''); setScript(''); setAdded(false)
    try {
      const task = `Break this short-form video into its structure. Reply with only JSON: {"hookType":"curiosity|pov|list|question|bold claim|story|other","hook":"the opening line","bridge":"how it moves from hook to the main part","body":["beat 1","beat 2"],"devices":["persuasion devices used"],"cta":"the ending ask","style":["visual and pacing notes you can infer"]}`
      const context = [url.trim() && `Video: ${url.trim()}`, `Transcript or captions:\n${transcript.trim().slice(0, 6000)}`].filter(Boolean).join('\n\n')
      const out = parseBlueprint(await runSkill({ task, context, maxTokens: 800 }))
      if (!out) throw new Error('Could not read a structure from that. Try pasting more of the transcript.')
      setBp(out)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  async function write() {
    setBusy('write'); setError(''); setAdded(false)
    try {
      const task = `Write a new short-form video script that keeps this structure but is original, in the influencer's own voice and niche. Same beats and length, new words and examples. Plain text: the spoken lines, with [shot notes] in brackets.`
      const context = [influencerContext(inf), `Structure to keep:\n${blueprintText(bp)}`].filter(Boolean).join('\n\n')
      setScript((await runSkill({ task, context, maxTokens: 900 })).trim())
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  function addToPlan() {
    setIdeas(l => [{ id: newId('idea'), title: `Remix: ${bp.hook || 'video'}`.slice(0, 300), notes: [script, '', '— Structure —', blueprintText(bp), url.trim() && `Source: ${url.trim()}`].filter(x => x !== false && x != null).join('\n'), influencerId: influencerId || null, source: { type: 'remix', url: url.trim() || null }, status: 'inbox', createdAt: Date.now() }, ...l])
    setAdded(true)
  }

  const actions = !hasClaude()
    ? <button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Close</button>
    : !bp
      ? <><button type="button" className="muse-btn muse-btn-tonal" onClick={onClose}>Cancel</button><button type="button" className="muse-btn muse-btn-filled" onClick={analyze} disabled={busy === 'analyze' || transcript.trim().length < 40 || !validUrl}>{busy === 'analyze' ? 'Analyzing…' : 'Analyze'}</button></>
      : !script
        ? <><button type="button" className="muse-btn muse-btn-tonal" onClick={() => setBp(null)}>Back</button><button type="button" className="muse-btn muse-btn-filled" onClick={write} disabled={busy === 'write'}>{busy === 'write' ? 'Writing…' : 'Write my version'}</button></>
        : <><button type="button" className="muse-btn muse-btn-tonal" onClick={write} disabled={busy === 'write'}>{busy === 'write' ? 'Writing…' : 'Rewrite'}</button><button type="button" className="muse-btn muse-btn-filled" onClick={addToPlan} disabled={added}>{added ? 'Added to Plan ✓' : 'Add to Plan'}</button></>

  return (
    <Dialog title="Remix a video" sub="Keep a video's structure, write your own version. Text only: nothing is generated or spent." onClose={onClose} actions={actions} wide>
      {!hasClaude() ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>This uses Claude. Add your Anthropic key first. <Link to="/settings?section=connections" className="muse-text-btn" onClick={onClose}>Connect</Link></p>
      ) : !bp ? (
        <>
          <Field label="Video link" hint="Optional. Instagram, TikTok or YouTube."><input className="muse-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" aria-label="Video link" aria-invalid={!validUrl} /></Field>
          <Field label="Transcript or captions" hint="Paste what's said and the on-screen text. Automatic transcription isn't built yet."><textarea className="muse-input" rows={7} value={transcript} onChange={e => setTranscript(e.target.value)} aria-label="Transcript or captions" placeholder="POV: you finally found jeans that fit…" /></Field>
          <Field label="Write it for"><InfluencerSelect value={influencerId} onChange={setInfluencerId} /></Field>
        </>
      ) : (
        <>
          <ol className="muse-plan-rows" aria-label="Blueprint" style={{ marginTop: 0 }}>
            {SECTIONS.map(sec => {
              const v = bp[sec.key]
              if (!v || (Array.isArray(v) && !v.length)) return null
              return (
                <li key={sec.key} className="muse-plan-row">
                  <div className="muse-plan-row-body">
                    <span className="muse-plan-label">{sec.label}{sec.key === 'hook' && bp.hookType ? ` · ${bp.hookType}` : ''}</span>
                    {sec.key === 'body'
                      ? <ol style={{ margin: '2px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.45 }}>{v.map((b, i) => <li key={i}>{b}</li>)}</ol>
                      : Array.isArray(v)
                        ? <span className="muse-plan-chips">{v.map((x, i) => <span key={i} className="muse-plan-chip">{x}</span>)}</span>
                        : <span className="muse-plan-value">{v}</span>}
                  </div>
                </li>
              )
            })}
          </ol>
          {script && (
            <Field label={`Your version${inf ? ` · ${inf.name}` : ''}`}>
              <textarea className="muse-input" rows={9} value={script} onChange={e => { setScript(e.target.value); setAdded(false) }} aria-label="Your version" />
            </Field>
          )}
        </>
      )}
      {error && <p className="muse-error" role="alert">{error}</p>}
    </Dialog>
  )
}
