import { useState } from 'react'
import {
  VIBE_OPTIONS, SKIN_TONES, HAIR_COLORS, HAIR_LENGTHS_FEMALE, HAIR_LENGTHS_MALE,
  HAIR_TEXTURES, EYE_COLORS, BUILDS_FEMALE, BUILDS_MALE, ETHNICITIES,
} from '../../utils/lookOptions'

// Look step: a live preview on top and a pull-up panel of tabbed option grids
// underneath (avatar-builder pattern). On phones the panel is a sheet that can be
// pulled up to cover more of the preview; on desktop they sit side by side.

const swatchOf = (list, id) => list.find(x => x.id === id)?.swatch

// ── Live preview: a simple illustrated bust built from the picked traits ──
function Avatar({ data, gender }) {
  const isMale = gender === 'male'
  const skin = swatchOf(SKIN_TONES, data.skinTone) || '#D9B28F'
  const hairRaw = swatchOf(HAIR_COLORS, data.hairColor) || '#5A4636'
  const dyed = hairRaw.startsWith('linear-gradient')
  const hair = dyed ? 'url(#muse-hair-dyed)' : hairRaw
  const eye = swatchOf(EYE_COLORS, data.eyeColor) || '#4B3A2C'
  const len = (data.hairLength || (isMale ? 'Short' : 'Long')).toLowerCase()
  const texture = (data.hairTexture || 'Straight').toLowerCase()
  const build = (data.build || 'Average').toLowerCase()
  const shoulder = { petite: 52, slim: 56, athletic: 66, average: 62, curvy: 64, tall: 60, plus: 70, muscular: 72, stocky: 70 }[build] || 62

  const backLen = { 'buzz cut': 0, short: 0, medium: 150, long: 196, 'extra long': 232 }[len] ?? 150
  const wavy = texture !== 'straight'
  const back = backLen
    ? wavy
      ? `M54 92 C40 ${backLen * 0.55} 60 ${backLen * 0.75} 46 ${backLen} L154 ${backLen} C140 ${backLen * 0.75} 160 ${backLen * 0.55} 146 92 Z`
      : `M56 90 L50 ${backLen} L150 ${backLen} L144 90 Z`
    : null
  const top = len === 'buzz cut'
    ? 'M62 82 C64 52 136 52 138 82 C130 70 70 70 62 82 Z'
    : texture === 'curly' || texture === 'coily'
      ? 'M54 96 C40 60 62 34 86 40 C92 26 122 28 128 42 C150 40 164 70 146 98 C140 78 126 64 100 64 C74 64 60 78 54 96 Z'
      : 'M56 98 C50 56 76 38 100 38 C126 38 152 56 144 98 C138 72 120 60 100 62 C82 60 64 70 56 98 Z'

  return (
    <svg className="muse-avatar" viewBox="0 0 200 240" role="img" aria-label="Live preview of the look">
      <defs>
        <linearGradient id="muse-hair-dyed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EC4899" /><stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="118" r="96" className="muse-avatar-bg" />
      {back && <path d={back} fill={hair} />}
      <path d={`M${100 - shoulder} 240 C${100 - shoulder} 192 ${100 - shoulder / 2} 178 100 178 C${100 + shoulder / 2} 178 ${100 + shoulder} 192 ${100 + shoulder} 240 Z`} className="muse-avatar-top" />
      <rect x="88" y="150" width="24" height="34" rx="10" fill={skin} />
      <ellipse cx="100" cy="106" rx="40" ry="50" fill={skin} />
      <path d={top} fill={hair} />
      <path d="M78 98 q8 -5 16 0 M106 98 q8 -5 16 0" stroke={dyed ? '#3A2A44' : hairRaw} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".7" />
      <circle cx="86" cy="110" r="5" fill="#fff" /><circle cx="114" cy="110" r="5" fill="#fff" />
      <circle cx="86" cy="110" r="3.2" fill={eye} /><circle cx="114" cy="110" r="3.2" fill={eye} />
      <path d="M92 136 q8 6 16 0" stroke="rgba(0,0,0,.35)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function LookPreview({ data, gender, name }) {
  const traits = [
    data.ethnicity,
    SKIN_TONES.find(s => s.id === data.skinTone)?.label && `${SKIN_TONES.find(s => s.id === data.skinTone).label} skin`,
    [data.hairLength, data.hairTexture, HAIR_COLORS.find(h => h.id === data.hairColor)?.label].filter(Boolean).join(' ') && `${[data.hairLength, data.hairTexture, HAIR_COLORS.find(h => h.id === data.hairColor)?.label].filter(Boolean).join(' ').toLowerCase()} hair`,
    EYE_COLORS.find(e => e.id === data.eyeColor) && `${EYE_COLORS.find(e => e.id === data.eyeColor).label.toLowerCase()} eyes`,
    data.build && `${data.build.toLowerCase()} build`,
    ...(data.vibeWords || []),
  ].filter(Boolean)
  return (
    <div className="muse-look-preview">
      <div className="muse-look-stage"><Avatar data={data} gender={gender} /></div>
      <div className="muse-look-caption">
        <strong>{name || 'Your influencer'}</strong>
        {traits.length
          ? <div className="muse-look-traits">{traits.map(t => <span key={t} className="muse-plan-chip">{t}</span>)}</div>
          : <span>Pick features below. The preview is a sketch; the real photos come at the Generate step.</span>}
      </div>
    </div>
  )
}

function Tile({ on, onClick, swatch, label, sub, wide }) {
  return (
    <button type="button" className={`muse-tile${on ? ' on' : ''}${wide ? ' wide' : ''}`} onClick={onClick} aria-pressed={on}>
      {swatch && <span className="muse-tile-swatch" style={{ background: swatch }} />}
      <span className="muse-tile-label">{label}</span>
      {sub && <span className="muse-tile-sub">{sub}</span>}
    </button>
  )
}

export default function LookStudio({ data, set, gender, name }) {
  const isMale = gender === 'male'
  const hairLengths = isMale ? HAIR_LENGTHS_MALE : HAIR_LENGTHS_FEMALE
  const builds = isMale ? BUILDS_MALE : BUILDS_FEMALE
  const vibes = VIBE_OPTIONS.filter(v => !v.genders || !gender || v.genders.includes(gender))
  const [tab, setTab] = useState('skin')
  const [expanded, setExpanded] = useState(false)

  const toggle = (field, val) => set(field, data[field] === val ? '' : val)

  function randomize() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)]
    set('ethnicity', pick(ETHNICITIES)); set('skinTone', pick(SKIN_TONES).id)
    set('hairColor', pick(HAIR_COLORS).id); set('hairLength', pick(hairLengths))
    set('hairTexture', pick(HAIR_TEXTURES)); set('eyeColor', pick(EYE_COLORS).id)
    set('build', pick(builds))
  }

  const TABS = [
    { id: 'skin', label: 'Skin' }, { id: 'hair', label: 'Hair' }, { id: 'eyes', label: 'Eyes' },
    { id: 'build', label: 'Build' }, { id: 'origin', label: 'Origin' }, { id: 'vibe', label: 'Vibe' },
    { id: 'details', label: 'Details' },
  ]

  return (
    <div className={`muse-look${expanded ? ' expanded' : ''}`}>
      <LookPreview data={data} gender={gender} name={name} />

      <section className="muse-look-panel" aria-label="Look options">
        <button type="button" className="muse-look-handle" onClick={() => setExpanded(e => !e)} aria-expanded={expanded} aria-label={expanded ? 'Show more preview' : 'Show more options'}>
          <span />
        </button>
        <div className="muse-look-tabs" role="tablist">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`muse-look-tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="muse-look-body" role="tabpanel">
          {tab === 'skin' && <div className="muse-tile-grid">{SKIN_TONES.map(s => <Tile key={s.id} on={data.skinTone === s.id} onClick={() => toggle('skinTone', s.id)} swatch={s.swatch} label={s.label} />)}</div>}
          {tab === 'hair' && <>
            <p className="muse-look-sub">Colour</p>
            <div className="muse-tile-grid">{HAIR_COLORS.map(h => <Tile key={h.id} on={data.hairColor === h.id} onClick={() => toggle('hairColor', h.id)} swatch={h.swatch} label={h.label} />)}</div>
            <p className="muse-look-sub">Length</p>
            <div className="muse-tile-grid">{hairLengths.map(l => <Tile key={l} on={data.hairLength === l} onClick={() => set('hairLength', l)} label={l} />)}</div>
            <p className="muse-look-sub">Texture</p>
            <div className="muse-tile-grid">{HAIR_TEXTURES.map(t => <Tile key={t} on={data.hairTexture === t} onClick={() => set('hairTexture', t)} label={t} />)}</div>
          </>}
          {tab === 'eyes' && <div className="muse-tile-grid">{EYE_COLORS.map(e => <Tile key={e.id} on={data.eyeColor === e.id} onClick={() => toggle('eyeColor', e.id)} swatch={e.swatch} label={e.label} />)}</div>}
          {tab === 'build' && <div className="muse-tile-grid">{builds.map(b => <Tile key={b} on={data.build === b} onClick={() => toggle('build', b)} label={b} />)}</div>}
          {tab === 'origin' && <div className="muse-tile-grid">{ETHNICITIES.map(e => <Tile key={e} on={data.ethnicity === e} onClick={() => toggle('ethnicity', e)} label={e} />)}</div>}
          {tab === 'vibe' && <div className="muse-tile-grid two">{vibes.map(v => <Tile key={v.id} wide on={data.vibeWords?.includes(v.id)} onClick={() => set('vibeWords', data.vibeWords?.includes(v.id) ? [] : [v.id])} label={`${v.icon} ${v.label}`} sub={v.sub} />)}</div>}
          {tab === 'details' && (
            <label className="muse-field">
              <span>Anything else</span>
              <input className="create-input" value={data.uniqueFeatures || ''} onChange={e => set('uniqueFeatures', e.target.value)} placeholder="Freckles, dimples, beauty mark, tattoos…" />
            </label>
          )}
        </div>

        <div className="muse-look-foot">
          <button type="button" className="muse-btn muse-btn-text" onClick={randomize}>Surprise me</button>
        </div>
      </section>
    </div>
  )
}
