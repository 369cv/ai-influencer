import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getElevenKey, listVoices, speak, designVoice, saveDesignedVoice, remixVoice, searchLibrary, addLibraryVoice, VOICE_MODELS, DEFAULT_VOICE_SETTINGS } from '../utils/elevenlabs'

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
  const [designing, setDesigning] = useState(false) // false | 'design' | 'remix'
  const [source, setSource] = useState('mine')       // picker: 'mine' | 'library'
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
        <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
          {vp?.voiceId && <button type="button" className="muse-btn muse-btn-text" style={{ minHeight: 36 }} onClick={() => { setDesigning(d => d === 'remix' ? false : 'remix'); setPicking(false) }} aria-expanded={designing === 'remix'}>{designing === 'remix' ? 'Close' : 'Tweak voice'}</button>}
          <button type="button" className="muse-btn muse-btn-text" style={{ minHeight: 36 }} onClick={() => { setDesigning(d => d === 'design' ? false : 'design'); setPicking(false) }} aria-expanded={designing === 'design'}>{designing === 'design' ? 'Close' : 'Design a voice'}</button>
          <button type="button" className="muse-btn muse-btn-tonal" style={{ minHeight: 36 }} onClick={() => { setDesigning(false); picking ? setPicking(false) : openPicker() }} aria-expanded={picking}>
            {picking ? 'Close' : vp?.voiceId ? 'Change voice' : 'Pick a voice'}
          </button>
        </span>
      </div>

      {vp?.voiceId
        ? <div style={{ fontSize: 15, fontWeight: 600 }}>{vp.voiceName || vp.voiceId} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 13 }}>· ElevenLabs</span></div>
        : !picking && <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No voice yet. Pick one from your ElevenLabs library.</p>}

      {designing && <VoiceDesign key={designing} remixOf={designing === 'remix' ? vp : null} influencer={influencer} play={play} onSaved={v => { save({ voiceId: v.voice_id, voiceName: v.name, designed: true }); setVoices(null); setDesigning(false) }} />}

      {picking && (
        <div className="muse-chip-row" role="tablist" aria-label="Voices from">
          {[['mine', 'My voices'], ['library', 'Voice library']].map(([id, l]) => <button key={id} type="button" role="tab" aria-selected={source === id} className={`muse-chip${source === id ? ' on' : ''}`} onClick={() => setSource(id)}>{l}</button>)}
        </div>
      )}
      {picking && source === 'library' && <VoiceLibrary play={play} current={vp?.voiceId} onUse={v => { save({ voiceId: v.voice_id, voiceName: v.name }); setVoices(null); setPicking(false) }} />}
      {picking && source === 'mine' && (
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

// Voice Design (ElevenLabs): describe her voice, get three takes, keep one. Each round
// uses ElevenLabs credits; nothing is added to the account until Save.
function VoiceDesign({ influencer, play, onSaved, remixOf = null }) {
  const [description, setDescription] = useState('')
  const [text, setText] = useState('')
  const [takes, setTakes] = useState(null)
  const [pick, setPick] = useState(null)
  const [name, setName] = useState(remixOf ? `${remixOf.voiceName || influencer.name || 'Voice'} (remix)`.slice(0, 100) : influencer.name || '')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const d = description.trim(), t = text.trim()
  const min = remixOf ? 5 : 20
  const ok = d.length >= min && d.length <= 1000 && (!t || (t.length >= 100 && t.length <= 1000))
  async function make() {
    setBusy('design'); setError(''); setTakes(null); setPick(null)
    try { const r = remixOf ? await remixVoice({ voiceId: remixOf.voiceId, description: d, text: t || undefined }) : await designVoice({ description: d, text: t || undefined }); setTakes(r.previews); if (!t && r.text) setText(r.text) } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  async function keep() {
    setBusy('save'); setError('')
    try { onSaved(await saveDesignedVoice({ name: name.trim(), description: d, generatedVoiceId: pick })) } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  return (
    <div className="muse-vd">
      <label className="muse-field-label" htmlFor="vd-desc">{remixOf ? `What should change in ${remixOf.voiceName || 'this voice'}?` : `Describe ${influencer.name ? `${influencer.name}’s` : 'her'} voice`}</label>
      <textarea id="vd-desc" className="muse-input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={remixOf ? 'For example: a little older, softer, slower, with a light Irish accent.' : 'Age, accent, tone, pace and mood. For example: warm, mid-twenties, light London accent, relaxed and a little playful.'} />
      <small className={d && (d.length < min || d.length > 1000) ? 'muse-error' : 'muse-muted'}>{d.length} / 1,000 · at least {min}</small>
      <label className="muse-field-label" htmlFor="vd-text">Sample line <span className="muse-muted">· optional, 100 to 1,000 characters</span></label>
      <textarea id="vd-text" className="muse-input" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Leave empty and ElevenLabs writes one that fits the description." />
      {t && (t.length < 100 || t.length > 1000) && <small className="muse-error">{t.length} characters; needs 100 to 1,000.</small>}
      <div className="muse-assist-row">
        <button type="button" className="muse-btn muse-btn-filled" disabled={!ok || !!busy} onClick={make}>{busy === 'design' ? 'Designing…' : takes ? 'Make 3 new takes' : 'Make 3 takes'}</button>
        <small className="muse-muted">Uses your ElevenLabs credits.</small>
      </div>
      {error && <p className="muse-error">{error}</p>}
      {takes && (
        <ul className="muse-vd-takes" aria-label="Takes">
          {takes.map((p, i) => (
            <li key={p.id} className={pick === p.id ? 'on' : ''}>
              <button type="button" className="muse-pchip icon" aria-label={`Play take ${i + 1}`} onClick={() => play(p.url)}>▶</button>
              <span>Take {i + 1}{p.duration ? <small className="muse-muted"> · {Math.round(p.duration)}s</small> : null}</span>
              <button type="button" className={`muse-chip${pick === p.id ? ' on' : ''}`} aria-pressed={pick === p.id} onClick={() => setPick(p.id)}>{pick === p.id ? 'Chosen' : 'Choose'}</button>
            </li>
          ))}
        </ul>
      )}
      {pick && (
        <div className="muse-assist-row">
          <input className="muse-input" value={name} onChange={e => setName(e.target.value)} aria-label="Voice name" placeholder="Voice name" />
          <button type="button" className="muse-btn muse-btn-filled" disabled={!name.trim() || !!busy} onClick={keep}>{busy === 'save' ? 'Saving…' : 'Save and use'}</button>
        </div>
      )}
    </div>
  )
}

// Voice Library (ElevenLabs public voices) with filters. Add and use copies the voice
// into your ElevenLabs account, then picks it for her.
const GENDERS = [['', 'Any gender'], ['female', 'Female'], ['male', 'Male'], ['neutral', 'Neutral']]
const AGES = [['', 'Any age'], ['young', 'Young'], ['middle_aged', 'Middle aged'], ['old', 'Old']]
const USES = [['', 'Any use'], ['social_media', 'Social media'], ['conversational', 'Conversational'], ['narrative_story', 'Narration'], ['advertisement', 'Advertising'], ['characters_animation', 'Characters'], ['entertainment_tv', 'Entertainment'], ['informative_educational', 'Educational']]
const LANGS = [['', 'Any language'], ['en', 'English'], ['es', 'Spanish'], ['pt', 'Portuguese'], ['fr', 'French'], ['de', 'German'], ['it', 'Italian'], ['ar', 'Arabic'], ['hi', 'Hindi'], ['ja', 'Japanese'], ['ko', 'Korean'], ['zh', 'Chinese']]
function VoiceLibrary({ play, current, onUse }) {
  const [f, setF] = useState({ search: '', gender: '', age: '', accent: '', language: '', use_case: '' })
  const [page, setPage] = useState(0)
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const t = setTimeout(async () => {
      setBusy('search'); setError('')
      try { const r = await searchLibrary({ ...f, page }); setRes(x => page > 0 && x ? { voices: [...x.voices, ...r.voices], hasMore: r.hasMore } : r) } catch (e) { setError(e.message) } finally { setBusy('') }
    }, 350)
    return () => clearTimeout(t)
  }, [f, page])
  const set = patch => { setPage(0); setF(x => ({ ...x, ...patch })) }
  const sel = (key, opts, label) => <select className="muse-input" value={f[key]} onChange={e => set({ [key]: e.target.value })} aria-label={label}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  async function add(v) {
    setBusy(v.voice_id); setError('')
    try { const { voice_id } = await addLibraryVoice({ publicOwnerId: v.public_owner_id, voiceId: v.voice_id, name: v.name }); onUse({ voice_id: voice_id || v.voice_id, name: v.name }) }
    catch (e) { setError(e.message) } finally { setBusy('') }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <input className="muse-input" value={f.search} onChange={e => set({ search: e.target.value })} placeholder="Search the ElevenLabs library: warm, raspy, upbeat…" aria-label="Search the voice library" />
      <div className="muse-vl-filters">
        {sel('gender', GENDERS, 'Gender')}{sel('age', AGES, 'Age')}{sel('language', LANGS, 'Language')}{sel('use_case', USES, 'Use')}
        <input className="muse-input" value={f.accent} onChange={e => set({ accent: e.target.value })} placeholder="Accent" aria-label="Accent" />
      </div>
      {error && <p className="muse-error">{error}</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }} aria-label="Library voices">
        {(res?.voices || []).map(v => {
          const tags = [v.labels?.gender, v.labels?.age?.replace('_', ' '), v.labels?.accent, v.labels?.descriptive, v.labels?.use_case?.replace(/_/g, ' ')].filter(Boolean).join(' · ')
          return (
            <li key={`${v.public_owner_id}-${v.voice_id}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <button type="button" className="muse-pchip icon" aria-label={`Play ${v.name} sample`} disabled={!v.preview_url} onClick={() => play(v.preview_url)}>▶</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v.name}</div>
                {tags && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tags}</div>}
              </div>
              {v.voice_id === current ? <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selected</span>
                : <button type="button" className="muse-btn muse-btn-text" style={{ minHeight: 32 }} disabled={!!busy} onClick={() => add(v)}>{busy === v.voice_id ? 'Adding…' : 'Add and use'}</button>}
            </li>
          )
        })}
        {busy === 'search' && <li style={{ padding: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>Searching…</li>}
        {res && !res.voices.length && busy !== 'search' && <li style={{ padding: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>No library voices match.</li>}
      </ul>
      {res?.hasMore && <button type="button" className="muse-btn muse-btn-text" disabled={!!busy} onClick={() => setPage(p => p + 1)}>More voices</button>}
    </div>
  )
}
