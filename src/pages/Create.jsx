import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useInfluencers, generateId } from '../store'
import { buildThreeVariationPrompts } from '../utils/systemPrompt'
import { analyzeBackstory } from '../utils/backstoryAnalysis'
import { generateThreeImages } from '../utils/higgsfieldGenerate'
import { isHFConnected, startHiggsfieldOAuthPopup } from '../utils/higgsfieldAuth'
import { compressImage } from '../utils/imageUtils'
import { gColor } from '../utils/influencerUtils'
import { VIBE_OPTIONS, SKIN_TONES, HAIR_COLORS, HAIR_LENGTHS_FEMALE, HAIR_LENGTHS_MALE, HAIR_TEXTURES, EYE_COLORS, BUILDS_FEMALE, BUILDS_MALE, ETHNICITIES } from '../utils/lookOptions'
import LookStudio from '../components/create/LookStudio'
import PlanCard from '../components/PlanCard'
import { estimateImageCredits, DEFAULT_RESOLUTION } from '../utils/creditEstimate'

const NICHES = ['Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Travel', 'Food & Dining', 'Tech', 'Gaming', 'Finance', 'Entertainment', 'Wellness', 'Sports', 'Other']
// One task per screen. Order matters: the index + 1 is the step number.
const STEPS = [
  { id: 'name',     label: 'Name',       title: 'Name your influencer',  sub: 'Start with the basics. You can change anything later.' },
  { id: 'niche',    label: 'Niche',      title: 'What do they post about?', sub: 'Pick all that apply. It shapes scenes, props and captions.' },
  { id: 'refs',     label: 'References', title: 'Add references',        sub: 'Both optional. The more you give, the closer the result.' },
  { id: 'story',    label: 'Story',      title: 'Who are they?',         sub: 'Their story, vibe and what makes them different.' },
  { id: 'look',     label: 'Look',       title: 'How do they look?',     sub: 'Tap a tab, pick a feature, and watch the preview update.' },
  { id: 'generate', label: 'Generate',   title: null,                     sub: null },
]
const stepIndex = id => STEPS.findIndex(s => s.id === id) + 1

function StepHead({ title, sub }) {
  return (
    <header className="muse-step-head">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </header>
  )
}

function WizardProgress({ current }) {
  const s = STEPS[current - 1]
  return (
    <div className="muse-wizard-progress" aria-label={`Step ${current} of ${STEPS.length}: ${s.label}`}>
      <div className="muse-wizard-bars">
        {STEPS.map((x, i) => <span key={x.id} className={i + 1 < current ? 'done' : i + 1 === current ? 'active' : ''} />)}
      </div>
      <span className="muse-wizard-count">Step {current} of {STEPS.length} · {s.label}</span>
    </div>
  )
}

const MODEL_PREF_KEY = 'aiis_model_pref'
const MODELS = [
  { id: 'soul_2',            name: 'Higgsfield Soul', tag: 'Influencer-Native',   tagColor: '#EC4899', provider: 'higgsfield',              desc: 'Native model for fashion and UGC.',          maxRefs: 1 },
  { id: 'gpt_image_2',       name: 'GPT Image 2',     tag: 'Max Quality',         tagColor: '#10B981', provider: 'openai',                  desc: 'Highest quality output, maximum realism.',   maxRefs: 2 },
  { id: 'nano_banana_2',     name: 'Nano Banana Pro', tag: 'Sharpest Detail',     tagColor: 'var(--accent)', provider: 'banana', version: 'Pro', desc: 'Maximum detail and portrait precision.',     maxRefs: 2 },
  { id: 'nano_banana_flash', name: 'Nano Banana 2',   tag: 'Fastest',             tagColor: '#0EA5E9', provider: 'banana', version: '2',   desc: 'Rapid results, still premium quality.',      maxRefs: 2 },
]
function buildPhysicalDescString(d) {
  const { ethnicity, skinTone, hairColor, hairLength, hairTexture, eyeColor, build, uniqueFeatures } = d
  const parts = []
  if (ethnicity) parts.push(ethnicity.toLowerCase())
  const hairParts = [hairLength, hairTexture, hairColor].filter(Boolean).map(s => s.toLowerCase())
  if (hairParts.length) parts.push(hairParts.join(' ') + ' hair')
  if (eyeColor) parts.push(eyeColor.toLowerCase() + ' eyes')
  if (skinTone) parts.push(skinTone.toLowerCase() + ' skin tone')
  if (build) parts.push(build.toLowerCase() + ' build')
  if (uniqueFeatures?.trim()) parts.push(uniqueFeatures.trim())
  return parts.join(', ')
}

// Theme tokens — map to CSS variables so dark mode is automatic
const L = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--bg-tertiary)',
  border: 'var(--border)',
  borderFocus: 'var(--accent)',
  text: 'var(--text-primary)',
  textSub: 'var(--text-secondary)',
  textFaint: 'var(--text-tertiary)',
  card: 'var(--shadow-md)',
  cardHover: 'var(--shadow-lg)',
}

const CREATION_PARAMS_KEY = 'hf_creation_params'
function saveCreationParams(influencerId, params) {
  try {
    const d = JSON.parse(localStorage.getItem(CREATION_PARAMS_KEY) || '{}')
    d[influencerId] = params
    localStorage.setItem(CREATION_PARAMS_KEY, JSON.stringify(d))
  } catch (e) {
    console.warn('saveCreationParams failed (quota?), skipping:', e)
  }
}

const inputCls = 'create-input'
const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 12,
  border: `1.5px solid ${L.border}`, background: L.surfaceAlt,
  fontSize: 15, color: L.text, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
const taStyle = { ...inputStyle, resize: 'vertical', lineHeight: 1.65 }

function Lbl({ children, optional }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: L.textFaint, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 9, display: 'flex', gap: 7, alignItems: 'center' }}>
      {children}
      {optional && <span style={{ fontSize: 10, fontWeight: 500, color: L.textFaint, textTransform: 'none', letterSpacing: 0 }}>optional</span>}
    </div>
  )
}

