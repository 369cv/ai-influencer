import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useInfluencers, useBrandDeals, generateId } from '../store'
import Lightbox from '../components/Lightbox'
import { compressImage, downloadImage } from '../utils/imageUtils'
import { generateSingleImage, generateThreeImages, initSession, pollAllJobs, getPendingGens, clearPendingGen } from '../utils/higgsfieldGenerate'
import { buildThreeVariationPrompts } from '../utils/systemPrompt'
import { gColor, pLabel } from '../utils/influencerUtils'
import { useTheme } from '../context/theme'
import { isHFConnected } from '../utils/higgsfieldAuth'
import { buildCharSheetPrompt, buildCharSheetPromptWithClaude } from '../utils/charSheetPrompt'
import { exportPersonaBible } from '../utils/personaBible'
import PersonaVoice from '../components/PersonaVoice'
import PostingSchedule from '../components/PostingSchedule'
import InfluencerInsights from '../components/InfluencerInsights'
import InfluencerLooks from '../components/InfluencerLooks'
import ProfileActions from '../components/ProfileActions'
function useMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

// ─────────────────────────────────────────────
// Dark sidebar palette
// Influencer list sidebar — theme tokens (was a fixed dark palette)
const SD = {
  bg:      'var(--bg-secondary)',
  border:  'var(--border-subtle)',
  text:    'var(--text-primary)',
  dim:     'var(--text-tertiary)',
  active:  'var(--nav-active)',
  hover:   'var(--surface-hover)',
  ring:    'var(--border)',
}

// ─────────────────────────────────────────────
// Niche lists
const NICHES_F   = ['Fashion','Beauty','Lifestyle','Wellness','Fitness','Travel','Food & Dining','Home & Decor','Parenting','Entertainment','Other']
const NICHES_M   = ['Fitness','Gaming','Tech','Sports','Finance','Cars & Motors','Travel','Outdoor & Adventure','Food & Dining','Entertainment','Other']
const NICHES_ALL = ['Fashion','Fitness','Lifestyle','Beauty','Tech','Gaming','Travel','Food & Dining','Finance','Entertainment','Wellness','Sports','Other']

const SHEET_RATIOS = [
  { id: '16:9', label: '16:9', sub: 'Recommended', rec: true  },
  { id: '4:3',  label: '4:3',  sub: 'Compact',     rec: false },
  { id: '3:2',  label: '3:2',  sub: 'Balanced',    rec: false },
]

function buildFeatureSheetPrompt(inf) {
  const phys = inf.physicalDesc ? `The subject: ${inf.physicalDesc}. ` : ''
  return `Beauty model feature reference sheet. ${phys}Pure white background throughout. Clinical reference card layout — like a casting or makeup artist reference sheet printed on white paper. Bold black uppercase sans-serif labels above each panel. Clear white gutters between every panel and white margins around the outside.

Layout — 4 rows stacked top to bottom:
Row 1 (full width): one wide panel labelled "EYE" — extreme macro close-up centered tightly on both irises. The irises fill the majority of the frame. Shows exact iris color, pattern, and detail. Lashes visible at edges but irises are the dominant subject.
Row 2 (full width): one wide panel labelled "BROW" — close-up from hairline to mid-nose showing exact brow shape, arch, thickness, hair direction, forehead skin.
Row 3 (two equal side-by-side panels):
  Left — labelled "LIP": close-up from nose base to chin showing exact lip shape, cupid's bow, natural lip color.
  Right — labelled "SKIN TEXTURE": macro close-up of cheek skin showing pores, freckles, natural skin detail, zero retouching.
Row 4 (two equal side-by-side panels):
  Left — labelled "HAIR TEXTURE": close-up of hair strands showing exact color, shine, texture, wave or curl pattern.
  Right — labelled "HANDS": close-up of hand showing nail shape, length, nail color or nail art, knuckle skin detail.

Replicate the reference person's exact features in every panel: precise skin tone, freckle placement, hair color, lip shape, brow arch. Zero beauty retouching — raw photographic detail. White space clearly visible between all panels.

Photorealistic RAW photograph quality, ultra-sharp macro detail in each panel. Shot on Hasselblad 100mm macro lens.`
}

function buildCloseUpPrompt(inf) {
  const phys = inf.physicalDesc ? `The subject: ${inf.physicalDesc}. ` : ''
  return `Professional studio headshot. Subject facing directly forward, eyes looking straight into the camera lens. Framed from shoulders up — head, neck, and upper chest visible. Clean seamless pure white backdrop, soft gradient toward very light grey at edges, no texture, no cast shadows on background.

${phys}Soft diffused studio lighting: two large softboxes at 45-degree angles producing soft, even, shadow-free illumination across the face. Subtle catchlights visible in both eyes. No harsh under-nose or chin shadows. Skin tone reproduced accurately — natural pore texture, subtle imperfections visible, zero retouching.

Replicate every physical detail from the reference image exactly: facial bone structure, unique facial features and natural asymmetries, precise skin tone, freckles, moles, iris color and detail, eyebrow shape, lip shape, hair color, texture and natural fall. The subject must be unmistakably the same individual.

Subject standing straight, head completely level, facing dead-on into the camera — no tilt, no turn, no pose. Eyes looking directly into the lens. Neutral expression, mouth relaxed and closed. No modelling, no attitude, no special pose whatsoever. Identical to a casting reference or identity card photo.

Shot on Phase One IQ4 150MP, 85mm portrait lens, f/2.8, studio strobe. Photorealistic, ultra-sharp facial detail, RAW photograph quality. Studio identity reference portrait.`
}

function buildCharacterSheetPrompt(inf) {
  const phys = inf.physicalDesc ? `The character: ${inf.physicalDesc}. ` : ''
  const style = inf.clothingStyle ? `Outfit: ${inf.clothingStyle}. ` : ''
  return `Professional full-body character turnaround sheet. Pure white background, no background elements whatsoever. Soft neutral studio lighting, perfectly flat and even across all four panels — no shadows, no color cast, no vignette.

${phys}${style}

Single row of four equally sized full-body shots from head to toe, each with a small label in clean sans-serif capitals printed above the figure:
Panel 1 — "FRONT VIEW": character facing directly forward, arms relaxed at sides, feet together.
Panel 2 — "SIDE VIEW": character in perfect left profile, arms at sides.
Panel 3 — "BACK VIEW": character facing directly away, arms relaxed.
Panel 4 — "THREE-QUARTER VIEW": character at 45-degree angle facing forward-right.

Replicate every single physical detail identically across all four panels: exact facial structure and bone structure, unique facial features and natural asymmetries, precise skin tone, real pore texture, natural blemishes, freckles, moles, birthmarks, natural moisture and skin sheen, realistic catchlights in the eyes, exact iris color and detail, exact hair color and texture and styling. Zero beauty retouching — raw skin imperfections must be visible. Same outfit, same proportions, same scale in every panel.

Shot on Hasselblad X2D 100C, photorealistic, ultra-sharp micro detail, RAW photograph quality. Character design sheet, model sheet, orthographic turnaround reference.`
}

// ─────────────────────────────────────────────
// Generation param storage — so Regenerate replays the exact same prompt + ratio
const GP_KEY = 'hf_gen_params'
function saveGenParams(influencerId, slot, params) {
  const d = JSON.parse(localStorage.getItem(GP_KEY) || '{}')
  d[`${influencerId}::${slot}`] = params
  localStorage.setItem(GP_KEY, JSON.stringify(d))
}
function getGenParams(influencerId, slot) {
  const d = JSON.parse(localStorage.getItem(GP_KEY) || '{}')
  return d[`${influencerId}::${slot}`] || null
}

// Creation params — stores faceRef/styleRef/model/etc. saved when influencer was first created
const CREATION_PARAMS_KEY = 'hf_creation_params'
function getCreationParams(influencerId) {
  const d = JSON.parse(localStorage.getItem(CREATION_PARAMS_KEY) || '{}')
  return d[influencerId] || null
}

// ─────────────────────────────────────────────
// Helpers
function getNiches(g)  { return g==='Female'?NICHES_F:g==='Male'?NICHES_M:NICHES_ALL }
function audiencePh(g,n) {
  const nl = n && n!=='Other' ? n.toLowerCase() : null
  if (g==='Female') return `e.g. a woman, 18–34, interested in ${nl||'fashion & beauty'}`
  if (g==='Male')   return `e.g. a man, 20–35, interested in ${nl||'fitness & gaming'}`
  return `e.g. adults, 18–30, interested in ${nl||'lifestyle & entertainment'}`
}
function pColor(v) {
  const l=(a,b,t)=>Math.round(a+(b-a)*t)
  if(v<=50){const t=v/50;return`rgb(${l(251,249,t)},${l(191,115,t)},${l(36,22,t)})`}
  const t=(v-50)/50;return`rgb(${l(249,239,t)},${l(115,68,t)},${l(22,68,t)})`
}
// Profile accent: use first palette color or fall back to gender color
function accent(inf) { return inf?.palette?.[0] || gColor(inf?.gender) }

// Light-or-dark text on accent bg
function accentText(hex) {
  if (!hex || hex.length < 7) return '#fff'
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16)
  return (0.299*r+0.587*g+0.114*b) < 145 ? '#fff' : '#1D1D1F'
}

function completeness(inf) {
  const c = [
    inf.age?.toString().trim(),
    inf.niche,
    inf.location?.trim(),
    inf.backstory?.trim(),
    inf.audience?.trim(),
    inf.physicalDesc?.trim(),
    inf.hobbies?.trim(),
    inf.clothingStyle?.trim(),
    inf.dreamBrands?.trim(),
  ]
  return Math.round(c.filter(Boolean).length / c.length * 100)
}

