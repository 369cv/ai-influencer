import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getElevenKey, listVoices, speak, VOICE_MODELS, DEFAULT_VOICE_SETTINGS } from '../utils/elevenlabs'

// Persona voice (influencer profile → Overview). One ElevenLabs voice per
// persona with locked settings and an optional seed, so every clip sounds the
// same. Saved on the influencer as voiceProfile.

const SLIDERS = [
  { key: 'stability', label: 'Stability', min: 0, max: 1, step: 0.05, hint: 'Lower = more expressive' },
  { key: 'similarity_boost', label: 'Similarity', min: 0, max: 1, step: 0.05, hint: 'How close to the original voice' },
  { key: 'style', label: 'Style', min: 0, max: 1, step: 0.05, hint: 'Exaggeration; 0 is steadiest' },
  { key: 'speed', label: 'Speed', min: 0.7, max: 1.2, step: 0.05, hint: '1 is normal' },
]

const card = { background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }
const label = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }

export default function PersonaVoice({ influencer, onUpdate }) {
  const hasKey = !!getElevenKey()
  const vp = influencer.voiceProfile || null
  const settings = { ...DEFAULT_VOICE_SETTINGS, ...(vp?.settings || {}) }
  const [picking, setPicking] = useState(false)
  const [voices, setVoices] = useState(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [line, setLine] = useState(() => `Hey, it's ${influencer.name || 'me'}. Here's what I'm wearing today.`)
  const audio = useRef(null)
  const lastUrl = useRef(null)
  // Sliders and seed edit a local draft; it's saved 400ms after the last
  // change so dragging doesn't rewrite the whole influencer store each tick.
  const [draft, setDraft] = useState(settings)
  const [seedDraft, setSeedDraft] = useState(vp?.seed)
  const dirty = useRef(false)
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => { dirty.current = false; save({ settings: draft, seed: seedDraft }) }, 400)
    return () => clearTimeout(t)
  }, [draft, seedDraft]) // eslint-disable-line react-hooks/exhaustive-deps
  const editDraft = patch => { dirty.current = true; setDraft(d => ({ ...d, ...patch })) }
  const editSeed = v => { dirty.current = true; setSeedDraft(v) }

  useEffect(() => () => { audio.current?.pause(); if (lastUrl.current) URL.revokeObjectURL(lastUrl.current) }, [])

  const save = patch => onUpdate({ voiceProfile: { provider: 'elevenlabs', model: VOICE_MODELS[0].id, settings: DEFAULT_VOICE_SETTINGS, ...(vp || {}), ...patch } })

  function play(src) {
    audio.current?.pause()
    audio.current = new Audio(src)
    audio.current.play().catch(() => {})
  }

  async function openPicker() {
    setPicking(true); setError('')
    if (voices) return
    setBusy('voices')
    try { setVoices(await listVoices()) } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  async function preview() {
    setBusy('tts'); setError('')
    try {
      const url = await speak({ voiceId: vp.voiceId, text: line, model: vp.model, settings: draft, seed: seedDraft })
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
      lastUrl.current = url
      play(url)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  if (!hasKey) {
    return (
      <section style={card} aria-labelledby="pv-h">
        <span id="pv-h" style={label}>Voice</span>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Give {influencer.name || 'this influencer'} one consistent voice. Add an ElevenLabs key in Settings first.{' '}
          <Link to="/settings?section=connections" className="muse-text-btn">Connect ElevenLabs</Link>
        </p>
      </section>
    )
  }

  const shown = (voices || []).filter(v => !q || `${v.name} ${Object.values(v.labels || {}).join(' ')}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <section style={card} aria-labelledby="pv-h">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span id="pv-h" style={label}>Voice</span>
        <button type="button" className="muse-btn muse-btn-tonal" style={{ minHeight: 36 }} onClick={() => (picking ? setPicking(false) : openPicker())} aria-expanded={picking}>
          {picking ? 'Close' : vp?.voiceId ? 'Change voice' : 'Pick a voice'}
        </button>
      </div>

      {vp?.voiceId
        ? <div style={{ fontSize: 15, fontWeight: 600 }}>{vp.voiceName || vp.voiceId} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 13 }}>· ElevenLabs</span></div>
        : !picking && <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No voice yet. Pick one from your ElevenLabs library.</p>}

      {picking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <input className="muse-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search voices" aria-label="Search voices" />
          {busy === 'voices' && <p className="muse-muted">Loading your voices…</p>}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 280, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }} aria-label="Voices">
            {shown.map(v => {
              const on = v.voice_id === vp?.voiceId
              const tags = [v.labels?.gender, v.labels?.accent, v.labels?.age, v.labels?.description || v.labels?.descriptive].filter(Boolean).join(' · ')
              return (
                <li key={v.voice_id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: on ? 'var(--accent-light)' : undefined }}>
                  <button type="button" className="muse-pchip icon" aria-label={`Play ${v.name} sample`} disabled={!v.preview_url} onClick={() => play(v.preview_url)}>▶</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{v.name}</div>
                    {tags && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tags}</div>}
                  </div>
                  {on
                    ? <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selected</span>
                    : <button type="button" className="muse-btn muse-btn-text" style={{ minHeight: 32 }} onClick={() => { save({ voiceId: v.voice_id, voiceName: v.name }); setPicking(false) }}>Use</button>}
                </li>
              )
            })}
            {voices && shown.length === 0 && <li style={{ padding: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>No voices match.</li>}
          </ul>
        </div>
      )}

      {vp?.voiceId && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3) var(--space-5)' }}>
            {SLIDERS.map(s => (
              <label key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ fontWeight: 600 }}>{s.label}</strong><span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{Number(draft[s.key]).toFixed(2)}</span></span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={draft[s.key]} onChange={e => editDraft({ [s.key]: Number(e.target.value) })} aria-label={s.label} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.hint}</span>
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <strong style={{ fontWeight: 600 }}>Model</strong>
              <select className="muse-input" value={vp.model || VOICE_MODELS[0].id} onChange={e => save({ model: e.target.value })} aria-label="Voice model">
                {VOICE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <strong style={{ fontWeight: 600 }}>Seed</strong>
              <input className="muse-input" inputMode="numeric" value={seedDraft ?? ''} placeholder="Optional, keeps takes alike" aria-label="Seed"
                onChange={e => { const v = e.target.value.replace(/\D/g, ''); editSeed(v === '' ? undefined : Math.min(4294967295, Number(v))) }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="muse-input" style={{ flex: '1 1 240px' }} value={line} maxLength={600} onChange={e => setLine(e.target.value)} aria-label="Preview line" />
            <button type="button" className="muse-btn muse-btn-tonal" onClick={preview} disabled={busy === 'tts' || !line.trim()}>{busy === 'tts' ? 'Making…' : '▶ Preview'}</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Previews use your ElevenLabs characters. Settings save as you change them.</p>
        </>
      )}

      {error && <p className="muse-error" role="alert">{error}</p>}
    </section>
  )
}