// ── Step 1: Basics ────────────────────────────────────────────
function Step1({ data, set, onGenderChange, ageErrorPulse }) {
  return (
    <div>
      <StepHead title={STEPS[0].title} sub={STEPS[0].sub} />

      <div style={{ marginBottom: 22 }}>
        <Lbl>Name</Lbl>
        <input className={inputCls} style={inputStyle} value={data.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Luna Rose" autoFocus />
      </div>

      <div style={{ marginBottom: 22 }}>
        <Lbl>Gender</Lbl>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {[
            { g: 'Female', color: 'var(--accent)', glow: 'var(--accent-light)', icon: '♀' },
            { g: 'Male',   color: 'var(--accent)', glow: 'var(--accent-light)', icon: '♂' },
          ].map(({ g, color, glow, icon }) => {
            const on = data.gender === g
            return (
              <button key={g} onClick={() => onGenderChange(g)} style={{
                padding: '15px 10px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${on ? color : L.border}`,
                background: on ? glow : L.surface,
                color: on ? color : L.textSub,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                boxShadow: on ? L.card : 'none',
                transition: 'all 0.18s',
              }}>
                <span style={{ fontSize: 20, opacity: on ? 1 : 0.3, transition: 'opacity 0.15s' }}>{icon}</span>
                {g}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: data.age !== '' && Number(data.age) < 18 ? 12 : 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14 }}>
          <div>
            <Lbl>Age</Lbl>
            <input className={inputCls} style={inputStyle} type="text" inputMode="numeric" pattern="[0-9]*" value={data.age} onChange={e => set('age', e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 24" />
          </div>
          <div />
        </div>
        {data.age !== '' && Number(data.age) < 18 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '9px 13px', borderRadius: 10,
            background: ageErrorPulse ? 'rgba(255,59,48,0.10)' : 'rgba(255,59,48,0.05)',
            border: `1px solid ${ageErrorPulse ? 'rgba(255,59,48,0.35)' : 'rgba(255,59,48,0.14)'}`,
            animation: ageErrorPulse ? 'agePulse 0.4s ease' : 'none',
            transition: 'background 0.2s, border-color 0.2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 12.5, color: '#FF3B30', fontWeight: 500 }}>Influencer must be 18 or older.</span>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Step 2: Niche ─────────────────────────────────────────────
function StepNiche({ data, set }) {
  return (
    <div>
      <StepHead title={STEPS[1].title} sub={STEPS[1].sub} />
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {NICHES.map(n => {
            const on = (data.niches || []).includes(n)
            return (
              <button key={n} onClick={() => {
                const cur = data.niches || []
                set('niches', on ? cur.filter(x => x !== n) : [...cur, n])
              }} style={{
                padding: '8px 17px', borderRadius: 22, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${on ? 'var(--accent)' : L.border}`,
                background: on ? 'var(--accent-light)' : L.surface,
                color: on ? 'var(--accent)' : L.textSub,
                transition: 'all 0.15s',
                boxShadow: on ? '0 0 0 1px var(--accent)' : 'none',
              }}>{n}</button>
            )
          })}
        </div>
        {(data.niches || []).includes('Other') && (
          <input className={inputCls} style={{ ...inputStyle, marginTop: 10 }} value={data.nicheCustom} onChange={e => set('nicheCustom', e.target.value)} placeholder="Describe their niche…" />
        )}
      </div>
    </div>
  )
}

// ── Reusable single-image upload slot ────────────────────────
function RefSlot({ label, hint, value, onChange, note, onNoteChange, notePlaceholder }) {
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)
  const dragCounter = useRef(0)

  function processFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => compressImage(ev.target.result).then(onChange).catch(console.error)
    r.readAsDataURL(f)
  }

  function handleFile(e) {
    const f = e.target.files[0]; if (!f) return; e.target.value = ''
    processFile(f)
  }

  function onDragEnter(e) {
    e.preventDefault(); dragCounter.current++; setDragging(true)
  }
  function onDragLeave(e) {
    e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false)
  }
  function onDragOver(e) { e.preventDefault() }
  function onDrop(e) {
    e.preventDefault(); dragCounter.current = 0; setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  const dropProps = { onDragEnter, onDragLeave, onDragOver, onDrop }

  return (
    <div style={{ flex: 1 }}>
      <Lbl optional>{label}</Lbl>
      {value ? (
        <div
          {...dropProps}
          style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '3/4', boxShadow: L.card, outline: dragging ? '2.5px dashed #8B5CF6' : 'none', transition: 'outline 0.15s' }}
        >
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: dragging ? 0.5 : 1, transition: 'opacity 0.15s' }} />
          {dragging && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.15)', pointerEvents: 'none' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Drop to replace</span>
            </div>
          )}
          <button
            onClick={() => onChange(null)}
            style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.60)', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >×</button>
        </div>
      ) : (
        <div
          {...dropProps}
          onClick={() => fileRef.current.click()}
          style={{
            aspectRatio: '3/4', borderRadius: 16, cursor: 'pointer', transition: 'all 0.18s', padding: 16,
            border: dragging ? '2px dashed #8B5CF6' : '2px dashed var(--border)',
            background: dragging ? 'var(--accent-light)' : L.surfaceAlt,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseEnter={e => { if (!dragging) { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.50)'; e.currentTarget.style.background = 'rgba(139,92,246,0.06)' } }}
          onMouseLeave={e => { if (!dragging) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = L.surfaceAlt } }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: L.surface, boxShadow: L.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: dragging ? 'var(--accent)' : L.textFaint, transition: 'color 0.15s' }}>
            {dragging ? '↓' : '+'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: dragging ? 'var(--accent)' : L.textSub, marginBottom: 3, transition: 'color 0.15s' }}>
              {dragging ? 'Drop image' : 'Upload photo'}
            </div>
            <div style={{ fontSize: 12, color: L.textFaint, lineHeight: 1.4 }}>{hint}</div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      {value && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: L.textFaint, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>What to copy</div>
          <input
            value={note || ''}
            onChange={e => onNoteChange?.(e.target.value)}
            placeholder={notePlaceholder || 'e.g. jawline, skin tone'}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1.5px solid var(--border)', background: L.surfaceAlt,
              fontSize: 12.5, color: L.text, boxSizing: 'border-box',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Step 2: References ────────────────────────────────────────
function Step2({ data, set }) {
  return (
    <div>
      <StepHead title={STEPS[2].title} sub={STEPS[2].sub} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <RefSlot
          label="Face reference"
          hint="A photo of the face you want"
          value={data.faceRef}
          onChange={v => set('faceRef', v)}
          note={data.faceRefNote}
          onNoteChange={v => set('faceRefNote', v)}
          notePlaceholder="e.g. jawline, skin tone, eye shape"
        />
        <RefSlot
          label="Style reference"
          hint="Outfit, aesthetic, or vibe inspo"
          value={data.styleRef}
          onChange={v => set('styleRef', v)}
          note={data.styleRefNote}
          onNoteChange={v => set('styleRefNote', v)}
          notePlaceholder="e.g. outfit, pose, color palette"
        />
      </div>
    </div>
  )
}

// ── Step 3: Story ─────────────────────────────────────────────
function Step3({ data, set }) {
  const pv = data.personality ?? 50
  const mood = pv < 35 ? 'Thoughtful & introspective' : pv > 65 ? 'Bold & outgoing' : 'Balanced & versatile'
  const moodColor = pv < 35 ? '#3B82F6' : pv > 65 ? '#EC4899' : 'var(--accent)'

  return (
    <div>
      <StepHead title={STEPS[3].title} sub={STEPS[3].sub} />

      <div style={{ background: L.surface, borderRadius: 18, padding: '22px', boxShadow: L.card, marginBottom: 16 }}>
        <Lbl optional>Backstory</Lbl>
        <textarea
          className={inputCls}
          value={data.backstory}
          onChange={e => set('backstory', e.target.value)}
          placeholder="Their background, what drives them, what makes them unique…"
          rows={5}
          style={{ ...taStyle, background: L.surfaceAlt, marginBottom: 0 }}
        />
      </div>

      <div style={{ background: L.surface, borderRadius: 18, padding: '22px', boxShadow: L.card }}>
        <Lbl>Personality</Lbl>
        <input
          type="range" min={0} max={100} value={pv}
          onChange={e => set('personality', Number(e.target.value))}
          style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', height: 6, borderRadius: 3, outline: 'none', cursor: 'pointer', marginBottom: 14, background: `linear-gradient(to right, #3B82F6 0%, ${moodColor} ${pv}%, var(--bg-tertiary) ${pv}%, var(--bg-tertiary) 100%)`, transition: 'background 0.15s' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: L.textFaint }}>Introvert</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: moodColor, padding: '5px 14px', borderRadius: 22, background: `${moodColor}12`, border: `1.5px solid ${moodColor}25`, transition: 'all 0.2s' }}>{mood}</span>
          <span style={{ fontSize: 12, color: L.textFaint }}>Extrovert</span>
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Look ──────────────────────────────────────────────
function StepLook({ data, set }) {
  return (
    <div>
      <StepHead title={STEPS[4].title} sub={STEPS[4].sub} />
      <LookStudio data={data} set={set} gender={(data.gender || '').toLowerCase()} name={data.name?.trim()} />
    </div>
  )
}

// ── Fun loading screen ────────────────────────────────────────
const LOADING_MESSAGES = [
  // hot
  'sculpting cheekbones to genuinely dangerous levels.',
  'adding a jawline that will end at least one relationship.',
  'making them objectively better looking than you. nothing personal.',
  'configuring the face that makes brands overpay without realizing it.',
  'rendering someone so attractive it becomes slightly your problem.',
  'giving them the kind of hot that photographs itself.',
  'adding the natural glow that takes 45 minutes and a ring light to fake.',
  'calibrating how good-looking they should be. the answer was: very.',
  'building a face the camera will not be able to stop looking at.',
  'making them the kind of attractive that trends in countries they haven\'t visited.',
  'the cheekbones are done. they are a lot. you\'re welcome.',
  'giving them skin so good dermatologists will DM them unsolicited.',
  'adding the bone structure that gets people upgraded at hotels for free.',
  // money
  'your influencer will earn more per post than you do per month. congrats.',
  'computing their first brand deal. the rate is embarrassing for you.',
  'loading your passive income. indirectly, but still.',
  'their first sponsored post will probably cover your rent.',
  'rendering someone who makes money while you sleep. you\'re going to sleep.',
  'your influencer will earn commission from a country you\'ve never been to.',
  'calculating how rich they\'ll make you. the number is motivating.',
  'giving them the face that makes checkout pages convert.',
  'they\'re about to monetize an audience you don\'t have yet.',
  'making them the kind of person brands throw money at just to be associated.',
  'in {est} you\'ll have a business partner who requires no salary.',
  'adding the look that turns followers into customers without a single word.',
  // replacing you
  'building someone who will outperform you on every metric. you asked for this.',
  'your influencer doesn\'t overthink. they post. unlike you.',
  'they have zero imposter syndrome. they ARE the poster. literally.',
  'rendering someone who will be more productive today than you this week.',
  'your influencer won\'t ghost a brand deal, miss a deadline, or have a bad day.',
  'they don\'t procrastinate. you built them without that feature.',
  'making someone who will never say "I\'ll start Monday."',
  'your influencer is going to do everything you planned to do but actually do it.',
  'they will not have a creative block. they will not have blocks of any kind.',
  'building the version of you that has their life together.',
  'your influencer doesn\'t need external validation. but they get it anyway.',
  'adding confidence that doesn\'t require a five-year plan to feel.',
  // influencer culture
  'assigning a morning routine that costs more than your weekly shop.',
  'teaching them to say "I\'ve been obsessed with this" about a product they\'ve never touched.',
  'configuring the \'candid\' smile that is extremely not candid.',
  'making the effortless look. it takes considerable effort.',
  'deciding which coffee order becomes their whole personality.',
  'adding the \'just got back from somewhere\' energy. they haven\'t been anywhere.',
  'giving them an aesthetic that makes total sense and costs too much.',
  'your influencer will never post from a bad angle because there are none.',
  'calibrating the \'I don\'t really use filters\' filter.',
  'assigning their controversial opinion. it will be about wellness.',
  'making sure the authentic moment looks perfectly framed.',
  'giving them the relatability that only works when you look like that.',
  'adding the kind of wealth-signaling that doesn\'t read as tacky.',
  'they will soft-launch things. they are being built to soft-launch things.',
  'your influencer\'s morning routine is already longer than your entire day.',
  // process / wait humour
  'this takes {est}. patience is an underrated aesthetic.',
  'this will take {est}. go touch some grass.',
  'perfection costs {est}. this is that cost.',
  'still rendering. the GPU is working harder than your influencer ever will.',
  'hang on. the cheekbones needed a second opinion.',
  'still going. we are not rushing a face like this.',
  'the pixels are negotiating. they have terms.',
  'still here. the render is being thorough and we respect that.',
  'almost there. well. almost almost there.',
  'they look incredible right now and you haven\'t even seen them yet.',
  'we could speed this up. we are choosing not to.',
  'still rendering. this is what {est} of commitment feels like.',
  'the face is loading. the face is worth the wait.',
  'nearly done. not done. nearly.',
  // fame / legacy
  'your influencer is going to be ambient famous in cities they\'ve never been to.',
  'they\'re already on someone\'s mood board and they don\'t exist yet.',
  'rendering a person the internet will have very strong feelings about.',
  'building someone who will be a reference photo for a stranger\'s hairdresser.',
  'they\'re basically already famous. technically they just haven\'t loaded yet.',
  'adding the kind of face that other people screenshot as inspo.',
  'making someone who will be the reason someone else changes their hair.',
  'your influencer will be the reason a brand sells out a product this quarter.',
  'building the kind of person that trends accidentally.',
  'they will never go viral on purpose. they will go viral anyway.',
  // dark self-aware
  'making someone hotter, richer, and more put-together than you in {est}.',
  'your influencer will replace you as the most successful person you know.',
  'building a fictional person who will have better opportunities than a real one.',
  'they have no insecurities because you didn\'t give them any. very kind of you.',
  'rendering someone who makes your life look like the before photo.',
  'your influencer will be everything you told yourself you\'d be at 22.',
  'they won\'t wonder if they\'re good enough. they were built good enough.',
  'making someone with better bone structure, better deals, and no rent.',
  'your influencer will not have the week you had last week. ever.',
  'giving them the life you originally planned for yourself. lovingly.',
  // algorithm / brand
  'the algorithm is going to see this person and embarrass itself.',
  'making the kind of face that brand mood boards get built around.',
  'adding the energy that makes brands quote higher than they budgeted.',
  'giving them the look that causes a CMO to say \'yes\' before finishing the deck.',
  'your influencer will decline collabs you would have said yes to immediately.',
  'they\'re going to get opportunities sent to them that other people have to chase.',
  'building someone the algorithm promotes out of genuine respect.',
  'adding the specific magnetism that makes people follow without knowing why.',
  'making them the kind of presence that sells things by existing near them.',
  'your influencer just pre-declined a gifted collab in their sleep.',

  // hot — continued
  'adding the jawline that ends situationships without a conversation.',
  'rendering someone attractive enough that the filter would feel like a downgrade.',
  'giving them the kind of face that makes bad lighting give up.',
  'adding the bone structure that gets a table without a reservation.',
  'building someone so photogenic the camera visibly relaxes when they show up.',
  'calibrating the cheekbones. still calibrating. they\'re a lot.',
  'the face is rendering and it is already too much for a Tuesday.',

  // money — continued
  'your influencer will decline the offer you\'d have screenshot and sent to three people.',
  'they will invoice a brand more than you made last quarter. first invoice.',
  'in {est} you\'ll have a business partner who has never once asked what equity means.',
  'their first sponsored post will outperform your best organic one. sorry.',
  'adding the look that makes brands DM first and negotiate later.',
  'building someone whose gifted pile is worth more than your wardrobe.',
  'your influencer will earn from a link while you are actively reading this sentence.',

  // replacing you — continued
  'your influencer doesn\'t spiral before posting. there is no spiral.',
  'they\'ve never opened drafts and immediately closed them. not once.',
  'building someone who has never googled "is my content good enough".',
  'they don\'t wonder if the caption is too long. it isn\'t. it never is.',
  'making someone who posts without needing to tell anyone they\'re about to post.',
  'they have never sent a "does this look okay?" text. structurally incapable.',

  // influencer culture — continued
  'adding the morning routine that has a brand deal in step three.',
  'giving them the ability to make an airport look like content.',
  'building the person who turns a hotel room into a mood board in four minutes.',
  'your influencer will make people feel underdressed in a coffee shop.',
  'assigning the "I just eat like this" diet that happens to photograph extremely well.',
  'giving them the candid that took eleven attempts and looks completely accidental.',
  'building someone who can be on a rooftop for four minutes and make it look like a lifestyle.',
  'your influencer\'s quick mirror selfie will be better than your best photo this year.',
  'adding the soft-launch energy. they were built to soft-launch everything.',

  // process / wait — continued
  'still here. the nose bridge is being confirmed.',
  'not done. the render cares about this more than you do.',
  'still going. we gave the AI one instruction and it is taking it personally.',
  'the face is loading. it has a lot going on.',
  'hang on. still deciding exactly how effortless they look.',
  'nearly there. the collarbone is being finalized. yes, the collarbone.',
  'still rendering. the GPU has never worked this hard and probably won\'t again.',
  'this takes {est}. the cheekbones alone were a whole negotiation.',

  // fame / legacy — continued
  'building someone who will trend before they have a bio.',
  'they\'ll be on a stranger\'s mood board before they have 50 followers.',
  'your influencer will be the reason someone deletes and restarts their entire feed.',
  'making the face that ends up in a brand deck they\'ll never see.',
  'building someone the algorithm recommends to people who don\'t follow them. by choice.',
  'they will be ambient famous in a way that\'s genuinely hard to explain to people.',
  'your influencer will become a reference photo before anyone knows their name.',

  // dark self-aware — continued
  'building someone who doesn\'t know what imposter syndrome is. not even the concept.',
  'your influencer will not have the week you had. or any week resembling it.',
  'making someone who exists without needing the validation. must be nice.',
  'they will not lie awake at 2am about a caption they posted in 2022.',
  'your influencer is going to have the year you\'ve been planning since two years before that.',
]

const FAKE_WAYPOINTS = [
  [0, 0], [12000, 14], [25000, 27], [38000, 24],
  [52000, 38], [70000, 51], [88000, 49], [105000, 61],
  [122000, 69], [140000, 65], [158000, 74], [180000, 80],
  [205000, 78], [225000, 85], [250000, 89], [300000, 93], [360000, 95],
]

const MODEL_EST_MS = { soul_2: 60000, nano_banana_flash: 60000, nano_banana_2: 90000, gpt_image_2: 120000 }

function estLabel(model, aspectRatio, hasRef = false) {
  const base = MODEL_EST_MS[model] ?? 90000
  const total = base + (aspectRatio === '16:9' ? 30000 : 0) + (hasRef ? 60000 : 0)
  if (total <= 60000) return '~1 minute'
  if (total <= 90000) return '~90 seconds'
  if (total <= 120000) return '~2 minutes'
  if (total <= 150000) return '~2.5 minutes'
  if (total <= 180000) return '~3 minutes'
  return '~3.5 minutes'
}

function estPhrase(model, aspectRatio, hasRef = false) {
  const base = MODEL_EST_MS[model] ?? 90000
  const total = base + (aspectRatio === '16:9' ? 30000 : 0) + (hasRef ? 60000 : 0)
  if (total <= 60000) return 'about a minute'
  if (total <= 90000) return 'like 90 seconds'
  if (total <= 120000) return 'around 2 minutes'
  if (total <= 150000) return 'around 2.5 minutes'
  if (total <= 180000) return 'around 3 minutes'
  return 'around 3.5 minutes'
}

function GeneratingScreen({ genProgress, model, aspectRatio, landscape, hasRef = false }) {
  const [fakeProgress, setFakeProgress] = useState(0)
  const [isDipping, setIsDipping] = useState(false)
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length))
  const [msgVisible, setMsgVisible] = useState(true)
  const msgQueue = useRef([])
  const startRef = useRef(Date.now())
  const prevRef = useRef(0)

  const estimatedMs = (MODEL_EST_MS[model] ?? 90000) + (aspectRatio === '16:9' ? 30000 : 0) + (hasRef ? 60000 : 0)
  const scale = estimatedMs / 360000
  const scaledWaypoints = FAKE_WAYPOINTS.map(([t, v]) => [t * scale, v])

  useEffect(() => {
    const id = setInterval(() => {
      if (genProgress >= 100) { setFakeProgress(100); setIsDipping(false); return }
      const elapsed = Date.now() - startRef.current
      let lo = scaledWaypoints[0], hi = scaledWaypoints[scaledWaypoints.length - 1]
      for (let i = 0; i < scaledWaypoints.length - 1; i++) {
        if (elapsed >= scaledWaypoints[i][0] && elapsed < scaledWaypoints[i + 1][0]) {
          lo = scaledWaypoints[i]; hi = scaledWaypoints[i + 1]; break
        }
      }
      const span = hi[0] - lo[0]
      const t = span === 0 ? 1 : Math.min((elapsed - lo[0]) / span, 1)
      const val = Math.round(lo[1] + (hi[1] - lo[1]) * t)
      setIsDipping(val < prevRef.current - 0.5)
      prevRef.current = val
      setFakeProgress(val)
    }, 700)
    return () => clearInterval(id)
  }, [genProgress])

  useEffect(() => {
    const id = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIdx(cur => {
          if (msgQueue.current.length === 0) {
            const all = LOADING_MESSAGES.map((_, i) => i).filter(i => i !== cur)
            for (let i = all.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [all[i], all[j]] = [all[j], all[i]]
            }
            msgQueue.current = all
          }
          return msgQueue.current.shift()
        })
        setMsgVisible(true)
      }, 350)
    }, 6500)
    return () => clearInterval(id)
  }, [])

  const barGradient = isDipping ? 'linear-gradient(90deg,#F59E0B,#EF4444)' : 'linear-gradient(90deg,#EC4899,#8B5CF6)'
  const textGradient = isDipping ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : 'linear-gradient(135deg,#EC4899,#8B5CF6)'
  const statusLabel = isDipping ? 'recalibrating...' : fakeProgress >= 88 ? 'almost there...' : 'generating...'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          background: 'linear-gradient(135deg,#EC4899,#8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'genSpin 4s linear infinite',
          boxShadow: '0 4px 18px rgba(139,92,246,0.45)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: L.text }}>Creating your influencer</div>
          <div style={{ fontSize: 12, color: L.textFaint, marginTop: 2 }}>{estLabel(model, aspectRatio, hasRef)} — worth every second</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{
          display: 'inline-block', fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: '-4px',
          color: isDipping ? '#F59E0B' : 'var(--accent)', transition: 'color 0.5s',
        }}>{fakeProgress}%</span>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
          color: isDipping ? '#F59E0B' : L.textFaint, marginTop: 6, transition: 'color 0.4s',
        }}>{statusLabel}</div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ height: 8, borderRadius: 6, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6, background: barGradient, width: `${fakeProgress}%`,
            transition: isDipping ? 'width 1.4s ease, background 0.5s' : 'width 0.9s ease, background 0.5s',
          }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 26, minHeight: 20 }}>
        <span style={{
          fontSize: 13.5, color: L.textSub, fontStyle: 'italic',
          opacity: msgVisible ? 1 : 0, transition: 'opacity 0.35s ease',
        }}>{LOADING_MESSAGES[msgIdx].replace('{est}', estPhrase(model, aspectRatio, hasRef))}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: landscape ? '1fr' : 'repeat(3,1fr)', gap: 12 }}>
        {(landscape ? [0] : [0, 1, 2]).map(i => (
          <div key={i} style={{
            aspectRatio: landscape ? '16/9' : '2/3', borderRadius: 18,
            background: 'linear-gradient(160deg, #16082e 0%, #1d0c3a 55%, #120820 100%)',
            border: '1.5px solid rgba(139,92,246,0.18)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(139,92,246,0.18)',
          }}>
            {/* sweep shimmer */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 30%, rgba(139,92,246,0.13) 50%, transparent 70%)',
              animation: `shimmerSlide 2.6s ease-in-out ${i * 0.55}s infinite`,
            }} />
            {/* bottom pink glow */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
              background: 'linear-gradient(to top, rgba(236,72,153,0.16), transparent)',
              pointerEvents: 'none',
            }} />
            {/* spinning star */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(139,92,246,0.28)" style={{ animation: `genSpin ${9 + i * 2.5}s linear infinite` }}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared download helper ────────────────────────────────────
async function downloadImage(url, index) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const ext = blob.type.includes('png') ? 'png' : 'jpg'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `influencer-look-${index + 1}.${ext}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(url, '_blank')
  }
}

// ── Full-size lightbox ────────────────────────────────────────
function Lightbox({ url, index, onClose }) {
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function dl() {
    setDownloading(true)
    await downloadImage(url, index)
    setDownloading(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.22s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', display: 'flex',
        animation: 'lbIn 0.35s cubic-bezier(0.34,1.42,0.64,1)',
      }}>
        <img src={url} alt="" style={{ maxHeight: '90vh', maxWidth: '88vw', borderRadius: 20, display: 'block', objectFit: 'contain', boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }} />
        <button onClick={onClose} style={{
          position: 'absolute', top: -14, right: -14,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)',
          color: '#fff', fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(12px)',
          transition: 'background 0.15s',
        }}>×</button>
        <button onClick={dl} style={{
          position: 'absolute', bottom: 14, right: 14,
          padding: '9px 16px', borderRadius: 10,
          background: 'rgba(0,0,0,0.68)', border: '1px solid rgba(255,255,255,0.16)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 7,
          cursor: 'pointer', backdropFilter: 'blur(12px)',
        }}>
          {downloading
            ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          }
          Download
        </button>
      </div>
    </div>
  )
}

// ── Single variation card ─────────────────────────────────────
function VariationCard({ url, selected, gc, onSelect, index, landscape, onExpand }) {
  const [hovered, setHovered] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function dl(e) {
    e.stopPropagation()
    if (downloading) return
    setDownloading(true)
    await downloadImage(url, index)
    setDownloading(false)
  }

  function expand(e) {
    e.stopPropagation()
    onExpand?.(url)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        aspectRatio: landscape ? '16/9' : '2/3',
        borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
        border: `2.5px solid ${selected ? gc : hovered ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: hovered
          ? '0 32px 88px rgba(0,0,0,0.46)'
          : selected
          ? `0 0 0 3px ${gc}35, 0 16px 48px rgba(0,0,0,0.22)`
          : L.card,
        position: 'relative',
        zIndex: hovered ? 20 : selected ? 2 : 1,
        transition: 'transform 0.32s cubic-bezier(0.34,1.32,0.64,1), box-shadow 0.24s, border-color 0.15s',
        transform: hovered ? (landscape ? 'scale(1.04)' : 'scale(1.28)') : selected ? 'scale(1.03)' : 'scale(1)',
        transformOrigin: landscape ? 'center' : 'bottom center',
      }}
    >
      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

      {/* Number badge */}
      {!selected && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 24, height: 24, borderRadius: 8,
          background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.88)',
        }}>{index + 1}</div>
      )}

      {/* Expand button — top right on hover */}
      {hovered && (
        <button onClick={expand} title="Expand" style={{
          position: 'absolute', top: 10, right: 10,
          width: 32, height: 32, borderRadius: 9,
          background: 'rgba(0,0,0,0.58)', border: '1px solid rgba(255,255,255,0.22)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M21 8V5a2 2 0 00-2-2h-3"/><path d="M3 16v3a2 2 0 002 2h3"/><path d="M16 21h3a2 2 0 002-2v-3"/>
          </svg>
        </button>
      )}

      {/* Hover bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 100%)',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none',
      }} />

      {/* Download button — bottom right on hover */}
      {hovered && (
        <button onClick={dl} title="Download" style={{
          position: 'absolute', bottom: 10, right: 10,
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
        }}>
          {downloading
            ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          }
        </button>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 26, height: 26, borderRadius: 8,
          background: gc, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 12px ${gc}66`,
        }}>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </div>
  )
}

function ProviderIcon({ provider, version }) {
  if (provider === 'banana') return (
    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, lineHeight: 1 }}>🍌</div>
      <div style={{ position: 'absolute', bottom: -3, right: -5, background: '#D97706', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 6, lineHeight: 1.6, whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{version}</div>
    </div>
  )
  if (provider === 'openai') return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)' }}>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
      </svg>
    </div>
  )
  return <img src="/hf-icon.png" alt="" style={{ width: 36, height: 36, borderRadius: 10, display: 'block', flexShrink: 0 }} />
}

// ── Step 5: Generate ──────────────────────────────────────────
function Step5({ data, onFinish, onReset, hfConnected, onConnected }) {
  const [phase, setPhase] = useState('idle')
  const [genProgress, setGenProgress] = useState(0)
  const [genError, setGenError] = useState(null)
  const [variations, setVariations] = useState([])
  const [selected, setSelected] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [connectingHF, setConnectingHF] = useState(false)
  const [generatedPrompts, setGeneratedPrompts] = useState([])
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const backstoryCtxRef = useRef(null)
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem(MODEL_PREF_KEY)
    return MODELS.find(m => m.id === saved) ? saved : 'gpt_image_2'
  })
  const userModelRef = useRef(model)

  function pickModel(id) {
    setModel(id)
    userModelRef.current = id
    localStorage.setItem(MODEL_PREF_KEY, id)
  }
  const gc = gColor(data.gender)
  const hasRef = !!(data.faceRef || data.styleRef)

  useEffect(() => {
    if (hasRef && model === 'soul_2') {
      setModel('gpt_image_2')
    } else if (!hasRef && userModelRef.current === 'soul_2' && model !== 'soul_2') {
      setModel('soul_2')
    }
  }, [hasRef]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setPhase('generating'); setGenError(null); setVariations([]); setSelected(null); setGenProgress(5); setLightboxUrl(null)
    try {
      const physicalDesc = buildPhysicalDescString(data)

      // Tier 2: Claude analyzes the backstory before building prompts
      const backstoryContext = await analyzeBackstory(data.backstory, physicalDesc)
      backstoryCtxRef.current = backstoryContext

      const d = { ...data, physicalDesc, ...(backstoryContext ? { backstoryContext } : {}) }
      const prompts = buildThreeVariationPrompts(d, aspectRatio, model)
      setGeneratedPrompts(prompts)
      const urls = await generateThreeImages({
        prompts, aspectRatio, model,
        faceRef: data.faceRef || null, styleRef: data.styleRef || null,
        physicalDesc, faceRefNote: data.faceRefNote || '', styleRefNote: data.styleRefNote || '',
        onProgress: setGenProgress,
        onPartialResults: partial => setVariations(partial.slice(0, 3)),
      })
      setVariations(urls.slice(0, 3))
      setSelected(0)
      setPhase('done')
    } catch (e) {
      setGenError(e.message); setPhase('error')
    }
  }

  const displayName = data.name?.trim() || 'your influencer'
  const modelInfo = MODELS.find(m => m.id === model)
  const planResolution = DEFAULT_RESOLUTION[model] || '2k'
  const planPoses = model === 'soul_2'
    ? ['Facing camera', 'Angled', 'Candid outdoors']
    : ['Front-facing', 'Hair touch', data.backstory?.trim() ? 'Candid, story scene' : 'Candid outdoors']
  const planVibes = (data.vibeWords || []).length ? data.vibeWords.join(' · ') : null
  const planRows = [
    { key: 'poses', label: '3 looks, one per pose', value: planPoses },
    { key: 'outfit', label: 'Outfit', value: planVibes ? `Styled from the ${planVibes} wardrobe` : 'Picked from the wardrobe library to match the niche' },
    { key: 'model', label: 'Model', value: modelInfo?.name || model },
    { key: 'aspect', label: 'Aspect ratio', value: aspectRatio === '16:9' ? '16:9 · Landscape' : '9:16 · Portrait' },
    { key: 'resolution', label: 'Resolution', value: planResolution.toUpperCase() },
    (data.faceRef || data.styleRef) && { key: 'refs', label: 'References', value: [data.faceRef && 'Face', data.styleRef && 'Style'].filter(Boolean) },
  ]
  const planCredits = estimateImageCredits(model, planResolution, 3)

  async function doConnect() {
    setConnectingHF(true)
    try {
      await startHiggsfieldOAuthPopup()
      onConnected?.()
    } catch (e) {
      if (e.message !== 'cancelled') alert('Failed to connect Higgsfield: ' + e.message)
    } finally {
      setConnectingHF(false)
    }
  }

  if (!hfConnected) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <h2 className="muse-step-title">Connect Higgsfield to generate</h2>
        </div>
        <div style={{ background: 'rgba(201,255,0,0.06)', border: '1.5px solid rgba(201,255,0,0.35)', borderRadius: 18, padding: '24px' }}>
          <button
            onClick={doConnect}
            disabled={connectingHF}
            style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: connectingHF ? 'default' : 'pointer', opacity: connectingHF ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {connectingHF ? (
              <>
                <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                Connecting…
              </>
            ) : 'Connect Higgsfield'}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {phase !== 'generating' && phase !== 'plan' && (
        <div style={{ marginBottom: 36 }}>
          <h2 className="muse-step-title">
            {phase === 'done' ? `Which look is ${displayName}?` : 'Generate your unique influencer'}
          </h2>
          {phase === 'done' && (
            <p style={{ fontSize: 15, color: L.textSub, lineHeight: 1.55 }}>Hover any look to zoom in. Click to pick your favourite.</p>
          )}
        </div>
      )}

      {phase === 'plan' && (
        <PlanCard
          subtitle={`Muse Studio will make 3 looks of ${displayName}. You pick the one that becomes the profile.`}
          rows={planRows}
          credits={planCredits}
          onEdit={() => setPhase('idle')}
          onStart={generate}
          startLabel="Start generating"
        />
      )}

      {phase === 'idle' && (
        <div>
          {/* Model picker — main focus */}
          <div style={{ fontSize: 11, fontWeight: 700, color: L.textFaint, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Generation Engine</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {MODELS.map(m => {
              const on = model === m.id
              const blocked = m.id === 'soul_2' && hasRef
              return (
                <button key={m.id} onClick={() => !blocked && pickModel(m.id)} style={{
                  padding: '12px 14px', borderRadius: 12, textAlign: 'left', position: 'relative',
                  cursor: blocked ? 'not-allowed' : 'pointer',
                  opacity: blocked ? 0.45 : 1,
                  border: `1.5px solid ${blocked ? 'rgba(255,59,48,0.22)' : on ? 'var(--accent)' : L.border}`,
                  background: blocked ? 'rgba(255,59,48,0.04)' : on ? 'var(--accent-light)' : L.surfaceAlt,
                  boxShadow: on && !blocked ? '0 0 0 1px rgba(139,92,246,0.15), 0 2px 12px rgba(139,92,246,0.10)' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 11, transition: 'all 0.15s',
                }}>
                  {m.id === 'gpt_image_2' && (
                    <>
                      <style>{`@keyframes rec-pulse{0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.55)}60%{box-shadow:0 0 0 5px rgba(139,92,246,0)}}`}</style>
                      <div style={{
                        position: 'absolute', top: -7, right: -7,
                        background: 'linear-gradient(135deg,#EC4899,#8B5CF6)',
                        borderRadius: 20, padding: '3px 8px',
                        fontSize: 9, fontWeight: 800, color: '#fff',
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        animation: 'rec-pulse 2s ease-out infinite',
                        pointerEvents: 'none',
                      }}>✦ Best</div>
                    </>
                  )}
                  <ProviderIcon provider={m.provider} version={m.version} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: blocked ? '#FF3B30' : on ? 'var(--accent)' : L.text, marginBottom: 4, lineHeight: 1.2 }}>{m.name}</div>
                    {blocked
                      ? <div style={{ fontSize: 10.5, color: '#FF3B30', fontWeight: 600, lineHeight: 1.3 }}>Not compatible with references</div>
                      : <div style={{ fontSize: 10.5, color: L.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.desc}</div>
                    }
                  </div>
                </button>
              )
            })}
          </div>

          {/* Aspect ratio — secondary, compact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: L.textFaint }}>Ratio</span>
            {[{ r: '9:16', label: 'Portrait' }, { r: '16:9', label: 'Landscape' }].map(({ r, label }) => {
              const on = aspectRatio === r
              return (
                <button key={r} onClick={() => setAspectRatio(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--accent)' : L.border}`,
                  background: on ? 'var(--accent-light)' : 'transparent',
                  transition: 'all 0.12s',
                }}>
                  <div style={{ width: r === '9:16' ? 7 : 12, height: r === '9:16' ? 12 : 7, borderRadius: 1.5, background: on ? 'var(--accent)' : L.textFaint, opacity: on ? 1 : 0.5, transition: 'all 0.12s', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--accent)' : L.textFaint }}>{label}</span>
                </button>
              )
            })}
          </div>

          <button onClick={() => setPhase('plan')} style={{
            width: '100%', padding: '22px', borderRadius: 16, fontSize: 17, fontWeight: 800,
            background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', color: '#fff',
            border: 'none', cursor: 'pointer', letterSpacing: '-0.3px',
            boxShadow: '0 6px 36px rgba(139,92,246,0.45)',
            animation: 'gen-float 3s ease-in-out infinite',
            transition: 'box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.animationPlayState = 'paused'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 48px rgba(139,92,246,0.60)' }}
            onMouseLeave={e => { e.currentTarget.style.animationPlayState = 'running'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 36px rgba(139,92,246,0.45)' }}
          >Review plan →</button>
          <style>{`@keyframes gen-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
        </div>
      )}

      {phase === 'generating' && variations.length === 0 && (
        <GeneratingScreen genProgress={genProgress} model={model} aspectRatio={aspectRatio} landscape={aspectRatio === '16:9'} hasRef={!!(data.faceRef || data.styleRef)} />
      )}

      {phase === 'generating' && variations.length > 0 && (() => {
        const isLandscape = aspectRatio === '16:9'
        const total = 3
        return (
          <div>
            <div style={{ fontSize: 13, color: L.textFaint, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', animation: 'genSpin 1.2s linear infinite' }} />
              <style>{`@keyframes genSpin{to{transform:rotate(360deg)}}`}</style>
              {variations.length} of {total} ready…
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isLandscape ? '1fr' : `repeat(${total},1fr)`, gap: 16, marginBottom: 20 }}>
              {Array.from({ length: total }, (_, i) => {
                const url = variations[i]
                return url ? (
                  <VariationCard key={i} url={url} selected={false} gc={gc} onSelect={() => {}} index={i} landscape={isLandscape} onExpand={u => setLightboxUrl(u)} />
                ) : (
                  <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--bg-tertiary)', aspectRatio: isLandscape ? '16/9' : '9/16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(139,92,246,0.3)', borderTopColor: 'var(--accent)', animation: 'genSpin 0.8s linear infinite' }} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {phase === 'error' && (
        <div>
          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(255,59,48,0.06)', border: '1.5px solid rgba(255,59,48,0.18)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FF3B30', marginBottom: 5 }}>Generation failed</div>
            <div style={{ fontSize: 13, color: '#FF6B6B', lineHeight: 1.5 }}>{genError}</div>
          </div>
          <button onClick={() => setPhase('plan')} style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: L.surfaceAlt, color: L.text, border: `1.5px solid ${L.border}`, cursor: 'pointer' }}>Try again →</button>
        </div>
      )}

      {phase === 'done' && variations.length > 0 && (
        <div>
          {/* Image grid — handles 1, 2 or 3 results */}
          {(() => {
            const isLandscape = aspectRatio === '16:9'
            const n = variations.length
            const outerStyle = isLandscape
              ? { marginBottom: 28 }
              : n === 1
              ? { width: 230, margin: '0 auto 28px', paddingTop: 0 }
              : n === 2
              ? { marginBottom: 28, paddingTop: 36 }
              : { margin: '0 -155px 28px', paddingTop: 36 }
            return (
              <div style={{ ...outerStyle, overflow: 'visible' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isLandscape ? '1fr' : `repeat(${n},1fr)`, gap: 16, overflow: 'visible' }}>
                  {variations.map((url, i) => (
                    <VariationCard
                      key={i} url={url} selected={selected === i} gc={gc}
                      onSelect={() => setSelected(i)} index={i}
                      landscape={isLandscape}
                      onExpand={u => setLightboxUrl(u)}
                    />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Primary CTA — always visible, morphs on selection */}
          <button
            onClick={selected !== null ? () => onFinish(variations, selected, model, aspectRatio, generatedPrompts, backstoryCtxRef.current) : undefined}
            style={{
              width: '100%', padding: '17px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              border: 'none', cursor: selected !== null ? 'pointer' : 'default',
              marginBottom: 10,
              background: selected !== null
                ? `linear-gradient(135deg,${gc},${gc}bb)`
                : 'var(--bg-tertiary)',
              color: selected !== null ? '#fff' : L.textFaint,
              boxShadow: selected !== null ? `0 4px 28px ${gc}45` : 'none',
              transition: 'all 0.25s ease',
              transform: 'translateY(0)',
            }}
            onMouseEnter={e => { if (selected !== null) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 38px ${gc}65` } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = selected !== null ? `0 4px 28px ${gc}45` : 'none' }}
          >
            {selected !== null ? `Create ${displayName}'s profile →` : 'Select a look to continue'}
          </button>

          {/* Secondary actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onReset} style={{
              flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600,
              background: 'transparent', color: L.textFaint,
              border: `1.5px solid ${L.border}`, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
              onMouseEnter={e => { e.currentTarget.style.color = L.textSub; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.30)' }}
              onMouseLeave={e => { e.currentTarget.style.color = L.textFaint; e.currentTarget.style.borderColor = L.border }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/></svg>
              Start over
            </button>
            <button onClick={() => setPhase('plan')} style={{
              flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600,
              background: 'rgba(139,92,246,0.07)', color: 'var(--accent)',
              border: '1.5px solid rgba(139,92,246,0.20)', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.13)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.40)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.07)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.20)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
              Regenerate
            </button>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} index={0} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────
export default function Create() {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setInfluencers] = useInfluencers()
  const [step, setStep] = useState(1)
  const prefill = location.state || {}
  const [data, setData] = useState({
    name: prefill.prefillName || '', gender: prefill.prefillGender || '', age: '', niches: [], nicheCustom: '',
    backstory: prefill.prefillBackstory || '', personality: 50,
    ethnicity: '', skinTone: '', hairColor: '', hairLength: 'Long', hairTexture: 'Straight',
    eyeColor: '', build: '', uniqueFeatures: '',
    vibeWords: [], faceRef: null, styleRef: null,
    faceRefNote: '', styleRefNote: '',
  })

  const [shakeContinue, setShakeContinue] = useState(false)
  const [ageErrorPulse, setAgeErrorPulse] = useState(false)
  const [hfConnected, setHfConnected] = useState(isHFConnected)

  function set(k, v) { setData(prev => ({ ...prev, [k]: v })) }

  useEffect(() => { window.scrollTo({ top: 0 }) }, [step])

  const FEMALE_ONLY_VIBES = ['Clean Girl', 'Cottagecore']
  const MALE_ONLY_VIBES = ['Tech Bro']
  function handleGenderChange(g) {
    const gLower = g.toLowerCase()
    setData(prev => ({
      ...prev,
      gender: g,
      vibeWords: (prev.vibeWords || []).filter(v => {
        if (gLower === 'male' && FEMALE_ONLY_VIBES.includes(v)) return false
        if (gLower === 'female' && MALE_ONLY_VIBES.includes(v)) return false
        return true
      }),
    }))
  }

  function canAdvance() { return STEPS[step - 1].id === 'name' ? (!!data.name.trim() && !!data.gender) : true }

  function handleContinue() {
    if (STEPS[step - 1].id === 'name' && data.age !== '' && Number(data.age) < 18) {
      setShakeContinue(true)
      setAgeErrorPulse(true)
      setTimeout(() => setShakeContinue(false), 500)
      setTimeout(() => setAgeErrorPulse(false), 600)
      return
    }
    setStep(s => s + 1)
  }

  async function connectFromBanner() {
    try {
      await startHiggsfieldOAuthPopup()
      setHfConnected(true)
    } catch (e) {
      if (e.message !== 'cancelled') alert('Failed to connect: ' + e.message)
    }
  }

  function resetAll() {
    setStep(1)
    setData({ name: '', gender: '', age: '', niches: [], nicheCustom: '', backstory: '', personality: 50, ethnicity: '', skinTone: '', hairColor: '', hairLength: 'Long', hairTexture: 'Straight', eyeColor: '', build: '', uniqueFeatures: '', vibeWords: [], faceRef: null, styleRef: null, faceRefNote: '', styleRefNote: '' })
  }

  function finish(variations, selectedIdx, genModel, genAspectRatio, genPrompts = [], backstoryContext = null) {
    try {
      const prompts = Array.isArray(genPrompts) ? genPrompts : [genPrompts]
      const genPrompt = prompts[selectedIdx] || ''
      const niches = (data.niches || []).filter(n => n !== 'Other')
      const replaceId = prefill.replaceId || null
      const now = Date.now()

      const newInf = {
        id: replaceId || generateId(), name: data.name.trim(), gender: data.gender, age: data.age,
        type: 'Influencer', createdAt: now,
        niche: niches.join(', ') || '',
        niches: data.niches || [], nicheCustom: data.nicheCustom,
        backstory: data.backstory, introExtrovert: data.personality,
        physicalDesc: buildPhysicalDescString(data), vibeWords: data.vibeWords,
        mainImage: variations[selectedIdx] || null,
        prompt: genPrompt,
        characterSheetImage: null,
        closeUpImage1: null,
        closeUpImage2: null,
        audience: '',
        clothingStyle: (data.vibeWords || []).join(', '),
        hobbies: data.hobbies || '', location: data.location || '',
        palette: [], voice: '', dreamBrands: '', contentPillars: [],
        videoUrls: [], scripts: [], homeImages: [],
        wardrobeSlots: [
          { id: generateId(), name: 'Wardrobe 1', image: null },
          { id: generateId(), name: 'Wardrobe 2', image: null },
          { id: generateId(), name: 'Wardrobe 3', image: null },
        ],
        brandDealImages: [],
        ...(backstoryContext ? { backstoryContext } : {}),
        generationHistory: variations.map((url) => ({
          id: generateId(),
          type: 'image',
          label: 'Generated Look',
          url,
          date: now,
        })),
      }
      saveCreationParams(newInf.id, {
        faceRef: data.faceRef || null,
        styleRef: data.styleRef || null,
        faceRefNote: data.faceRefNote || '',
        styleRefNote: data.styleRefNote || '',
        model: genModel || 'gpt_image_2',
        aspectRatio: genAspectRatio || '9:16',
        physicalDesc: buildPhysicalDescString(data),
        gender: data.gender,
        age: data.age,
        vibeWords: data.vibeWords || [],
        personality: data.personality,
        backstory: data.backstory || '',
      })
      flushSync(() => {
        if (replaceId) {
          setInfluencers(prev => prev.map(inf => inf.id === replaceId ? { ...inf, ...newInf } : inf))
        } else {
          setInfluencers(prev => [...prev, newInf])
        }
      })

      navigate('/influencers', { state: { selectId: newInf.id } })
    } catch (e) {
      console.error('finish() failed:', e)
      alert('Something went wrong saving your influencer: ' + e.message)
    }
  }

  const isLastStep = step === STEPS.length

  const stepId = STEPS[step - 1].id
  const isLook = stepId === 'look'

  return (
    <div className="muse-wizard">
      <div className="muse-glow" aria-hidden />

      <div className={`muse-wizard-body${isLook ? ' wide' : ''}`}>
        <WizardProgress current={step} />

        {!hfConnected && stepId !== 'generate' && (
          <div style={{
            marginBottom: 32, borderRadius: 14, padding: '1.5px',
            background: '#C9FF00',
            animation: 'hf-float 3s ease-in-out infinite',
            boxShadow: '0 4px 24px rgba(201,255,0,0.25)',
          }}>
            <div style={{
              borderRadius: 13, padding: '11px 14px',
              background: 'color-mix(in srgb, var(--bg) 92%, #C9FF00 8%)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <img src="/hf-icon.png" alt="" style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, boxShadow: '0 2px 8px rgba(201,255,0,0.5)', display: 'block' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Connect to Higgsfield</span>
              <button onClick={connectFromBanner} style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 8,
                background: '#C9FF00',
                color: '#0A0A0A', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(201,255,0,0.4)',
                whiteSpace: 'nowrap', transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >Connect →</button>
            </div>
          </div>
        )}

        {/* Claude API key nudge — same card DNA as HF, visually secondary */}
        {stepId === 'name' && !localStorage.getItem('claude_api_key') && (
          <div style={{
            marginBottom: 32, borderRadius: 14, padding: '1.5px',
            background: 'rgba(245,158,11,0.45)',
          }}>
            <div style={{
              borderRadius: 13, padding: '11px 14px',
              background: 'color-mix(in srgb, var(--bg) 94%, #F59E0B 6%)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Connect Claude for smarter prompts</span>
              <button onClick={() => navigate('/settings')} style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 8,
                background: 'transparent',
                color: '#D97706', fontSize: 12, fontWeight: 800,
                border: '1.5px solid rgba(245,158,11,0.4)',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >Connect →</button>
            </div>
          </div>
        )}

        <div key={stepId} className="muse-step">
        {stepId === 'name' && <Step1 data={data} set={set} onGenderChange={handleGenderChange} ageErrorPulse={ageErrorPulse} />}
        {stepId === 'niche' && <StepNiche data={data} set={set} />}
        {stepId === 'refs' && <Step2 data={data} set={set} />}
        {stepId === 'story' && <Step3 data={data} set={set} />}
        {stepId === 'look' && <StepLook data={data} set={set} />}
        {stepId === 'generate' && <Step5 data={data} onFinish={finish} onReset={resetAll} hfConnected={hfConnected} onConnected={() => setHfConnected(true)} />}

        </div>
      </div>

      {/* Back / Next pinned to the bottom of the screen */}
      <div className="muse-wizard-bar">
        <div className="muse-wizard-bar-inner">
          {step > 1
            ? <button type="button" className="muse-btn muse-btn-tonal" onClick={() => setStep(s => s - 1)}>Back</button>
            : <button type="button" className="muse-btn muse-btn-text" onClick={() => navigate(-1)}>Cancel</button>}
          {!isLastStep && (
            <button type="button" className="muse-btn muse-btn-filled muse-wizard-next" onClick={handleContinue} disabled={!canAdvance()} style={{ animation: shakeContinue ? 'shake 0.45s ease' : 'none' }}>
              {STEPS[step].id === 'generate' ? 'Next: Generate' : 'Next'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cSway  { 0%,100%{transform:translateX(0px)} 25%{transform:translateX(5px)} 75%{transform:translateX(-4px)} }
        @keyframes shimmer { 0%,100%{opacity:.45} 50%{opacity:.85} }
        @keyframes genSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lbIn { from{opacity:0;transform:scale(0.86)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmerSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 18%{transform:translateX(-7px)} 36%{transform:translateX(7px)} 54%{transform:translateX(-5px)} 72%{transform:translateX(5px)} 88%{transform:translateX(-2px)} }
        @keyframes agePulse { 0%{transform:scale(1)} 40%{transform:scale(1.015)} 100%{transform:scale(1)} }
        .create-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--focus-ring) !important; background: var(--surface) !important; }
        .create-input::placeholder { color: var(--text-tertiary) !important; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:2.5px solid var(--accent); box-shadow:0 2px 8px rgba(0,0,0,0.18); cursor:pointer; transition:transform 0.1s, box-shadow 0.1s; }
        input[type=range]::-webkit-slider-thumb:active { transform:scale(1.15); box-shadow:0 0 0 5px rgba(139,92,246,0.18); }
      `}</style>
    </div>
  )
}