// ─────────────────────────────────────────────
// Completeness ring
function Ring({ pct, size=42 }) {
  const r=(size-5)/2, c=2*Math.PI*r, off=c-(pct/100)*c
  const col = pct>=80?'#34C759':pct>=50?'#F97316':pct>=25?'#0071E3':'#555'
  return (
    <svg width={size} height={size} style={{position:'absolute',top:-1,left:-1,pointerEvents:'none'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={SD.ring} strokeWidth={2.5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={2.5}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:'stroke-dashoffset 0.5s,stroke 0.3s'}}/>
    </svg>
  )
}

// ─────────────────────────────────────────────
// Context menu
function CtxMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const h = () => onClose()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('click', h, { once: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', h)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div onClick={e=>e.stopPropagation()} style={{
      position:'fixed', top:y, left:x, zIndex:400,
      background:'rgba(28,28,30,0.96)', backdropFilter:'blur(20px)',
      borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
      padding:4, minWidth:170,
    }}>
      {items.map(({label,color,action})=>(
        <button key={label} onClick={()=>{action();onClose()}} style={{
          display:'block', width:'100%', textAlign:'left',
          padding:'9px 14px', borderRadius:8,
          fontSize:13, fontWeight:500,
          color: color||'#F4F4F5', background:'transparent', transition:'background 0.1s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
        >{label}</button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Hero banner — clean profile card
// Avatar image that falls back to the influencer's initial when the image fails to load
// (expired or blocked URL), instead of the browser's broken-image icon.
function AvatarImg({ src, fallback }) {
  const [bad, setBad] = useState(false)
  return src && !bad ? <img src={src} alt="" onError={() => setBad(true)} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : fallback
}

function HeroBanner({ influencer, pct, onUpdate }) {
  const ac = accent(influencer)
  const gc = gColor(influencer.gender)
  const r = 33, c = 2*Math.PI*r, off = c*(1-pct/100)
  const ringColor = pct>=80?'#34C759':pct>=50?'#F97316':'#0071E3'
  const isMobile = useMobile()
  const [editingTag, setEditingTag] = useState(false)
  const [tagDraft, setTagDraft] = useState(influencer.tag || '')

  return (
    <div style={{
      background:'var(--surface)',
      borderRadius:16,
      border:'1px solid var(--border-subtle)',
      boxShadow:'var(--shadow-sm)',
      overflow:'hidden',
      flexShrink:0,
    }}>
      {/* Accent stripe */}
      <div style={{height:3,background:`linear-gradient(to right, ${ac}, ${ac}55, transparent)`}}/>

      <div style={{padding:isMobile?'14px 16px':'18px 22px',display:'flex',alignItems:'center',gap:isMobile?12:18,flexWrap:isMobile?'wrap':'nowrap'}}>
        {/* Avatar + completion ring */}
        <div style={{position:'relative',width:74,height:74,flexShrink:0}}>
          <svg width={74} height={74} style={{position:'absolute',top:0,left:0,pointerEvents:'none'}}>
            <circle cx={37} cy={37} r={r} fill="none" stroke="var(--border)" strokeWidth={2.5}/>
            <circle cx={37} cy={37} r={r} fill="none" stroke={ringColor} strokeWidth={2.5}
              strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
              transform="rotate(-90 37 37)"
              style={{transition:'stroke-dashoffset 0.5s,stroke 0.3s'}}/>
          </svg>
          <div style={{
            position:'absolute',top:5,left:5,width:64,height:64,
            borderRadius: influencer.mainImage ? '50%' : 14,
            overflow:'hidden',
            background:`${ac}1A`,
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'border-radius 0.2s',
          }}>
            <AvatarImg key={influencer.mainImage} src={influencer.mainImage} fallback={<span style={{fontSize:24,fontWeight:800,color:ac,letterSpacing:'-1px'}}>{influencer.name[0]?.toUpperCase()}</span>}/>
          </div>
        </div>

        {/* Name + meta */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.5px',color:'var(--text-primary)',lineHeight:1.2}}>
              {influencer.name}
            </div>
            {editingTag ? (
              <input
                autoFocus
                value={tagDraft}
                onChange={e=>setTagDraft(e.target.value)}
                onBlur={()=>{setEditingTag(false);onUpdate({tag:tagDraft.trim()})}}
                onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape'){setEditingTag(false);onUpdate({tag:tagDraft.trim()})}}}
                placeholder="Add title…"
                style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:20,border:'1.5px solid color-mix(in srgb, var(--accent) 50%, transparent)',background:'color-mix(in srgb, var(--accent) 7%, transparent)',color:'var(--accent)',outline:'none',fontFamily:'inherit',width:140}}
              />
            ) : (
              <button
                onClick={()=>{setTagDraft(influencer.tag||'');setEditingTag(true)}}
                style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:20,
                  border:`1.5px solid ${influencer.tag?'color-mix(in srgb, var(--accent) 35%, transparent)':'var(--border)'}`,
                  background:influencer.tag?'color-mix(in srgb, var(--accent) 7%, transparent)':'transparent',
                  color:influencer.tag?'var(--accent)':'var(--text-tertiary)',
                  cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                }}
              >{influencer.tag || '+ Add title'}</button>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
            {influencer.gender&&(
              <span style={{
                fontSize:12,fontWeight:600,color:gc,
                background:`${gc}14`,padding:'3px 10px',borderRadius:20,
              }}>{influencer.gender}</span>
            )}
            {influencer.niche&&influencer.niche!=='Other'&&(
              <span style={{fontSize:12,color:'var(--text-secondary)',background:'var(--bg-tertiary)',padding:'3px 10px',borderRadius:20}}>
                {influencer.niche}
              </span>
            )}
            {influencer.age&&(
              <span style={{fontSize:12,color:'var(--text-tertiary)'}}>Age {influencer.age}</span>
            )}
          </div>
          <div style={{marginTop:8,fontSize:11,color:'var(--text-tertiary)',fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
            <span style={{color:ringColor,fontWeight:700}}>{pct}%</span>
            <span>profile complete</span>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Character sheet slot with inline generation
function GenLoadingOverlay({ elapsed, onCancel, maxLabel = '5 min' }) {
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:5, borderRadius:10,
      background:'rgba(10,10,18,0.82)', backdropFilter:'blur(6px)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10,
    }}>
      <div style={{
        width:32, height:32, borderRadius:'50%',
        border:'2.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
        borderTopColor:'#A78BFA',
        animation:'spin 0.9s linear infinite',
      }}/>
      <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.9)',letterSpacing:'0.2px'}}>Generating…</div>
      <div style={{fontSize:10,color:'rgba(255,255,255,0.38)',textAlign:'center',lineHeight:1.5}}>
        Up to {maxLabel}<br/>
        <span style={{color:'rgba(255,255,255,0.55)',fontVariantNumeric:'tabular-nums'}}>{timeStr}</span>
      </div>
      {onCancel && (
        <button onClick={onCancel} style={{
          marginTop:2, padding:'5px 14px', borderRadius:980, fontSize:11, fontWeight:600,
          background:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.6)',
          border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(4px)',
          transition:'background 0.15s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.10)'}
        >Cancel</button>
      )}
    </div>
  )
}

function CharacterSheetSlot({ influencer, onSave, onLightbox }) {
  const [open, setOpen] = useState(false)
  const [ratio, setRatio] = useState('16:9')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [err, setErr] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const cancelRef = useRef(false)
  const value = influencer.characterSheetImage

  function handleFileDrop(file) {
    if (!file || !file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => compressImage(ev.target.result).then(v => { onSave(v); setOpen(false) }).catch(console.error)
    r.readAsDataURL(file)
  }

  useEffect(() => {
    if (!loading) { setElapsed(0); return }
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [loading])

  // Resume any in-progress job that survived a page reload
  useEffect(() => {
    const job = getPendingGens().find(j => j.influencerId === influencer.id && j.slot === 'characterSheetImage')
    if (!job) { setLoading(false); return }
    const secondsIn = Math.floor((Date.now() - job.startedAt) / 1000)
    setElapsed(secondsIn)
    setLoading(true)
    initSession()
      .then(() => pollAllJobs(job.jobIds, 1, () => {}, 16))
      .then(urls => {
        if (urls[0]) { onSave(urls[0]); setOpen(false) }
        else setErr('No image returned — please try again')
      })
      .catch(e => setErr(e.message || 'Resumed generation failed'))
      .finally(() => { clearPendingGen(influencer.id, 'characterSheetImage'); setLoading(false) })
  }, [influencer.id]) // eslint-disable-line

  function cancelGeneration() {
    cancelRef.current = true
    clearPendingGen(influencer.id, 'characterSheetImage')
    setLoading(false); setElapsed(0)
  }

  async function generate(storedParams = null) {
    if (!influencer.mainImage) { setErr('Upload a main image first — used as the face reference.'); return }
    cancelRef.current = false
    setLoading(true); setErr(null)
    const prompt = storedParams?.prompt ?? buildCharacterSheetPrompt(influencer)
    const ar     = storedParams?.aspectRatio ?? ratio
    try {
      const url = await generateSingleImage({
        prompt, aspectRatio: ar, referenceImage: influencer.mainImage, onProgress: () => {},
        pendingKey: { influencerId: influencer.id, slot: 'characterSheetImage' },
        isCancelled: () => cancelRef.current,
      })
      if (cancelRef.current) return
      if (url) {
        saveGenParams(influencer.id, 'characterSheetImage', { prompt, aspectRatio: ar, usedReference: true })
        onSave(url); setOpen(false)
      } else setErr('No image returned — please try again')
    } catch(e) { if (!cancelRef.current) setErr(e.message || 'Generation failed') }
    finally { if (!cancelRef.current) setLoading(false) }
  }

  function regenerate() {
    const stored = getGenParams(influencer.id, 'characterSheetImage')
    generate(stored)
  }

  return (
    <div>
      {/* Image slot */}
      <div style={{position:'relative',width:'100%',aspectRatio:'3/4',borderRadius:10,overflow:'hidden',
        boxShadow: dragOver ? '0 0 0 2px var(--accent), 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent)' : loading ? '0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent), 0 0 18px color-mix(in srgb, var(--accent) 18%, transparent)' : 'none',
        transition:'box-shadow 0.3s',
      }}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files[0]) }}>
        {loading && <GenLoadingOverlay elapsed={elapsed} onCancel={cancelGeneration}/>}
        {value ? (
          <>
            <img src={value} alt="Character sheet" onClick={onLightbox} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:10,cursor:'zoom-in',display:'block',background:'var(--bg-tertiary)'}}/>

            {/* Delete — top right on hover */}
            <button onClick={()=>onSave(null)} style={{
              position:'absolute',top:7,right:7,width:22,height:22,borderRadius:'50%',
              background:'rgba(0,0,0,0.45)',color:'#fff',fontSize:12,
              display:'flex',alignItems:'center',justifyContent:'center',
              backdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.12)',
              opacity: hovered ? 1 : 0, transition:'opacity 0.15s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,50,50,0.85)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,0,0,0.45)'}}>×</button>

            {/* Hover action bar — bottom: Generate + Replace + Download */}
            <div style={{
              position:'absolute',bottom:0,left:0,right:0,
              padding:'28px 8px 8px',
              background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
              display:'flex',gap:5,
              opacity: hovered ? 1 : 0, transition:'opacity 0.2s',
            }}>
              <button onClick={regenerate} disabled={loading} style={{
                flex:1.4,padding:'6px 0',borderRadius:7,fontSize:11,fontWeight:700,
                background:'linear-gradient(135deg,rgba(236,72,153,0.7),color-mix(in srgb, var(--accent) 70%, transparent))',color:'#fff',
                backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.18)',
                transition:'opacity 0.15s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.opacity='0.82'}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='1'}}>{loading?'···':'Regenerate'}</button>
              <button onClick={()=>fileRef.current.click()} style={{
                flex:1,padding:'6px 0',borderRadius:7,fontSize:11,fontWeight:600,
                background:'rgba(255,255,255,0.15)',color:'#fff',
                backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.18)',
                transition:'background 0.15s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.25)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)'}}>Replace</button>
              <button onClick={e=>{e.stopPropagation();downloadImage(value,`${influencer.name||'character'}-sheet.jpg`)}} style={{
                flex:0.6,padding:'6px 0',borderRadius:7,fontSize:11,fontWeight:600,
                background:'rgba(255,255,255,0.15)',color:'#fff',
                backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.18)',
                transition:'background 0.15s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.25)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)'}}>↓</button>
            </div>
          </>
        ) : (
          <div style={{width:'100%',height:'100%',borderRadius:10,border:'1.5px dashed var(--border)',background:'var(--bg-tertiary)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
            <span style={{fontSize:20,opacity:0.22}}>+</span>
            <span style={{fontSize:11,color:'var(--text-tertiary)',fontWeight:500}}>Character sheet</span>
            {/* Generate Sheet — inside slot at bottom */}
            <button onClick={e=>{e.stopPropagation();setOpen(o=>!o)}} style={{
              position:'absolute',bottom:10,left:10,right:10,
              padding:'7px 0',borderRadius:8,fontSize:11,fontWeight:700,
              background:'var(--color-brand-gradient)',color:'#fff',
              boxShadow:'0 2px 10px color-mix(in srgb, var(--accent) 28%, transparent)',transition:'opacity 0.15s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.opacity='0.85'}}
              onMouseLeave={e=>{e.currentTarget.style.opacity='1'}}>Generate Sheet</button>
          </div>
        )}
        {/* Sliding progress bar */}
        {loading && (
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2, zIndex:10,
            backgroundImage:'linear-gradient(90deg, transparent, var(--color-brand-violet), var(--color-brand-blue), transparent)',
            backgroundSize:'300% 100%',
            animation:'progress-slide 1.6s linear infinite',
          }}/>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>compressImage(ev.target.result).then(onSave).catch(console.error);r.readAsDataURL(f);e.target.value=''}}/>
      </div>

      {/* Inline panel */}
      {open && (
        <div style={{marginTop:8,padding:'12px 14px',borderRadius:10,background:'var(--surface)',border:'1.5px solid var(--border)',display:'flex',flexDirection:'column',gap:10}}>
          {/* Ratio picker — hidden during generation */}
          {!loading && <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6}}>Aspect Ratio</div>
            <div style={{display:'flex',gap:6}}>
              {SHEET_RATIOS.map(r=>(
                <button key={r.id} onClick={()=>setRatio(r.id)} style={{
                  flex:1,padding:'6px 4px',borderRadius:7,fontSize:11,fontWeight:600,
                  border:`1.5px solid ${ratio===r.id?'var(--accent)':'var(--border)'}`,
                  background:ratio===r.id?'color-mix(in srgb, var(--accent) 10%, transparent)':'var(--bg)',
                  color:ratio===r.id?'var(--accent)':'var(--text-secondary)',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:1,
                }}>
                  <span>{r.label}</span>
                  <span style={{fontSize:9,fontWeight:500,opacity:0.7}}>{r.rec?'✦ '+r.sub:r.sub}</span>
                </button>
              ))}
            </div>
          </div>}

          {err && <div style={{fontSize:11,color:'var(--color-status-danger)',lineHeight:1.4}}>{err}</div>}

          <button onClick={generate} disabled={loading} style={{
            padding:'9px 0',borderRadius:8,fontSize:13,fontWeight:700,
            background:loading?'var(--bg-tertiary)':'var(--color-brand-gradient)',
            color:loading?'var(--text-tertiary)':'#fff',
            boxShadow:loading?'none':'0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent)',
            transition:'all 0.15s',
          }}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Close-up slot with inline generation
function CloseUpSlot({ influencer, imageKey, label, onSave, onLightbox, promptFn = buildCloseUpPrompt, genAspectRatio = '4:5', fit = 'cover' }) {
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [err, setErr] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const cancelRef = useRef(false)
  const value = influencer[imageKey]

  function handleFileDrop(file) {
    if (!file || !file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => compressImage(ev.target.result).then(onSave).catch(console.error)
    r.readAsDataURL(file)
  }

  useEffect(() => {
    if (!loading) { setElapsed(0); return }
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [loading])

  // Resume any in-progress job that survived a page reload
  useEffect(() => {
    const job = getPendingGens().find(j => j.influencerId === influencer.id && j.slot === imageKey)
    if (!job) { setLoading(false); return }
    const secondsIn = Math.floor((Date.now() - job.startedAt) / 1000)
    setElapsed(secondsIn)
    setLoading(true)
    initSession()
      .then(() => pollAllJobs(job.jobIds, 1, () => {}, 16))
      .then(urls => {
        if (urls[0]) onSave(urls[0])
        else setErr('No image returned — please try again')
      })
      .catch(e => setErr(e.message || 'Resumed generation failed'))
      .finally(() => { clearPendingGen(influencer.id, imageKey); setLoading(false) })
  }, [influencer.id, imageKey]) // eslint-disable-line

  function cancelGeneration() {
    cancelRef.current = true
    clearPendingGen(influencer.id, imageKey)
    setLoading(false); setElapsed(0)
  }

  async function generate(storedParams = null) {
    if (!influencer.mainImage) { setErr('Upload a main image first.'); return }
    cancelRef.current = false
    setLoading(true); setErr(null)
    const prompt = storedParams?.prompt ?? promptFn(influencer)
    const ar     = storedParams?.aspectRatio ?? genAspectRatio
    try {
      const url = await generateSingleImage({
        prompt, aspectRatio: ar,
        referenceImage: influencer.mainImage,
        onProgress: () => {},
        pendingKey: { influencerId: influencer.id, slot: imageKey },
        isCancelled: () => cancelRef.current,
      })
      if (cancelRef.current) return
      if (url) {
        saveGenParams(influencer.id, imageKey, { prompt, aspectRatio: ar, usedReference: true })
        onSave(url)
      } else setErr('No image returned — please try again')
    } catch(e) { if (!cancelRef.current) setErr(e.message || 'Generation failed') }
    finally { if (!cancelRef.current) setLoading(false) }
  }

  function regenerate() {
    const stored = getGenParams(influencer.id, imageKey)
    generate(stored)
  }

  return (
    <div>
      <div
        style={{
          position:'relative', width:'100%', aspectRatio:'3/2', borderRadius:10, overflow:'hidden',
          boxShadow: dragOver ? '0 0 0 2px var(--accent), 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent)' : loading ? '0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent), 0 0 18px color-mix(in srgb, var(--accent) 18%, transparent)' : 'none',
          transition:'box-shadow 0.3s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files[0]) }}
      >
        {loading && <GenLoadingOverlay elapsed={elapsed} onCancel={cancelGeneration} maxLabel="6 min"/>}
        {value ? (
          <>
            <img
              src={value} alt={label} onClick={onLightbox}
              style={{ width:'100%', height:'100%', objectFit:fit, borderRadius:10, cursor:'zoom-in', display:'block', background:'var(--bg-tertiary)' }}
            />
            {/* Hover action bar — bottom: Generate + Replace + ↓ */}
            <div style={{
              position:'absolute', bottom:0, left:0, right:0,
              padding:'28px 8px 8px',
              background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
              display:'flex', gap:5,
              opacity: hovered ? 1 : 0, transition:'opacity 0.2s',
            }}>
              <button
                onClick={regenerate} disabled={loading}
                style={{
                  flex:1.4, padding:'5px 0', borderRadius:6, fontSize:10, fontWeight:700,
                  background: loading ? 'rgba(0,0,0,0.45)' : 'linear-gradient(135deg,rgba(236,72,153,0.7),color-mix(in srgb, var(--accent) 70%, transparent))',
                  color:'#fff', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)',
                  transition:'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >{loading ? '···' : 'Regenerate'}</button>
              <button
                onClick={() => fileRef.current.click()}
                style={{
                  flex:1, padding:'5px 0', borderRadius:6, fontSize:10, fontWeight:600,
                  background:'rgba(255,255,255,0.15)', color:'#fff',
                  backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.18)',
                  transition:'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              >Replace</button>
              <button
                onClick={e => { e.stopPropagation(); downloadImage(value, `${influencer.name || 'closeup'}-${label}.jpg`) }}
                style={{
                  flex:0.6, padding:'5px 0', borderRadius:6, fontSize:10, fontWeight:600,
                  background:'rgba(255,255,255,0.15)', color:'#fff',
                  backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.18)',
                  transition:'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              >↓</button>
            </div>
          </>
        ) : (
          <div style={{
            width:'100%', height:'100%', borderRadius:10,
            border:'1.5px dashed var(--border)', background:'var(--bg-tertiary)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:6,
          }}>
            <span style={{ fontSize:18, opacity:0.22 }}>+</span>
            <span style={{ fontSize:11, color:'var(--text-tertiary)', fontWeight:500 }}>{label}</span>
            {/* Generate — inside slot at bottom */}
            <button
              onClick={e => { e.stopPropagation(); generate() }}
              disabled={loading}
              style={{
                position:'absolute', bottom:8, left:8, right:8,
                padding:'6px 0', borderRadius:7, fontSize:11, fontWeight:700,
                background: loading ? 'var(--bg-tertiary)' : 'var(--color-brand-gradient)',
                color: loading ? 'var(--text-tertiary)' : '#fff',
                boxShadow: loading ? 'none' : '0 2px 10px color-mix(in srgb, var(--accent) 28%, transparent)',
                transition:'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >{loading ? '···' : 'Generate'}</button>
          </div>
        )}
        {/* Sliding progress bar */}
        {loading && (
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2, zIndex:10,
            backgroundImage:'linear-gradient(90deg, transparent, var(--color-brand-violet), var(--color-brand-blue), transparent)',
            backgroundSize:'300% 100%',
            animation:'progress-slide 1.6s linear infinite',
          }}/>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => {
            const f = e.target.files[0]; if (!f) return
            const r = new FileReader()
            r.onload = ev => compressImage(ev.target.result).then(onSave).catch(console.error)
            r.readAsDataURL(f); e.target.value = ''
          }}/>
      </div>
      {err && <div style={{ fontSize:11, color:'var(--color-status-danger)', marginTop:5, lineHeight:1.4 }}>{err}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main image slot with hover bar (Replace / Download)
function MainImageSlot({ influencer, onChange, onLightbox }) {
  const fileRef = useRef()
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const value = influencer.mainImage

  function handleFileDrop(file) {
    if (!file || !file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => compressImage(ev.target.result).then(onChange).catch(console.error)
    r.readAsDataURL(file)
  }

  useEffect(() => {
    if (!loading) { setElapsed(0); return }
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [loading])

  async function regenerate() {
    const params = getCreationParams(influencer.id)
    if (!params) {
      alert('No creation data found — this influencer was created before regeneration was supported. Try replacing the image manually.')
      return
    }
    setLoading(true)
    try {
      const prompts = buildThreeVariationPrompts(
        { ...params, name: influencer.name },
        params.aspectRatio || '9:16',
        params.model || 'gpt_image_2'
      )
      const onePrompt = prompts[Math.floor(Math.random() * prompts.length)]
      const urls = await generateThreeImages({
        prompts: [onePrompt],
        aspectRatio: params.aspectRatio || '9:16',
        model: params.model || 'gpt_image_2',
        faceRef: params.faceRef || null,
        styleRef: params.styleRef || null,
        physicalDesc: params.physicalDesc || '',
        faceRefNote: params.faceRefNote || '',
        styleRefNote: params.styleRefNote || '',
        onProgress: () => {},
      })
      if (urls[0]) onChange(urls[0])
      else alert('No image returned — please try again')
    } catch (e) {
      alert('Regeneration failed: ' + (e.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden',
          boxShadow: dragOver ? '0 0 0 2px var(--accent), 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent)' : loading ? '0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent), 0 0 18px color-mix(in srgb, var(--accent) 18%, transparent)' : 'none',
          transition: 'box-shadow 0.3s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files[0]) }}
      >
        {loading && <GenLoadingOverlay elapsed={elapsed} maxLabel="5 min 30 sec" />}
        {value ? (
          <>
            <img src={value} alt="Main image" onClick={onLightbox}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', display: 'block' }} />
            {/* Delete — top right on hover */}
            <button onClick={() => onChange(null)} style={{
              position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.12)',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,50,50,0.85)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)' }}>×</button>
            {/* Hover action bar — Regenerate + Replace + Download */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '28px 8px 8px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
              display: 'flex', gap: 5,
              opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
            }}>
              <button onClick={regenerate} disabled={loading} style={{
                flex: 1.4, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 700,
                background: 'linear-gradient(135deg,rgba(236,72,153,0.7),color-mix(in srgb, var(--accent) 70%, transparent))', color: '#fff',
                backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)',
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>{loading ? '···' : 'Regenerate'}</button>
              <button onClick={() => fileRef.current.click()} style={{
                flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}>Replace</button>
              <button onClick={e => { e.stopPropagation(); downloadImage(value, `${influencer.name || 'main'}-image.jpg`) }} style={{
                flex: 0.6, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}>↓</button>
            </div>
            {loading && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, zIndex: 10,
                backgroundImage: 'linear-gradient(90deg, transparent, var(--color-brand-violet), var(--color-brand-blue), transparent)',
                backgroundSize: '300% 100%',
                animation: 'progress-slide 1.6s linear infinite',
              }} />
            )}
          </>
        ) : (
          <div onClick={() => fileRef.current.click()} style={{
            width: '100%', height: '100%', borderRadius: 10,
            border: '1.5px dashed var(--border)', background: 'var(--bg-tertiary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 5, transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <span style={{ fontSize: 20, opacity: 0.22 }}>+</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>Main image</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files[0]; if (!f) return
            const r = new FileReader()
            r.onload = ev => compressImage(ev.target.result).then(onChange).catch(console.error)
            r.readAsDataURL(f); e.target.value = ''
          }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Field helpers
function FL({ children }) {
  return <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{children}</div>
}
function FI({ value, onChange, placeholder }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{width:'100%',padding:'10px 14px',borderRadius:'var(--radius-sm)',border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:14,color:'var(--text-primary)'}}/>
}
// ─────────────────────────────────────────────
// Gender buttons
const GM = {
  Female: {icon: '',color:'#EC4899',bg:'rgba(236,72,153,0.08)',border:'#EC4899'},
  Male:   {icon: '',color:'#3B82F6',bg:'rgba(59,130,246,0.08)',border:'#3B82F6'},
}
function GenderButtons({ value, onChange }) {
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {Object.entries(GM).map(([g,m])=>{
        const active=value===g
        return (
          <button key={g} onClick={()=>onChange(g)} style={{
            padding:'4px 11px',borderRadius:20,fontSize:12,fontWeight:600,
            border:`1.5px solid ${active?m.border:'var(--border)'}`,
            background:active?m.bg:'transparent',color:active?m.color:'var(--text-tertiary)',
            transition:'all 0.15s',display:'flex',alignItems:'center',gap:4,
            cursor:'pointer',whiteSpace:'nowrap',
          }}>
            {m.icon && <span style={{fontSize:11}}>{m.icon}</span>}
            <span>{g}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Color palette
const DEFAULT_PALETTES = {
  Female:['#F9A8D4','#FBCFE8','#E879F9','#BE185D'],
  Male:['#93C5FD','#BFDBFE','#3B82F6','#1E3A8A'],
}
function ColorPalette({ palette=[], onChange, gender }) {
  const defs = DEFAULT_PALETTES[gender]||['#E5E7EB','#D1D5DB','#9CA3AF','#6B7280']
  const cols = palette.length===4?palette:defs
  return (
    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      {[0,1,2,3].map(i=>(
        <label key={i} style={{cursor:'pointer',position:'relative'}}>
          <div style={{width:30,height:30,borderRadius:8,background:cols[i],border:'2px solid rgba(0,0,0,0.1)',boxShadow:'0 1px 4px rgba(0,0,0,0.12)',transition:'transform 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.15)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)'}}/>
          <input type="color" value={cols[i]} onChange={e=>{const n=[...cols];n[i]=e.target.value;onChange(n)}}
            style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0,cursor:'pointer',border:'none',padding:0}}/>
        </label>
      ))}
      <button onClick={()=>onChange(defs)} style={{padding:'4px 9px',borderRadius:7,border:'1px solid var(--border)',fontSize:11,fontWeight:500,color:'var(--text-tertiary)',background:'transparent',cursor:'pointer'}}>Reset</button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Reusable tile for the description grid
function InfoCell({ label, icon, children, span }) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      style={{
        background: focused ? 'var(--surface)' : 'var(--bg)',
        borderRadius: 12,
        padding: '13px 16px',
        border: `1.5px solid ${focused ? 'var(--accent)' : 'transparent'}`,
        boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.09)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        gridColumn: span ? `span ${span}` : undefined,
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <div style={{
        fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 7,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {icon && <span style={{ fontSize: 11 }}>{icon}</span>}
        {label}
      </div>
      {children}
    </div>
  )
}

// Bare input — no box, just text
function BareInput({ value, onChange, placeholder, multiline, rows = 3 }) {
  const s = {
    width: '100%', border: 'none', background: 'transparent',
    padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
    outline: 'none', resize: multiline ? 'vertical' : 'none',
    lineHeight: 1.6,
  }
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={s}/>
    : <input value={value} onChange={onChange} placeholder={placeholder} style={s}/>
}

// ─────────────────────────────────────────────
// Overview form
function DescriptionForm({ influencer, onUpdate }) {
  const u = (k, v) => onUpdate(influencer.id, { [k]: v })
  const niches = getNiches(influencer.gender)
  const aPh = audiencePh(influencer.gender, influencer.niche)
  const pv = influencer.introExtrovert ?? 50

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Identity ── */}
      <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Identity</div>
        <div style={{ marginBottom: 12 }}>
          <GenderButtons value={influencer.gender ?? ''} onChange={v => u('gender', v)}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 5 }}>Age</div>
            <input value={influencer.age ?? ''} onChange={e => u('age', e.target.value)} placeholder="—"
              style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}/>
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>Niche</div>
            <select value={niches.includes(influencer.niche) ? influencer.niche : (influencer.niche ? 'Other' : '')} onChange={e => u('niche', e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: influencer.niche ? 'var(--text-primary)' : 'var(--text-tertiary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
              <option value="" disabled>Select…</option>
              {niches.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>Location</div>
            <BareInput value={influencer.location ?? ''} onChange={e => u('location', e.target.value)} placeholder="e.g. NYC"/>
          </div>
        </div>
      </div>

      {/* ── Backstory ── */}
      <InfoCell label="Backstory" icon="">
        <BareInput
          value={influencer.backstory ?? ''}
          onChange={e => u('backstory', e.target.value)}
          placeholder="Who are they? Where are they from? What drives them?"
          multiline rows={4}
        />
      </InfoCell>

      {/* ── Personality ── */}
      <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Personality</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pColor(pv) }}>{pLabel(pv)}</span>
        </div>
        <input type="range" min={0} max={100} value={pv} onChange={e => u('introExtrovert', Number(e.target.value))}
          style={{ width: '100%', height: 5, borderRadius: 3, background: 'linear-gradient(to right,#FBBF24,#F97316,#EF4444)', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}/>
        <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2.5px solid ${pColor(pv)};box-shadow:0 1px 4px rgba(0,0,0,.15);cursor:pointer;}`}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Introvert</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Extrovert</span>
        </div>
      </div>

      {/* ── Target Audience ── */}
      <InfoCell label="Target Audience" icon="">
        <BareInput value={influencer.audience ?? ''} onChange={e => u('audience', e.target.value)} placeholder={aPh}/>
      </InfoCell>

      {/* ── Physical ── */}
      {influencer.physicalDesc && (
        <InfoCell label="Physical Description" icon="">
          <BareInput value={influencer.physicalDesc ?? ''} onChange={e => u('physicalDesc', e.target.value)} placeholder="Physical appearance…"/>
        </InfoCell>
      )}

      {/* ── Lifestyle ── */}
      <div className="desc-grid-2">
        <InfoCell label="Hobbies & Interests" icon="">
          <BareInput value={influencer.hobbies ?? ''} onChange={e => u('hobbies', e.target.value)} placeholder="e.g. Yoga, travel, photography…" multiline rows={2}/>
        </InfoCell>
        <InfoCell label="Aesthetic / Style Vibe" icon="">
          <BareInput value={influencer.clothingStyle ?? ''} onChange={e => u('clothingStyle', e.target.value)} placeholder="e.g. Minimalist, Old Money…" multiline rows={2}/>
        </InfoCell>
      </div>

      {/* ── Brand ── */}
      <div className="desc-grid-2">
        <InfoCell label="Dream Brands" icon="">
          <BareInput value={influencer.dreamBrands ?? ''} onChange={e => u('dreamBrands', e.target.value)} placeholder="e.g. Nike, Glossier, Loewe…"/>
        </InfoCell>
        <InfoCell label="Content Pillars" icon="">
          <BareInput value={(influencer.contentPillars ?? []).join(', ')} onChange={e => u('contentPillars', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. Fitness, Mindset, Style…"/>
        </InfoCell>
      </div>

      {/* ── Color Palette + Voice ── */}
      <div className="desc-grid-2">
        <InfoCell label="Brand Colors" icon="">
          <ColorPalette palette={influencer.palette ?? []} onChange={v => u('palette', v)} gender={influencer.gender}/>
        </InfoCell>
        <InfoCell label="Voice / TTS" icon="">
          <BareInput value={influencer.voice ?? ''} onChange={e => u('voice', e.target.value)} placeholder="e.g. Higgsfield, ElevenLabs…"/>
        </InfoCell>
      </div>

    </div>
  )
}

function buildWardrobePrompt(influencer, { outfit, hair, customText }) {
  const phys = influencer.physicalDesc ? `The subject: ${influencer.physicalDesc}. ` : ''
  const identity = `IDENTITY LOCK — replicate exactly from reference: facial bone structure, face shape, jaw, nose bridge and tip, lip shape, eye shape and color, eyebrow arch and thickness, skin tone, skin texture and pores, all freckles, moles, marks, scars, natural asymmetries. Zero facial drift — this must be unmistakably the same person.`
  const layout = `Output must be the exact same 4-panel character turnaround sheet as the reference image. Single row of four equally sized full-body panels with these labels in clean sans-serif capitals above each: "FRONT VIEW" | "SIDE VIEW" | "BACK VIEW" | "THREE-QUARTER VIEW". Keep identical body poses, stance, arm positions, proportions, and panel layout from the reference. Do NOT change poses, labels, panel structure, background (pure white seamless), or lighting.`

  const changeParts = [
    outfit && `outfit — ${outfit}`,
    hair && `hairstyle — ${hair}`,
    customText?.trim() || '',
  ].filter(Boolean)
  const changes = `Change only: ${changeParts.join('; ') || 'casual stylish outfit, natural hairstyle'}.`

  return `Professional full-body character turnaround sheet. ${phys}Pure white seamless background throughout. Soft neutral studio lighting, perfectly flat and even across all four panels — no shadows, no color cast.

${layout}

${identity}

${changes}

Photorealistic RAW photograph quality, ultra-sharp micro detail. Shot on Hasselblad X2D 100C.`
}

function saveWardrobePending(influencerId, data) {
  try { localStorage.setItem(`hf_wardrobe_pending_${influencerId}`, JSON.stringify({ ...data, startedAt: Date.now() })) } catch {}
}
function getWardrobePending(influencerId) {
  try {
    const d = JSON.parse(localStorage.getItem(`hf_wardrobe_pending_${influencerId}`) || 'null')
    if (!d) return null
    if (Date.now() - d.startedAt > 15 * 60 * 1000) { clearWardrobePending(influencerId); return null }
    return d
  } catch { return null }
}
function clearWardrobePending(influencerId) {
  try { localStorage.removeItem(`hf_wardrobe_pending_${influencerId}`) } catch {}
}

function WardrobeGenerator({ influencer, onAdd }) {
  const [top, setTop] = useState('')
  const [bottom, setBottom] = useState('')
  const [hair, setHair] = useState('')
  const [customText, setCustomText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { url, name } — waiting to be saved
  const [saveName, setSaveName] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const cancelRef = useRef(false)
  const genStartRef = useRef(null)

  // Time-based progress — fills 0→95% over 180s, only moves forward
  useEffect(() => {
    if (!generating) return
    genStartRef.current = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - genStartRef.current
      setProgress(prev => Math.max(prev, Math.min(95, (elapsed / 180000) * 95)))
    }, 500)
    return () => clearInterval(timer)
  }, [generating])

  const refImage = influencer.characterSheetImage || null

  // Resume any generation that was running when the user navigated away
  useEffect(() => {
    // Restore a completed result that was never saved/discarded
    const savedResult = (() => { try { return JSON.parse(localStorage.getItem(`wd_gen_result_${influencer.id}`) || 'null') } catch { return null } })()
    if (savedResult?.url) { setResult(savedResult); setSaveName(savedResult.name || 'Custom Look'); return }

    const pending = getWardrobePending(influencer.id)
    if (!pending) return
    cancelRef.current = false
    setGenerating(true); setProgress(30)
    initSession()
      .then(() => pollAllJobs(pending.jobIds, 1, setProgress, 16, () => cancelRef.current))
      .then(urls => {
        if (!cancelRef.current && urls[0]) {
          const r = { url: urls[0], name: pending.label }
          try { localStorage.setItem(`wd_gen_result_${influencer.id}`, JSON.stringify(r)) } catch {}
          setResult(r); setSaveName(pending.label)
        }
      })
      .catch(e => { if (!cancelRef.current) setError(e.message) })
      .finally(() => { clearWardrobePending(influencer.id); if (!cancelRef.current) { setGenerating(false); setProgress(0) } })
  }, [influencer.id])

  const canGenerate = refImage && !generating && !result && (
    customText.trim() || top.trim() || bottom.trim() || hair.trim()
  )

  function cancelGeneration() {
    cancelRef.current = true
    clearWardrobePending(influencer.id)
    setGenerating(false); setProgress(0)
  }

  async function generate() {
    if (!canGenerate) return
    cancelRef.current = false
    setGenerating(true); setProgress(0); setError(null)
    try {
      const outfitText = [top, bottom].filter(Boolean).join(', ')
      const label = 'Custom Look'
      const prompt = buildWardrobePrompt(influencer, {
        outfit: outfitText, hair,
        customText: customText || null,
      })
      const url = await generateSingleImage({
        prompt, aspectRatio: '16:9', referenceImage: refImage, onProgress: setProgress,
        onJobIds: jobIds => saveWardrobePending(influencer.id, { jobIds, label }),
        isCancelled: () => cancelRef.current,
      })
      clearWardrobePending(influencer.id)
      if (!cancelRef.current && url) {
        const r = { url, name: label }
        try { localStorage.setItem(`wd_gen_result_${influencer.id}`, JSON.stringify(r)) } catch {}
        setResult(r); setSaveName(label)
      }
    } catch (e) {
      clearWardrobePending(influencer.id)
      if (!cancelRef.current && e.message !== 'CANCELLED') setError(e.message)
    } finally {
      if (!cancelRef.current) { setGenerating(false); setProgress(0) }
    }
  }

  function saveToWardrobe() {
    if (!result) return
    onAdd({ id: generateId(), name: saveName.trim() || result.name, image: result.url })
    try { localStorage.removeItem(`wd_gen_result_${influencer.id}`) } catch {}
    setResult(null); setSaveName(''); setTop(''); setBottom(''); setHair(''); setCustomText('')
  }

  function discardResult() {
    try { localStorage.removeItem(`wd_gen_result_${influencer.id}`) } catch {}
    setResult(null); setSaveName('')
  }

  const iS = { padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
  const lS = { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border-subtle)', padding: 20, marginBottom: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Generate Look</div>
      </div>

      {/* Result preview */}
      {result && (<>
        {lightboxOpen && (
          <Lightbox images={[result.url]} startIndex={0} onClose={() => setLightboxOpen(false)} />
        )}
        <div
          onClick={() => setLightboxOpen(true)}
          style={{ position: 'relative', cursor: 'zoom-in', marginBottom: 14, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
          onMouseEnter={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1)' }}
        >
          <img src={result.url} alt="" style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
          <button
            onClick={e => { e.stopPropagation(); downloadImage(result.url, `${(result.name || 'look').replace(/\s+/g, '-')}.jpg`) }}
            style={{
              position: 'absolute', bottom: 10, right: 10,
              padding: '5px 12px', borderRadius: 980, fontSize: 12, fontWeight: 600,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >↓ Download</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Ready to save</div>
        <div style={lS}>Name this look</div>
        <input value={saveName} onChange={e => setSaveName(e.target.value)} style={{ ...iS, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveToWardrobe} style={{
            flex: 1, padding: '10px', borderRadius: 9, fontSize: 13, fontWeight: 700,
            background: 'var(--color-brand-gradient)', color: '#fff',
            boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 30%, transparent)',
          }}>Save to Wardrobe</button>
          <button onClick={discardResult} style={{
            padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
          }}>Discard</button>
        </div>
      </>)}

      {/* Generating state */}
      {generating && !result && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Generating look…</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {progress > 0 ? `${Math.round(progress)}%` : 'Starting…'}
              </span>
              <button onClick={cancelGeneration} style={{
                padding: '3px 10px', borderRadius: 980, fontSize: 11, fontWeight: 600,
                background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)',
                border: '1px solid var(--border)',
              }}>Cancel</button>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 980, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.max(3, progress)}%`,
              background: 'linear-gradient(90deg, var(--color-brand-violet), var(--color-brand-blue))',
              borderRadius: 980,
              transition: 'width 0.5s ease',
              boxShadow: '0 0 10px color-mix(in srgb, var(--accent) 50%, transparent)',
            }}/>
          </div>
        </div>
      )}

      {/* Form */}
      {!result && !generating && (<>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={lS}>Top</div>
              <input value={top} onChange={e => setTop(e.target.value)} placeholder={influencer.gender === 'Male' ? 'e.g. white oxford shirt' : 'e.g. white crop top'} style={iS} />
            </div>
            <div>
              <div style={lS}>Bottom</div>
              <input value={bottom} onChange={e => setBottom(e.target.value)} placeholder={influencer.gender === 'Male' ? 'e.g. dark chinos' : 'e.g. baggy jeans'} style={iS} />
            </div>
          </div>
          <div>
            <div style={lS}>Hairstyle</div>
            <input value={hair} onChange={e => setHair(e.target.value)} placeholder={influencer.gender === 'Male' ? 'e.g. slicked back, low fade' : 'e.g. sleek low bun'} style={iS} />
          </div>
          <div>
            <div style={lS}>Full look description</div>
            <textarea value={customText} onChange={e => setCustomText(e.target.value)} placeholder="e.g. vintage leather jacket over a white tee, dark slim jeans, white sneakers, hair pushed back naturally" rows={3} style={{ ...iS, resize: 'vertical' }} />
          </div>
        </div>

        {!refImage && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 14, padding: '9px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            No character sheet — generate one in the Overview tab first.
          </div>
        )}
        {error && <div style={{ fontSize: 12, color: 'var(--color-status-danger)', marginTop: 10 }}>{error}</div>}

        <button onClick={generate} disabled={!canGenerate} style={{
          width: '100%', marginTop: 16, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: canGenerate ? 'var(--color-brand-gradient)' : 'var(--bg-tertiary)',
          color: canGenerate ? '#fff' : 'var(--text-tertiary)',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          boxShadow: canGenerate ? '0 2px 12px color-mix(in srgb, var(--accent) 32%, transparent)' : 'none',
          transition: 'all 0.15s',
        }}>Generate Look</button>
      </>)}
    </div>
  )
}

// ─────────────────────────────────────────────
// World Drops
function WorldDropCard({ drop, editing, editName, onEditName, onStartEdit, onCommitEdit, onCancelEdit, onImageChange, onDelete, onLightbox }) {
  const fileRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => compressImage(ev.target.result).then(onImageChange).catch(console.error)
    r.readAsDataURL(f)
  }

  return (
    <div
      style={{ background:'var(--bg)', borderRadius:12, border:`1.5px solid ${dragOver?'var(--accent)':hovered?'var(--accent)':'var(--border)'}`, overflow:'hidden', boxShadow:hovered?'var(--shadow-md)':'none', transition:'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
    >
      {/* Image slot */}
      <div
        style={{ aspectRatio:'4/3', background: dragOver ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'var(--bg-tertiary)', overflow:'hidden', cursor:'pointer', position:'relative', transition:'background 0.15s' }}
        onClick={() => drop.image ? onLightbox?.() : fileRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
      >
        {drop.image
          ? <>
              <img src={drop.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0)', transition:'background 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,0,0,0.2)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,0,0,0)'}}
              >
                <button onClick={e=>{e.stopPropagation();onImageChange(null)}} style={{
                  position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%',
                  background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.15)',
                }}>×</button>
              </div>
            </>
          : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span style={{ fontSize:22, opacity: dragOver ? 0.6 : 0.22 }}>+</span>
              <span style={{ fontSize:11, color:'var(--text-tertiary)', fontWeight:500 }}>{dragOver ? 'Drop to upload' : 'Upload or drag & drop'}</span>
            </div>
        }
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e=>{handleFile(e.target.files[0]);e.target.value=''}}/>
      </div>

      {/* Name + hover-reveal actions */}
      <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:6, minHeight:42 }}>
        {editing
          ? <input autoFocus value={editName} onChange={e=>onEditName(e.target.value)}
              onBlur={onCommitEdit}
              onKeyDown={e=>{if(e.key==='Enter')onCommitEdit();if(e.key==='Escape')onCancelEdit()}}
              style={{ flex:1, fontSize:13, fontWeight:600, border:'none', background:'transparent', color:'var(--text-primary)', outline:'none' }}/>
          : <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{drop.name}</span>
        }
        <div style={{ display:'flex', gap:3, flexShrink:0, opacity: hovered ? 1 : 0, transition:'opacity 0.15s' }}>
          {drop.image && (
            <button onClick={e=>{e.stopPropagation();downloadImage(drop.image,`${drop.name||'wardrobe'}.jpg`)}} title="Download" style={{
              width:26, height:26, borderRadius:7, border:'none', cursor:'pointer',
              background:'var(--bg-tertiary)', color:'var(--text-secondary)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
            }}>↓</button>
          )}
          <button onClick={e=>{e.stopPropagation();onStartEdit()}} title="Rename" style={{
            width:26, height:26, borderRadius:7, border:'none', cursor:'pointer',
            background:'var(--bg-tertiary)', color:'var(--text-secondary)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
          }}>✎</button>
          <button onClick={e=>{e.stopPropagation();onDelete()}} title="Delete" style={{
            width:26, height:26, borderRadius:7, border:'none', cursor:'pointer',
            background:'color-mix(in srgb, var(--color-status-danger) 8%, transparent)', color:'var(--color-status-danger)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, lineHeight:1,
          }}>×</button>
        </div>
      </div>
    </div>
  )
}

function WorldDropSection({ drops=[], onChange }) {
  const [editId,setEditId]=useState(null)
  const [editName,setEditName]=useState('')
  const [lightboxUrl,setLightboxUrl]=useState(null)

  function addDrop() {
    onChange([...drops, { id:generateId(), name:`Wardrobe ${drops.length+1}`, image:null }])
  }
  function updateDrop(id,updates){ onChange(drops.map(d=>d.id===id?{...d,...updates}:d)) }
  function deleteDrop(id){ onChange(drops.filter(d=>d.id!==id)) }
  function commitRename(){ if(editName.trim()) updateDrop(editId,{name:editName.trim()}); setEditId(null); setEditName('') }

  return (
    <div>
      {lightboxUrl&&<Lightbox images={[lightboxUrl]} startIndex={0} onClose={()=>setLightboxUrl(null)}/>}
      {drops.length===0&&(
        <div style={{ textAlign:'center', padding:'52px 0', color:'var(--text-tertiary)' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>No wardrobe slots yet</div>
          <div style={{ fontSize:13 }}>Add wardrobe slots to organize your influencer's looks.</div>
        </div>
      )}
      {drops.length>0&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14, marginBottom:16 }}>
          {drops.map(drop=>(
            <WorldDropCard
              key={drop.id} drop={drop}
              editing={editId===drop.id} editName={editName}
              onEditName={setEditName}
              onStartEdit={()=>{setEditId(drop.id);setEditName(drop.name)}}
              onCommitEdit={commitRename}
              onCancelEdit={()=>{setEditId(null);setEditName('')}}
              onImageChange={img=>updateDrop(drop.id,{image:img})}
              onDelete={()=>deleteDrop(drop.id)}
              onLightbox={()=>setLightboxUrl(drop.image)}
            />
          ))}
        </div>
      )}
      <button onClick={addDrop} style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'8px 16px', borderRadius:8,
        border:'1.5px dashed var(--border)',
        background:'transparent', color:'var(--text-secondary)',
        fontSize:13, fontWeight:500, cursor:'pointer',
        transition:'border-color 0.15s, color 0.15s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)'}}
      >+ Add Wardrobe</button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Brand deal card — WorldDropCard style with brand + category fields
const GEN_DURATION_MS = 150000 // ~2m30s estimated total

function BrandDealCard({ deal, editingBrand, editBrand, onEditBrand, onStartEdit, onCommitEdit, onCancelEdit, onImageChange, onDelete, onCategoryChange, onLightbox, generating, progress, claudeStatus, onGenerate }) {
  const fileRef = useRef()
  const [hovered,setHovered]=useState(false)
  const [dragOver,setDragOver]=useState(false)
  const [viewSheet,setViewSheet]=useState(false)
  const [smoothPct,setSmoothPct]=useState(0)
  const startRef=useRef(null)
  const rafRef=useRef(null)

  useEffect(()=>{
    if(generating){
      startRef.current=Date.now()
      setSmoothPct(0)
      const tick=()=>{
        const elapsed=Date.now()-startRef.current
        // Ease toward 90% over GEN_DURATION_MS, never reaches 100 on its own
        const target=90*(1-Math.exp(-3*elapsed/GEN_DURATION_MS))
        setSmoothPct(Math.min(target,90))
        rafRef.current=requestAnimationFrame(tick)
      }
      rafRef.current=requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      setSmoothPct(0)
    }
    return()=>cancelAnimationFrame(rafRef.current)
  },[generating])

  function genLabel(pct){
    if(pct<8) return 'Asking Claude…'
    if(pct<20) return 'Uploading…'
    if(pct<75) return 'Generating…'
    return 'Almost done…'
  }

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => compressImage(ev.target.result).then(url => {
      const existing = deal.images || (deal.image ? [deal.image] : [])
      if (existing.length === 0) {
        onImageChange(url) // sets deal.image for backward compat
      } else if (existing.length < 5) {
        onImageChange(null, [...existing, url]) // append
      }
    }).catch(console.error)
    r.readAsDataURL(f)
  }

  const hasSheet = !!deal.characterSheet
  const hasBoth = hasSheet && !!deal.image
  const displayImage = hasBoth ? (viewSheet ? deal.characterSheet : deal.image) : (deal.image || deal.characterSheet)
  useEffect(()=>{ if(deal.characterSheet && !deal.image) setViewSheet(true) },[deal.characterSheet, deal.image])

  return (
    <div
      style={{background:'var(--bg)',borderRadius:12,border:`1.5px solid ${dragOver?'var(--accent)':hovered?'var(--accent)':'var(--border)'}`,overflow:'hidden',boxShadow:hovered?'var(--shadow-md)':'none',transition:'border-color 0.15s, box-shadow 0.15s'}}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
    >
      {/* Image slot */}
      <div
        style={{aspectRatio:'4/3',background:dragOver?'color-mix(in srgb, var(--accent) 7%, transparent)':'var(--bg-tertiary)',overflow:'hidden',cursor:'pointer',position:'relative',transition:'background 0.15s'}}
        onClick={()=>{ if(generating) return; if(displayImage){const imgs=hasBoth?[deal.image,deal.characterSheet]:[displayImage];onLightbox?.(imgs,hasBoth&&viewSheet?1:0)}else{fileRef.current.click()} }}
        onDragOver={e=>{e.preventDefault();setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
      >
        {displayImage
          ? <>
              <img src={displayImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              {!generating && (
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0)',transition:'background 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,0,0,0.2)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,0,0,0)'}}
                >
                  <button onClick={e=>{e.stopPropagation();fileRef.current.click()}} title="Change image" style={{
                    position:'absolute',top:6,left:6,width:22,height:22,borderRadius:'50%',
                    background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:11,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    backdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.15)',
                  }}>↑</button>
                  <button onClick={e=>{e.stopPropagation();onImageChange(null)}} style={{
                    position:'absolute',top:6,right:6,width:22,height:22,borderRadius:'50%',
                    background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:13,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    backdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.15)',
                  }}>×</button>
                </div>
              )}
              {hasBoth && !generating && (
                <div style={{position:'absolute',bottom:6,left:6,display:'flex',background:'rgba(0,0,0,0.55)',borderRadius:7,padding:2,backdropFilter:'blur(4px)',gap:2}} onClick={e=>e.stopPropagation()}>
                  <button onClick={e=>{e.stopPropagation();setViewSheet(false)}} style={{padding:'2px 7px',borderRadius:5,fontSize:9,fontWeight:700,border:'none',cursor:'pointer',lineHeight:1.4,background:!viewSheet?'#fff':'transparent',color:!viewSheet?'#000':'rgba(255,255,255,0.65)'}}>Orig</button>
                  <button onClick={e=>{e.stopPropagation();setViewSheet(true)}} style={{padding:'2px 7px',borderRadius:5,fontSize:9,fontWeight:700,border:'none',cursor:'pointer',lineHeight:1.4,background:viewSheet?'#fff':'transparent',color:viewSheet?'#000':'rgba(255,255,255,0.65)'}}>Sheet</button>
                </div>
              )}
            </>
          : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
              <span style={{fontSize:22,opacity:dragOver?0.6:0.22}}>+</span>
              <span style={{fontSize:11,color:'var(--text-tertiary)',fontWeight:500}}>{dragOver?'Drop to upload':'Upload or drag & drop'}</span>
            </div>
        }
        {generating && (
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.62)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
            <div style={{width:24,height:24,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.2)',borderTopColor:'#fff',animation:'bdSpin 0.75s linear infinite'}}/>
            <div style={{color:'#fff',fontSize:11,fontWeight:600}}>{genLabel(smoothPct)}</div>
            <div style={{width:100,height:3,borderRadius:99,background:'rgba(255,255,255,0.15)'}}>
              <div style={{height:'100%',borderRadius:99,background:'#fff',width:`${smoothPct}%`,transition:'width 0.4s ease'}}/>
            </div>
          </div>
        )}
        {!generating && claudeStatus && (
          <div style={{position:'absolute',bottom:6,right:6,fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:6,backdropFilter:'blur(6px)',
            background: claudeStatus==='done' ? 'rgba(52,199,89,0.85)' : claudeStatus==='analyzing' ? 'color-mix(in srgb, var(--accent) 85%, transparent)' : 'color-mix(in srgb, var(--color-status-danger) 85%, transparent)',
            color:'#fff',maxWidth:'90%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
          }}>
            {claudeStatus==='done' ? '✓ Claude analyzed' : claudeStatus==='analyzing' ? 'Claude analyzing…' : '✗ '+claudeStatus.replace('error:','')}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}}
          onChange={e=>{Array.from(e.target.files).forEach(f=>handleFile(f));e.target.value=''}}/>
      </div>

      {/* Extra images strip */}
      {(deal.images?.length > 1) && (
        <div style={{display:'flex',gap:4,padding:'6px 8px 0',overflowX:'auto'}}>
          {deal.images.map((img,i) => (
            <img key={i} src={img} alt="" style={{width:36,height:36,borderRadius:6,objectFit:'cover',flexShrink:0,opacity:i===0?0.5:1}} title={i===0?'Main (shown above)':'Extra angle'}/>
          ))}
        </div>
      )}

      {/* Brand + category + actions */}
      <div style={{padding:'10px 12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          {editingBrand
            ? <input autoFocus value={editBrand} onChange={e=>onEditBrand(e.target.value)}
                onBlur={onCommitEdit}
                onKeyDown={e=>{if(e.key==='Enter')onCommitEdit();if(e.key==='Escape')onCancelEdit()}}
                style={{flex:1,fontSize:13,fontWeight:700,border:'none',background:'transparent',color:'var(--text-primary)',outline:'none'}}/>
            : <span style={{flex:1,fontSize:13,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{deal.brand}</span>
          }
          <div style={{display:'flex',gap:3,flexShrink:0,opacity:hovered&&!generating?1:0,transition:'opacity 0.15s'}}>
            {hasSheet && (
              <button onClick={e=>{e.stopPropagation();downloadImage(deal.characterSheet,`${deal.brand}-sheet.jpg`)}} title="Download sheet" style={{width:22,height:22,borderRadius:6,border:'none',cursor:'pointer',background:'var(--bg-tertiary)',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>↓</button>
            )}
            <button onClick={e=>{e.stopPropagation();onStartEdit()}} title="Rename" style={{width:22,height:22,borderRadius:6,border:'none',cursor:'pointer',background:'var(--bg-tertiary)',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>✎</button>
            <button onClick={e=>{e.stopPropagation();onDelete()}} title="Delete" style={{width:22,height:22,borderRadius:6,border:'none',cursor:'pointer',background:'color-mix(in srgb, var(--color-status-danger) 8%, transparent)',color:'var(--color-status-danger)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,lineHeight:1}}>×</button>
          </div>
        </div>
        <input
          value={deal.category||''}
          onChange={e=>onCategoryChange(e.target.value)}
          onClick={e=>e.stopPropagation()}
          placeholder="Category (e.g. Beauty, Tech…)"
          style={{width:'100%',fontSize:11,color:'var(--text-tertiary)',border:'none',background:'transparent',outline:'none',boxSizing:'border-box'}}
        />
        {deal.image && !generating && (
          <button
            onClick={e=>{e.stopPropagation();onGenerate(deal)}}
            style={{marginTop:8,width:'100%',padding:'5px 0',borderRadius:6,fontSize:11,fontWeight:600,background:hasSheet?'var(--bg-tertiary)':'var(--color-brand-gradient)',color:hasSheet?'var(--text-secondary)':'#fff',boxShadow:hasSheet?'none':'0 1px 6px color-mix(in srgb, var(--accent) 30%, transparent)',transition:'all 0.15s',cursor:'pointer'}}
          >{hasSheet ? '↺ Regenerate Sheet' : 'Generate Sheet'}</button>
        )}
      </div>
      <style>{`@keyframes bdSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function NewBrandModal({ onClose, onSave }) {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [images, setImages] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  function handleFiles(files) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - images.length)
    arr.forEach(f => {
      const r = new FileReader()
      r.onload = ev => compressImage(ev.target.result).then(url => setImages(prev => [...prev, url].slice(0, 5)))
      r.readAsDataURL(f)
    })
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:28,width:400,maxWidth:'90vw',boxShadow:'var(--shadow-lg)'}}>
        <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.4px',marginBottom:20}}>New Brand Deal</div>

        <label style={{display:'block',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Brand Name</div>
          <input autoFocus value={brand} onChange={e=>setBrand(e.target.value)}
            placeholder="e.g. Nike"
            style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:14,color:'var(--text-primary)',boxSizing:'border-box'}}/>
        </label>

        <label style={{display:'block',marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Category</div>
          <input value={category} onChange={e=>setCategory(e.target.value)}
            placeholder="e.g. Fitness, Beauty, Tech…"
            style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:14,color:'var(--text-primary)',boxSizing:'border-box'}}/>
        </label>

        <div style={{marginBottom:22}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Product Images</div>
          <div style={{fontSize:11,color:'var(--text-tertiary)',marginBottom:10}}>Up to 5 angles — front, back, sides, details. More = more accurate.</div>
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragging(false)}}
            onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files)}}
            style={{
              borderRadius:10,padding:8,
              border: dragging ? '1.5px dashed var(--accent)' : '1.5px dashed transparent',
              background: dragging ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'transparent',
              transition:'all 0.15s',
            }}
          >
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {images.map((img,i) => (
                <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'var(--bg-tertiary)'}}>
                  <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  <button onClick={()=>setImages(prev=>prev.filter((_,j)=>j!==i))}
                    style={{position:'absolute',top:4,right:4,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.6)',color:'#fff',fontSize:11,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                  {i===0&&<div style={{position:'absolute',bottom:4,left:4,fontSize:9,fontWeight:700,background:'rgba(0,0,0,0.6)',color:'#fff',padding:'2px 5px',borderRadius:4}}>MAIN</div>}
                </div>
              ))}
              {images.length < 5 && (
                <div onClick={()=>fileRef.current.click()} style={{aspectRatio:'1',borderRadius:8,border:'1.5px dashed var(--border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,cursor:'pointer',background:'var(--bg-tertiary)'}}>
                  <span style={{fontSize:20,opacity:0.3}}>+</span>
                  <span style={{fontSize:10,color:'var(--text-tertiary)'}}>{dragging?'Drop here':'Add photo'}</span>
                </div>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>{handleFiles(e.target.files);e.target.value=''}}/>
        </div>

        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:10,border:'1.5px solid var(--border)',fontSize:14,fontWeight:500,color:'var(--text-secondary)',background:'transparent'}}>Cancel</button>
          <button
            disabled={!brand.trim()}
            onClick={()=>onSave({brand,category,image:images[0]||null,images})}
            style={{flex:2,padding:'10px',borderRadius:10,fontSize:14,fontWeight:700,background:brand.trim()?'var(--color-brand-gradient)':'var(--border)',color:brand.trim()?'#fff':'var(--text-tertiary)',boxShadow:brand.trim()?'0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent)':'none',transition:'all 0.15s'}}
          >Add Brand</button>
        </div>
      </div>
    </div>
  )
}

function ImportBrandDealsModal({ deals, existingBrands, onImport, onClose }) {
  const [selected, setSelected] = useState(new Set())
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)',borderRadius:20,padding:28,width:560,maxWidth:'92vw',boxShadow:'var(--shadow-lg)',maxHeight:'80vh',display:'flex',flexDirection:'column' }}>
        <div style={{ fontSize:18,fontWeight:700,letterSpacing:'-0.4px',marginBottom:4 }}>Import Brand Deals</div>
        <div style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:20 }}>Select deals from the Brand Deals page to add to this influencer.</div>

        {deals.length === 0 ? (
          <div style={{ textAlign:'center',padding:'40px 20px',color:'var(--text-tertiary)',fontSize:13 }}>
            No brand deals yet — add some on the Brand Deals page first.
          </div>
        ) : (
          <div style={{ overflowY:'auto',flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10,marginBottom:20 }}>
            {deals.map(deal => {
              const already = existingBrands.has(deal.brand.toLowerCase())
              const isSelected = selected.has(deal.id)
              const thumb = deal.characterSheet || deal.image
              return (
                <div
                  key={deal.id}
                  onClick={() => !already && toggle(deal.id)}
                  style={{
                    borderRadius:12,overflow:'hidden',cursor:already?'default':'pointer',
                    border:`2px solid ${isSelected?'var(--accent)':already?'var(--border-subtle)':'var(--border)'}`,
                    background: isSelected ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg)',
                    opacity: already ? 0.5 : 1,
                    transition:'border-color 0.15s',
                  }}
                >
                  <div style={{ aspectRatio:'16/9',background:'var(--bg-tertiary)',position:'relative' }}>
                    {thumb
                      ? <img src={thumb} alt={deal.brand} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                      : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'var(--text-tertiary)',opacity:0.25 }}>{deal.brand[0]}</div>
                    }
                    {isSelected && (
                      <div style={{ position:'absolute',top:6,right:6,width:20,height:20,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700 }}>✓</div>
                    )}
                    {already && (
                      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.35)',fontSize:11,fontWeight:700,color:'#fff' }}>Already added</div>
                    )}
                  </div>
                  <div style={{ padding:'8px 10px' }}>
                    <div style={{ fontSize:12,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{deal.brand}</div>
                    {deal.category && <div style={{ fontSize:10,color:'var(--text-tertiary)',marginTop:1 }}>{deal.category}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'11px',borderRadius:10,border:'1.5px solid var(--border)',fontSize:14,fontWeight:500,color:'var(--text-secondary)',background:'transparent',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
          <button
            disabled={selected.size === 0}
            onClick={() => { onImport(deals.filter(d => selected.has(d.id))); onClose() }}
            style={{ flex:2,padding:'11px',borderRadius:10,background:selected.size?'var(--color-brand-gradient)':'var(--bg-tertiary)',color:selected.size?'#fff':'var(--text-tertiary)',fontSize:14,fontWeight:700,border:'none',cursor:selected.size?'pointer':'default',fontFamily:'inherit' }}
          >Import {selected.size > 0 ? `${selected.size} Deal${selected.size>1?'s':''}` : 'Selected'}</button>
        </div>
      </div>
    </div>
  )
}

function BrandDealSection({ deals=[], onChange }) {
  const [globalDeals] = useBrandDeals()
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId,setEditId]=useState(null)
  const [editBrand,setEditBrand]=useState('')
  const [lightbox,setLightbox]=useState(null)
  const [generating,setGenerating]=useState({})
  const [genProgress,setGenProgress]=useState({})
  const [claudeStatus,setClaudeStatus]=useState({})

  const existingBrands = new Set(deals.map(d => d.brand.toLowerCase()))

  function addDeal({brand,category,image,images}) {
    onChange([...deals,{id:generateId(),brand,category,image,images:images||[]}])
    setShowModal(false)
  }

  function importDeals(toImport) {
    const fresh = toImport
      .filter(d => !existingBrands.has(d.brand.toLowerCase()))
      .map(d => ({ ...d, id: generateId() }))
    if (fresh.length) onChange([...deals, ...fresh])
  }
  function updateDeal(id,updates){ onChange(deals.map(d=>d.id===id?{...d,...updates}:d)) }
  function deleteDeal(id){ onChange(deals.filter(d=>d.id!==id)) }
  function commitRename(){ if(editBrand.trim()) updateDeal(editId,{brand:editBrand.trim()}); setEditId(null); setEditBrand('') }

  async function handleGenerate(deal) {
    if (!isHFConnected()) { alert('Connect Higgsfield in Settings first'); return }
    if (!deal.image) { alert('Upload a product image first'); return }

    setGenerating(g=>({...g,[deal.id]:true}))
    setGenProgress(p=>({...p,[deal.id]:0}))

    let imagePrompt = null
    const claudeKey = localStorage.getItem('claude_api_key')
    const allImages = deal.images?.length ? deal.images : (deal.image ? [deal.image] : [])
    if (claudeKey && allImages.length) {
      setClaudeStatus(s=>({...s,[deal.id]:'analyzing'}))
      try {
        setGenProgress(p=>({...p,[deal.id]:5}))
        imagePrompt = await buildCharSheetPromptWithClaude(allImages, deal.brand, deal.category, claudeKey)
        setClaudeStatus(s=>({...s,[deal.id]:'done'}))
        setTimeout(()=>setClaudeStatus(s=>({...s,[deal.id]:null})),3000)
      } catch(e) {
        alert('Claude: ' + e.message)
        setClaudeStatus(s=>({...s,[deal.id]:'error:'+e.message}))
        setTimeout(()=>setClaudeStatus(s=>({...s,[deal.id]:null})),5000)
      }
    }
    if (!imagePrompt) imagePrompt = buildCharSheetPrompt(deal.brand, deal.category)

    try {
      setGenProgress(p=>({...p,[deal.id]:15}))
      const sheetUrl = await generateSingleImage({
        prompt: imagePrompt,
        aspectRatio: '16:9',
        referenceImage: deal.image,
        onProgress: pct=>setGenProgress(prev=>({...prev,[deal.id]:pct})),
      })
      if (sheetUrl) updateDeal(deal.id,{characterSheet:sheetUrl})
    } catch(e) {
      console.error('[CharSheet] Higgsfield error:', e)
      if (!e.message?.includes('CANCELLED')) alert('Image generation step failed: '+e.message)
    } finally {
      setGenerating(g=>({...g,[deal.id]:false}))
      setGenProgress(p=>({...p,[deal.id]:0}))
    }
  }

  return (
    <div>
      {lightbox&&<Lightbox images={lightbox.images} startIndex={lightbox.start||0} onClose={()=>setLightbox(null)}/>}
      {showModal && <NewBrandModal onClose={()=>setShowModal(false)} onSave={addDeal}/>}
      {showImport && <ImportBrandDealsModal deals={globalDeals} existingBrands={existingBrands} onImport={importDeals} onClose={()=>setShowImport(false)}/>}
      {deals.length===0&&(
        <div style={{textAlign:'center',padding:'52px 0',color:'var(--text-tertiary)'}}>
          <div style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>No brand deals yet</div>
          <div style={{fontSize:13}}>Add brands you want this influencer to promote.</div>
        </div>
      )}
      {deals.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:14,marginBottom:16}}>
          {deals.map(deal=>(
            <BrandDealCard
              key={deal.id} deal={deal}
              editingBrand={editId===deal.id} editBrand={editBrand}
              onEditBrand={setEditBrand}
              onStartEdit={()=>{setEditId(deal.id);setEditBrand(deal.brand)}}
              onCommitEdit={commitRename}
              onCancelEdit={()=>{setEditId(null);setEditBrand('')}}
              onImageChange={(img,imgs)=>updateDeal(deal.id, imgs ? {images:imgs,image:imgs[0],characterSheet:null} : {image:img,images:img?[img]:[],characterSheet:null})}
              onDelete={()=>deleteDeal(deal.id)}
              onCategoryChange={cat=>updateDeal(deal.id,{category:cat})}
              onLightbox={(imgs,start)=>setLightbox({images:imgs,start:start||0})}
              generating={!!generating[deal.id]}
              progress={genProgress[deal.id]||0}
              claudeStatus={claudeStatus[deal.id]||null}
              onGenerate={handleGenerate}
            />
          ))}
        </div>
      )}
      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
        <button onClick={()=>setShowModal(true)} style={{
          display:'flex',alignItems:'center',gap:6,
          padding:'8px 16px',borderRadius:8,
          border:'1.5px dashed var(--border)',
          background:'transparent',color:'var(--text-secondary)',
          fontSize:13,fontWeight:500,cursor:'pointer',
          transition:'border-color 0.15s, color 0.15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)'}}
        >+ Add Brand</button>
        {globalDeals.length > 0 && (
          <button onClick={()=>setShowImport(true)} style={{
            display:'flex',alignItems:'center',gap:6,
            padding:'8px 16px',borderRadius:8,
            border:'1.5px solid color-mix(in srgb, var(--accent) 35%, transparent)',
            background:'color-mix(in srgb, var(--accent) 7%, transparent)',color:'var(--accent)',
            fontSize:13,fontWeight:600,cursor:'pointer',
            transition:'border-color 0.15s, background 0.15s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='color-mix(in srgb, var(--accent) 14%, transparent)';e.currentTarget.style.borderColor='var(--accent)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='color-mix(in srgb, var(--accent) 7%, transparent)';e.currentTarget.style.borderColor='color-mix(in srgb, var(--accent) 35%, transparent)'}}
          >↓ Import from Brand Deals</button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// New influencer modal
function NewModal({ onClose, onSave }) {
  const [name,setName]=useState('')
  const [gender,setGender]=useState('')
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:32,width:360,boxShadow:'var(--shadow-lg)'}}>
        <h2 style={{fontSize:20,fontWeight:700,letterSpacing:'-0.4px',marginBottom:20}}>New Influencer</h2>
        <label style={{display:'block',marginBottom:16}}><FL>Name</FL><FI value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Luna Rose"/></label>
        <div style={{marginBottom:28}}><FL>Gender</FL><GenderButtons value={gender} onChange={setGender}/></div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:8,border:'1.5px solid var(--border)',fontSize:14,fontWeight:500,color:'var(--text-secondary)',background:'transparent'}}>Cancel</button>
          <button disabled={!name.trim()} onClick={()=>onSave(name.trim(),gender)}
            style={{flex:1,padding:10,borderRadius:8,background:name.trim()?'var(--color-brand-gradient)':'var(--border)',color:name.trim()?'#fff':'var(--text-tertiary)',fontSize:14,fontWeight:600,boxShadow:name.trim()?'0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent)':'none',transition:'all 0.15s'}}>Create</button>
        </div>
      </div>
    </div>
  )
}

function Sec({ children, style }) {
  return (
    <div
      style={{background:'var(--surface)',borderRadius:'var(--radius-lg)',padding:20,boxShadow:'var(--shadow-sm)',border:'1px solid var(--border-subtle)',transition:'box-shadow 0.2s',...style}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)'}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow-sm)'}}
    >{children}</div>
  )
}

// ─────────────────────────────────────────────
// Detail tabs with palette-tinted active state
// Scripts → Talking video (saved scripts are offered there); Home → Looks (Bring home rooms into Looks).
const DETAIL_TABS = ['Overview','Wardrobe','Brand Deals']

function Tabs({ active, onChange, ac }) {
  const tc = accentText(ac)
  return (
    <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
      {DETAIL_TABS.map(tab=>(
        <button key={tab} onClick={()=>onChange(tab)} style={{
          padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:500,
          background: active===tab ? ac : 'var(--bg-tertiary)',
          color: active===tab ? tc : 'var(--text-secondary)',
          border: `1.5px solid ${active===tab ? ac+'55' : 'transparent'}`,
          transition:'all 0.18s',
        }}>{tab}</button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main export
export default function Influencers() {
  const [influencers,setInfluencers]=useInfluencers()
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedId,setSelectedId]=useState(()=>localStorage.getItem('inf_last_selected')||null)
  const [activeTab,setActiveTab]=useState('Overview')
  const [showNew,setShowNew]=useState(false)
  const [lightbox,setLightbox]=useState(null)
  const [ctxMenu,setCtxMenu]=useState(null)
  const [renameId,setRenameId]=useState(null)
  const [renameVal,setRenameVal]=useState('')
  const [mobileView,setMobileView]=useState('list')
  const [sidebarCollapsed,setSidebarCollapsed]=useState(()=>localStorage.getItem('inf_sidebar_collapsed')==='1')
  const [sidebarWidth,setSidebarWidth]=useState(()=>Number(localStorage.getItem('inf_sidebar_width'))||216)
  const sidebarWidthRef=useRef(Number(localStorage.getItem('inf_sidebar_width'))||216)
  const asideRef=useRef()
  const isDragging=useRef(false)
  const dragStartX=useRef(0)
  const dragStartW=useRef(0)
  const isMobile=useMobile()
  const tabSecRef=useRef()
  const mainPaneRef=useRef()
  const prevInfIdRef=useRef(null)
  const [infOrder,setInfOrder]=useState(()=>{try{return JSON.parse(localStorage.getItem('inf_order')||'null')}catch{return null}})
  const [dragState,setDragState]=useState(null) // {srcId, overId, above}
  const orderedRef=useRef([])

  // Resize drag handlers — pure DOM during drag, sync to React on mouseup
  useEffect(()=>{
    function onMove(e){
      if(!isDragging.current) return
      const w=Math.max(160,Math.min(420,dragStartW.current+(e.clientX-dragStartX.current)))
      sidebarWidthRef.current=w
      if(asideRef.current) asideRef.current.style.width=w+'px'
    }
    function onUp(){
      if(!isDragging.current) return
      isDragging.current=false
      document.body.style.cursor=''
      document.body.style.userSelect=''
      setSidebarWidth(sidebarWidthRef.current)
      localStorage.setItem('inf_sidebar_width',String(Math.round(sidebarWidthRef.current)))
    }
    window.addEventListener('mousemove',onMove)
    window.addEventListener('mouseup',onUp)
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)}
  },[])

  // Bulletproof influencer resolution — three-level fallback, never null if any exist
  const influencer = useMemo(() => {
    // 1. Just arrived from Create — use the ID passed in navigation state
    if (location.state?.selectId) {
      const f = influencers.find(i => i.id === location.state.selectId)
      if (f) return f
    }
    // 2. User clicked something in the sidebar
    if (selectedId) {
      const f = influencers.find(i => i.id === selectedId)
      if (f) return f
    }
    // 3. Default to first in list
    return influencers[0] ?? null
  }, [influencers, location.state?.selectId, selectedId])

  const ac=accent(influencer)
  const pct=influencer?completeness(influencer):0

  // Reset to profile tab on every influencer switch
  useEffect(() => {
    prevInfIdRef.current = influencer?.id
    setActiveTab('Overview')
  }, [influencer?.id]) // eslint-disable-line

  const topImages=influencer?[influencer.mainImage,influencer.characterSheetImage,influencer.closeUpImage1,influencer.closeUpImage2].filter(Boolean):[]

  function create(name,gender) {
    const n={
      id:generateId(),name,gender,type:'Influencer',createdAt:Date.now(),
      mainImage:null,characterSheetImage:null,closeUpImage1:null,closeUpImage2:null,
      prompt:'',age:'',backstory:'',introExtrovert:50,
      niche:'',nicheCustom:'',audience:'',hobbies:'',clothingStyle:'',dreamBrands:'',voice:'',
      contentPillars:[],palette:[],videoUrls:[],scripts:[],
      homeImages:[],brandDealImages:[],
      wardrobeSlots:[
        {id:generateId(),name:'Wardrobe 1',image:null},
        {id:generateId(),name:'Wardrobe 2',image:null},
        {id:generateId(),name:'Wardrobe 3',image:null},
      ],
    }
    setInfluencers(prev=>[...prev,n]); setSelectedId(n.id); setShowNew(false)
  }

  function upd(id,updates){ setInfluencers(prev=>prev.map(i=>i.id===id?{...i,...updates}:i)) }

  function addToHistory(id, entry) {
    setInfluencers(prev => prev.map(i => {
      if (i.id !== id) return i
      const existing = i.generationHistory || []
      const isDupe = existing.some(e => e.url === entry.url && entry.date - e.date < 10000)
      if (isDupe) return i
      return { ...i, generationHistory: [{ id: generateId(), ...entry }, ...existing].slice(0, 300) }
    }))
  }

  function dup(id) {
    const src=influencers.find(i=>i.id===id); if(!src) return
    const n={...src,id:generateId(),name:src.name+' (copy)',createdAt:Date.now()}
    setInfluencers(prev=>[...prev,n]); setSelectedId(n.id)
  }

  function del(id) {
    if (!window.confirm('Delete this influencer? This cannot be undone.')) return
    const next=influencers.filter(i=>i.id!==id)
    setInfluencers(next); setSelectedId(next[0]?.id??null)
  }

  function commitRename() {
    if(renameVal.trim()) upd(renameId,{name:renameVal.trim()})
    setRenameId(null); setRenameVal('')
  }

  function openCtx(e,id) {
    e.preventDefault()
    const inf=influencers.find(i=>i.id===id)
    setCtxMenu({x:e.clientX,y:e.clientY,id,inf})
  }

  return (
    <div style={{display:'flex',position:'fixed',top:'var(--nav-h)',left:'var(--rail-offset, 0px)',right:0,bottom:0,background:'var(--bg)',transition:'left .25s ease-out'}}>
      {showNew&&<NewModal onClose={()=>setShowNew(false)} onSave={create}/>}
      {lightbox&&<Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={()=>setLightbox(null)}/>}
      {ctxMenu&&(
        <CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={()=>setCtxMenu(null)}
          items={[
            {label:'Rename',       action:()=>{setSelectedId(ctxMenu.id);setRenameId(ctxMenu.id);setRenameVal(ctxMenu.inf.name)}},
            {label:'Duplicate',    action:()=>dup(ctxMenu.id)},
            {label:'Delete',color:'#FF6B6B',action:()=>del(ctxMenu.id)},
          ]}
        />
      )}

      {/* ── Dark sidebar — hidden on mobile when viewing detail */}
      {(!isMobile || mobileView==='list') && <aside ref={asideRef} style={{
        width: isMobile?'100%': sidebarCollapsed?0:sidebarWidth,
        flexShrink:0, background:SD.bg,
        display:'flex', flexDirection:'column', overflow:'hidden',
        transition: sidebarCollapsed?'width 0.25s ease':'none',
      }}>
        <div style={{padding:'16px 16px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${SD.border}`,minWidth:160}}>
          <span style={{fontSize:11,fontWeight:700,color:SD.dim,textTransform:'uppercase',letterSpacing:'0.6px'}}>Influencers</span>
          <div style={{display:'flex',gap:5,alignItems:'center'}}>
            <button onClick={()=>setShowNew(true)} style={{width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.12)',color:SD.text,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.2)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)'}}
            >+</button>
            <button onClick={()=>{setSidebarCollapsed(true);localStorage.setItem('inf_sidebar_collapsed','1')}} title="Collapse sidebar" style={{width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.08)',color:SD.dim,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'}}
            >‹</button>
          </div>
        </div>

        <div className="dark-scroll" style={{flex:1,overflowY:'auto',padding:'6px 8px'}}>
          {influencers.length===0&&(
            <div style={{padding:'24px 8px',textAlign:'center',color:SD.dim,fontSize:13}}>No influencers yet</div>
          )}
          {(()=>{
            const ordered = infOrder
              ? [...infOrder.map(id=>influencers.find(i=>i.id===id)).filter(Boolean),
                 ...influencers.filter(i=>!infOrder.includes(i.id))]
              : [...influencers].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))
            orderedRef.current = ordered

            function applyDrop(srcId, overId, above) {
              if (!srcId || srcId === overId) return
              const ids = orderedRef.current.map(i=>i.id)
              const from = ids.indexOf(srcId)
              if (from === -1) return
              const next = [...ids]
              next.splice(from, 1)
              const to = next.indexOf(overId)
              if (to === -1) return
              next.splice(above ? to : to + 1, 0, srcId)
              setInfOrder(next)
              localStorage.setItem('inf_order', JSON.stringify(next))
            }

            const ROW_H = 62
            function getShift(infId) {
              if (!dragState?.overId) return 0
              const { srcId, overId, above } = dragState
              if (infId === srcId) return 0
              const srcIdx = ordered.findIndex(i => i.id === srcId)
              const overIdx = ordered.findIndex(i => i.id === overId)
              const thisIdx = ordered.findIndex(i => i.id === infId)
              const insertAt = above ? overIdx : overIdx + 1
              if (srcIdx < insertAt) {
                if (thisIdx > srcIdx && thisIdx < insertAt) return -ROW_H
              } else {
                if (thisIdx >= insertAt && thisIdx < srcIdx) return ROW_H
              }
              return 0
            }

            return ordered.map(inf=>{
            const pct=completeness(inf)
            const active=influencer?.id===inf.id
            const gc=gColor(inf.gender)
            const isDraggingThis = dragState?.srcId === inf.id
            const dragDy = isDraggingThis && dragState?.pointerY != null ? dragState.pointerY - dragState.startY : 0
            const shift = isDraggingThis ? dragDy : getShift(inf.id)
            return (
              <div key={inf.id} data-inf-id={inf.id} style={{width:'100%',transform:`translateY(${shift}px)`,transition:(dragState&&!isDraggingThis)?'transform 0.18s ease':'none',position:'relative',zIndex:isDraggingThis?99:1,pointerEvents:isDraggingThis?'none':'auto'}}>
                <div style={{
                  display:'flex',alignItems:'center',borderRadius:10,marginBottom:2,
                  opacity: 1,
                  background: active ? SD.active : 'transparent',
                  cursor: dragState ? (isDraggingThis ? 'grabbing' : 'default') : 'grab',
                  userSelect:'none',
                  boxShadow: isDraggingThis ? '0 8px 28px rgba(0,0,0,0.55)' : 'none',
                  transform: isDraggingThis ? 'scale(1.03)' : 'none',
                  transition: isDraggingThis ? 'box-shadow 0.1s,transform 0.1s' : 'none',
                }}
                  onPointerDown={e=>{
                    if (e.button !== 0) return
                    const srcId = inf.id
                    const startX = e.clientX, startY = e.clientY
                    let dragging = false
                    function onMove(ev){
                      if (!dragging) {
                        const dx = ev.clientX - startX, dy = ev.clientY - startY
                        if (dx*dx + dy*dy < 64) return
                        dragging = true
                        setDragState({srcId, overId:null, above:true, startY, pointerY: ev.clientY})
                        return
                      }
                      const el=document.elementFromPoint(ev.clientX,ev.clientY)
                      const row=el?.closest('[data-inf-id]')
                      const pointerY = ev.clientY
                      if(!row){setDragState(s=>s?{...s,overId:null,pointerY}:s);return}
                      const overId=row.dataset.infId
                      if(overId===srcId){setDragState(s=>s?{...s,overId:null,pointerY}:s);return}
                      const rect=row.getBoundingClientRect()
                      const above=ev.clientY<rect.top+rect.height/2
                      setDragState(s=>s?{...s,overId,above,pointerY}:s)
                    }
                    function onUp(){
                      if (dragging) {
                        setDragState(s=>{
                          if(s?.overId) applyDrop(s.srcId,s.overId,s.above)
                          return null
                        })
                      }
                      window.removeEventListener('pointermove',onMove)
                      window.removeEventListener('pointerup',onUp)
                    }
                    window.addEventListener('pointermove',onMove)
                    window.addEventListener('pointerup',onUp)
                  }}
                >
                  <button
                    onClick={()=>{
                      setSelectedId(inf.id)
                      localStorage.setItem('inf_last_selected', inf.id)
                      if(location.state?.selectId) navigate('/influencers',{replace:true,state:{}})
                      if(isMobile)setMobileView('detail')
                    }}
                    onContextMenu={e=>openCtx(e,inf.id)}
                    style={{
                      flex:1,padding:'10px 10px 10px 10px',borderRadius:10,textAlign:'left',
                      background:'transparent',
                      display:'flex',alignItems:'center',gap:10,
                      transition:'background 0.15s',
                      pointerEvents: dragState ? 'none' : 'auto',
                    }}
                    onMouseEnter={e=>{ if(!active&&!dragState) e.currentTarget.style.background=SD.hover }}
                    onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent' }}
                  >
                    {/* Avatar + ring */}
                    <div style={{position:'relative',width:40,height:40,flexShrink:0}}>
                      <Ring pct={pct} size={42}/>
                      <div style={{position:'absolute',top:3,left:3,width:34,height:34,borderRadius:inf.mainImage?'50%':8,overflow:'hidden',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',transition:'border-radius 0.2s'}}>
                        <AvatarImg key={inf.mainImage} src={inf.mainImage} fallback={<span style={{fontSize:14,fontWeight:700,color:SD.dim}}>{inf.name[0]?.toUpperCase()}</span>}/>
                      </div>
                    </div>
                    {/* Name + gender */}
                    <div style={{minWidth:0,flex:1}}>
                      {renameId===inf.id?(
                        <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={e=>{if(e.key==='Enter')commitRename();if(e.key==='Escape')setRenameId(null)}}
                          onClick={e=>e.stopPropagation()}
                          style={{fontSize:13,fontWeight:600,border:'none',background:'transparent',color:SD.text,outline:'none',width:'100%'}}/>
                      ):(
                        <div style={{fontSize:13,fontWeight:600,color:SD.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{inf.name}</div>
                      )}
                      <div style={{fontSize:11,color:inf.tag?'color-mix(in srgb, var(--accent) 75%, transparent)':inf.gender?gc:SD.dim,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {inf.tag || inf.gender || 'Influencer'}
                      </div>
                    </div>
                    {/* Pct badge */}
                    <div style={{fontSize:10,fontWeight:700,color:SD.dim,flexShrink:0}}>{pct}%</div>
                  </button>
                </div>
              </div>
            )
          })})()}
        </div>
      </aside>}

      {/* ── Resize handle ── */}
      {!isMobile && !sidebarCollapsed && (
        <div
          onMouseDown={e=>{
            e.preventDefault()
            isDragging.current=true
            dragStartX.current=e.clientX
            dragStartW.current=sidebarWidthRef.current
            document.body.style.cursor='ew-resize'
            document.body.style.userSelect='none'
          }}
          onMouseEnter={e=>{
            e.currentTarget.querySelector('span').style.background='color-mix(in srgb, var(--accent) 70%, transparent)'
            e.currentTarget.querySelector('span').style.width='3px'
          }}
          onMouseLeave={e=>{
            if(!isDragging.current){
              e.currentTarget.querySelector('span').style.background=SD.border
              e.currentTarget.querySelector('span').style.width='1px'
            }
          }}
          style={{
            width:8, flexShrink:0, cursor:'ew-resize', position:'relative', zIndex:10,
            display:'flex', alignItems:'stretch', justifyContent:'center',
          }}
        >
          <span style={{
            display:'block', width:'1px', background:SD.border,
            transition:'background 0.15s, width 0.15s',
            pointerEvents:'none',
          }}/>
        </div>
      )}

      {/* ── Main — hidden on mobile when viewing list */}
      {(!isMobile || mobileView==='detail') && (influencer ? (
        <main ref={mainPaneRef} style={{flex:1,overflow:'auto',padding:isMobile?'14px 16px':'20px 24px',display:'flex',flexDirection:'column',gap:14,backgroundImage:'radial-gradient(ellipse at 75% 0%, rgba(0,113,227,0.04) 0%, transparent 55%)'}}>
          {/* Mobile back button */}
          {isMobile&&(
            <button onClick={()=>setMobileView('list')} style={{
              display:'flex',alignItems:'center',gap:6,padding:'8px 0',
              fontSize:14,fontWeight:600,color:'var(--accent)',background:'none',border:'none',
              alignSelf:'flex-start',
            }}>← All Influencers</button>
          )}

          {/* ── Studio tab switcher + sidebar toggle */}
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {/* Expand sidebar button — only when collapsed */}
            {sidebarCollapsed && !isMobile && (
              <button onClick={()=>{setSidebarCollapsed(false);localStorage.setItem('inf_sidebar_collapsed','0')}} title="Show sidebar" style={{
                width:34,height:34,borderRadius:10,border:'1.5px solid var(--border)',
                background:'var(--surface)',color:'var(--text-secondary)',fontSize:15,
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                transition:'all 0.15s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-tertiary)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)'}}
              >›</button>
            )}
            <div style={{marginLeft:'auto',alignSelf:'flex-start'}}><ProfileActions influencer={influencer} onExport={()=>exportPersonaBible(influencer)} onDelete={()=>del(influencer.id)}/></div>
          </div>



          <>

          {/* ── Empty state CTA — shown when influencer has no main image yet */}
          {!influencer.mainImage && (
            <div style={{
              borderRadius:18,padding:'36px 28px',textAlign:'center',
              background:'linear-gradient(135deg,rgba(236,72,153,0.06),color-mix(in srgb, var(--accent) 8%, transparent))',
              border:'1.5px dashed color-mix(in srgb, var(--accent) 30%, transparent)',
            }}>
              <div style={{fontSize:38,marginBottom:12,lineHeight:1}}>✦</div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--text-primary)',marginBottom:6,letterSpacing:'-0.3px'}}>
                {influencer.name} has no images yet
              </div>
              <div style={{fontSize:14,color:'var(--text-tertiary)',marginBottom:24,lineHeight:1.6}}>
                Go through the creation flow to generate photos, set their appearance, and build their identity.
              </div>
              <button
                onClick={() => navigate('/create', { state: { replaceId: influencer.id, prefillName: influencer.name, prefillGender: influencer.gender } })}
                style={{
                  display:'inline-flex',alignItems:'center',gap:10,
                  padding:'13px 28px',borderRadius:12,fontSize:15,fontWeight:700,
                  background:'var(--color-brand-gradient)',color:'#fff',
                  border:'none',cursor:'pointer',
                  boxShadow:'0 4px 20px color-mix(in srgb, var(--accent) 40%, transparent)',
                  transition:'transform 0.15s,box-shadow 0.15s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 28px color-mix(in srgb, var(--accent) 50%, transparent)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 20px color-mix(in srgb, var(--accent) 40%, transparent)'}}
              >
                ✦ Generate your influencer
              </button>
            </div>
          )}

          {/* Hero banner */}
          <HeroBanner influencer={influencer} pct={pct} onUpdate={v=>upd(influencer.id,v)}/>

          {/* Three image sections */}
          <Sec>
            <div className="inf-img-grid">
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-secondary)',marginBottom:8}}>Image</div>
                <MainImageSlot key={influencer.id} influencer={influencer} onChange={v=>upd(influencer.id,{mainImage:v})}
                  onLightbox={()=>setLightbox({images:topImages,index:topImages.indexOf(influencer.mainImage)})}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-secondary)',marginBottom:8}}>Character Sheet</div>
                <CharacterSheetSlot
                  key={influencer.id}
                  influencer={influencer}
                  onSave={v=>{upd(influencer.id,{characterSheetImage:v});if(v){addToHistory(influencer.id,{type:'image',label:'Character Sheet',url:v,date:Date.now()})}}}
                  onLightbox={()=>setLightbox({images:topImages,index:topImages.indexOf(influencer.characterSheetImage)})}
                />
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-secondary)',marginBottom:8}}>Close Ups</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <CloseUpSlot
                    key={`${influencer.id}-cu1`}
                    influencer={influencer} imageKey="closeUpImage1" label="Close up 1"
                    onSave={v=>{upd(influencer.id,{closeUpImage1:v});if(v)addToHistory(influencer.id,{type:'image',label:'Close Up',url:v,date:Date.now()})}}
                    onLightbox={()=>setLightbox({images:topImages,index:topImages.indexOf(influencer.closeUpImage1)})}
                  />
                  <CloseUpSlot
                    key={`${influencer.id}-cu2`}
                    influencer={influencer} imageKey="closeUpImage2" label="Feature sheet"
                    onSave={v=>{upd(influencer.id,{closeUpImage2:v});if(v)addToHistory(influencer.id,{type:'image',label:'Feature Sheet',url:v,date:Date.now()})}}
                    onLightbox={()=>setLightbox({images:topImages,index:topImages.indexOf(influencer.closeUpImage2)})}
                    promptFn={buildFeatureSheetPrompt}
                    genAspectRatio="2:3"
                    fit="contain"
                  />
                </div>
              </div>
            </div>
          </Sec>

          {/* Prompt */}
          <Sec>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>Prompt</div>
            <textarea value={influencer.prompt} onChange={e=>upd(influencer.id,{prompt:e.target.value})}
              placeholder="Paste your prompt here" rows={3}
              style={{width:'100%',padding:'10px 14px',borderRadius:'var(--radius-sm)',border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:14,color:'var(--text-primary)',resize:'vertical',lineHeight:1.6}}/>
          </Sec>

          {/* Detail tabs */}
          <div ref={tabSecRef}><Sec style={{marginBottom:20}}>
            <Tabs active={activeTab} onChange={tab=>{setActiveTab(tab);requestAnimationFrame(()=>tabSecRef.current?.scrollIntoView({behavior:'smooth',block:'start'}))}} ac={ac}/>

            {activeTab==='Overview' && <div style={{marginBottom:16}} id="looks"><InfluencerLooks key={influencer.id} influencer={influencer} onUpdate={patch=>upd(influencer.id,patch)}/></div>}
            {activeTab==='Overview' && <DescriptionForm influencer={influencer} onUpdate={upd}/>}
            {activeTab==='Overview' && <div style={{marginTop:16}}><PersonaVoice key={influencer.id} influencer={influencer} onUpdate={patch=>upd(influencer.id,patch)}/></div>}
            {activeTab==='Overview' && <div style={{marginTop:16}} id="posting-schedule"><PostingSchedule key={influencer.id} influencer={influencer} onUpdate={patch=>upd(influencer.id,patch)}/></div>}
            {activeTab==='Overview' && <div style={{marginTop:16}} id="insights"><InfluencerInsights key={influencer.id} influencer={influencer}/></div>}
            {activeTab==='Wardrobe' && (<>
              <WardrobeGenerator
                influencer={influencer}
                onAdd={slot => {
                  upd(influencer.id, { wardrobeSlots: [...(influencer.wardrobeSlots??[]), slot] })
                  if (slot.image) addToHistory(influencer.id, { type: 'image', label: `Wardrobe – ${slot.name}`, url: slot.image, date: Date.now() })
                }}
              />
              <WorldDropSection drops={influencer.wardrobeSlots??[]} onChange={slots=>upd(influencer.id,{wardrobeSlots:slots})}/>
            </>)}
            <div style={{ display: activeTab==='Brand Deals' ? 'block' : 'none' }}>
              <BrandDealSection deals={influencer.brandDeals??[]} onChange={deals=>upd(influencer.id,{brandDeals:deals})}/>
            </div>

          </Sec></div>
          </>
        </main>
      ) : isDark ? (
        <main style={{flex:1,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:'#07070E'}}>
          <div style={{position:'absolute',width:700,height:700,top:'-20%',left:'-15%',borderRadius:'50%',pointerEvents:'none',background:'radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 65%)',animation:'orb1 14s ease-in-out infinite'}}/>
          <div style={{position:'absolute',width:580,height:580,top:'-12%',right:'-10%',borderRadius:'50%',pointerEvents:'none',background:'radial-gradient(circle, rgba(0,113,227,0.18) 0%, transparent 65%)',animation:'orb2 19s ease-in-out infinite'}}/>
          <div style={{position:'absolute',width:700,height:700,bottom:'-28%',left:'20%',borderRadius:'50%',pointerEvents:'none',background:'radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 65%)',animation:'orb3 23s ease-in-out infinite'}}/>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',backgroundSize:'32px 32px'}}/>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(7,7,14,0.75) 100%)'}}/>
          <div style={{position:'relative',zIndex:1,textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:20,margin:'0 auto 24px',background:'var(--color-brand-gradient)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 40px color-mix(in srgb, var(--accent) 45%, transparent)'}}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="11" r="5.5" stroke="white" strokeWidth="2"/><path d="M4 28c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <h2 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.6px',color:'#fff',marginBottom:10,lineHeight:1.2}}>Build your first influencer</h2>
            <p style={{fontSize:14,color:'rgba(255,255,255,0.38)',marginBottom:28}}>Design a unique AI persona in minutes.</p>
            <button onClick={()=>navigate('/create')} style={{padding:'13px 36px',borderRadius:980,background:'var(--color-brand-gradient)',color:'#fff',fontSize:15,fontWeight:700,letterSpacing:'-0.2px',boxShadow:'0 0 32px color-mix(in srgb, var(--accent) 40%, transparent),0 4px 16px rgba(0,0,0,0.3)',transition:'transform 0.18s,box-shadow 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04) translateY(-1px)';e.currentTarget.style.boxShadow='0 0 52px color-mix(in srgb, var(--accent) 55%, transparent),0 8px 24px rgba(0,0,0,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 0 32px color-mix(in srgb, var(--accent) 40%, transparent),0 4px 16px rgba(0,0,0,0.3)'}}>+ Create Influencer</button>
          </div>
        </main>
      ) : (
        <main style={{flex:1,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3,opacity:0.18,pointerEvents:'none',transform:'scale(1.04)'}}>
            {['/inf/i1.png','/inf/i4.jpg','/inf/i2.png','/inf/i5.png','/inf/i3.jpg','/inf/i6.jpg'].map((src,i)=>(
              <img key={i} src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ))}
          </div>
          <div style={{position:'absolute',inset:0,backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',background:'rgba(255,255,255,0.82)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1,textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:20,margin:'0 auto 24px',background:'var(--color-brand-gradient)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px color-mix(in srgb, var(--accent) 40%, transparent)'}}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="11" r="5.5" stroke="white" strokeWidth="2"/><path d="M4 28c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <h2 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.6px',color:'var(--text-primary)',marginBottom:24}}>Build your first influencer</h2>
            <button onClick={()=>navigate('/create')} style={{padding:'13px 36px',borderRadius:980,background:'var(--color-brand-gradient)',color:'#fff',fontSize:15,fontWeight:700,letterSpacing:'-0.2px',boxShadow:'0 0 28px color-mix(in srgb, var(--accent) 35%, transparent),0 4px 16px rgba(0,0,0,0.12)',transition:'transform 0.18s,box-shadow 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04) translateY(-1px)';e.currentTarget.style.boxShadow='0 0 48px color-mix(in srgb, var(--accent) 50%, transparent),0 8px 24px rgba(0,0,0,0.14)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 0 28px color-mix(in srgb, var(--accent) 35%, transparent),0 4px 16px rgba(0,0,0,0.12)'}}>+ Create Influencer</button>
          </div>
        </main>
      ))}
    </div>
  )
}
