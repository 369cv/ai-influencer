import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfluencers } from '../store'
import { Seg } from '../components/ui'
import { isHFConnected, startHiggsfieldOAuthPopup } from '../utils/higgsfieldAuth'
import { generateNImages, generateVideo } from '../utils/higgsfieldGenerate'
import { downloadImage } from '../utils/imageUtils'
import { hasClaude, runSkill } from '../utils/claudeAssist'
import { MODEL_LABELS } from '../utils/creditEstimate'
import RemixVideo from '../components/RemixVideo'
import {
  PHOTO_MODELS, VIDEO_MODELS, PHOTO_RATIOS, VIDEO_RATIOS, PHOTO_RES, VIDEO_RES, VIDEO_SECONDS, MAX_SHOTS,
  DEFAULTS, STUDIO_TEMPLATES, estimate, readJobs, writeJobs, SESSION, addToMediaHistory, uploadable, buildStudioPrompt, toRecipe, RECIPE_KEYS,
} from '../utils/studio'
import { newId } from '../utils/localJson'

// Studio: one page to make photos and videos. The prompt bar holds every setting
// as a chip; the feed above keeps every run with its settings and next actions.

const MODES = [{ id: 'photo', label: 'Photo' }, { id: 'video', label: 'Video' }]
const isVideoUrl = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')
const ago = t => {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })
}
const ENHANCE_SKILL = {
  name: 'Prompt enhancer',
  instructions: 'Rewrite the user\'s image or video prompt so it is specific and photographic: subject action, setting, light, lens and mood, in one paragraph under 60 words. Keep every detail the user gave. Do not add a person\'s name. Return only the rewritten prompt.',
}

function blankSettings(mode = 'photo') {
  return { mode, prompt: '', motion: '', influencerId: null, refs: [], shots: [], ...DEFAULTS[mode] }
}

export default function Studio() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [influencers] = useInfluencers()
  const [jobs, setJobsState] = useState(readJobs)
  const [s, setS] = useState(() => blankSettings(params.get('mode') === 'video' ? 'video' : 'photo'))
  const [hf, setHf] = useState(isHFConnected)
  const [enhance, setEnhance] = useState(false)
  const [showMotion, setShowMotion] = useState(false)
  const [showRemix, setShowRemix] = useState(false)
  const [editingShots, setEditingShots] = useState(false)
  const [notice, setNotice] = useState('')
  const [showTemplates, setShowTemplates] = useState(params.get('templates') === '1')
  const cancels = useRef({})
  const fileRef = useRef(null)
  const promptRef = useRef(null)

  const setJobs = updater => setJobsState(prev => { const next = typeof updater === 'function' ? updater(prev) : updater; writeJobs(next); return next })
  const updateJob = (id, patch) => setJobs(l => l.map(j => j.id === id ? { ...j, ...(typeof patch === 'function' ? patch(j) : patch) } : j))
  const set = patch => setS(x => ({ ...x, ...patch }))
  const inf = (influencers || []).find(i => i.id === s.influencerId)
  const credits = estimate({ ...s, count: s.mode === 'photo' && s.shots.length ? s.shots.length : s.count })

  // Entry points: profile "Open in Studio", Media "Use as reference / Make video", templates, ?mode=
  useEffect(() => {
    // Only one-shot navigation state triggers this; ?mode= is read once in the initial state.
    const st = location.state || {}
    const mode = st.mode || null
    if (st.recipe && typeof st.recipe === 'object') {
      // Content → Recreate: reopen with the exact settings that made the item.
      const r = st.recipe
      const m = r.mode === 'video' ? 'video' : 'photo'
      const next = blankSettings(m)
      RECIPE_KEYS.forEach(k => { if (k !== 'mode' && r[k] != null) next[k] = r[k] })
      next.refs = (Array.isArray(r.refs) ? r.refs : []).slice(0, 4)
      setS(next)
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
    if (st.influencerId || st.ref || st.template || mode) {
      setS(x => {
        let next = mode && mode !== x.mode ? { ...blankSettings(mode), influencerId: x.influencerId } : { ...x }
        if (st.influencerId) next.influencerId = st.influencerId
        if (st.ref) next.refs = [...new Set([st.ref, ...next.refs])].slice(0, 4)
        if (st.motion && (mode || next.mode) === 'video') next.prompt = st.motion
        return next
      })
      if (st.template) applyTemplate(STUDIO_TEMPLATES.find(t => t.id === st.template))
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
    if (params.get('template')) {
      applyTemplate(STUDIO_TEMPLATES.find(t => t.id === params.get('template')))
      setParams(p => { p.delete('template'); return p }, { replace: true })
    }
    if (params.get('templates') === '1') setShowTemplates(true)
  }, [location.key]) // eslint-disable-line

  // New → Video while already on the Studio: follow ?mode=
  const urlMode = params.get('mode') === 'video' ? 'video' : 'photo'
  useEffect(() => {
    if (urlMode !== s.mode) setS(x => ({ ...blankSettings(urlMode), influencerId: x.influencerId, prompt: x.prompt, refs: x.refs }))
  }, [urlMode]) // eslint-disable-line

  useEffect(() => {
    if (!s.influencerId && influencers?.length) set({ influencerId: influencers[influencers.length - 1].id })
  }, [influencers?.length]) // eslint-disable-line

  function switchMode(mode) {
    if (mode === s.mode) return
    setS(x => ({ ...blankSettings(mode), influencerId: x.influencerId, prompt: x.prompt, refs: x.refs }))
    setEditingShots(false)
    setParams(p => { if (mode === 'video') p.set('mode', 'video'); else p.delete('mode'); return p }, { replace: true })
  }

  function applyTemplate(t) {
    if (!t) return
    setS(x => ({ ...blankSettings(t.mode), influencerId: x.influencerId, refs: x.refs, prompt: t.prompt, ...(t.count ? { count: t.count } : {}), ...(t.ratio ? { ratio: t.ratio } : {}), ...(t.seconds ? { seconds: t.seconds } : {}), shots: t.shots ? [...t.shots] : [] }))
    setEditingShots(!!t.shots)
    setShowTemplates(false)
    setParams(p => { p.delete('templates'); if (t.mode === 'video') p.set('mode', 'video'); else p.delete('mode'); return p }, { replace: true })
    setNotice(t.needs === 'outfit' ? 'Add the outfit photo with + before generating.' : t.needs === 'product' ? 'Add the product photo with + before generating.' : '')
    setTimeout(() => promptRef.current?.focus(), 50)
  }

  function addFiles(e) {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    Promise.all(files.filter(f => f.type.startsWith('image/')).map(f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })))
      .then(urls => set({ refs: [...s.refs, ...urls].slice(0, 4) }))
  }

  async function connect() {
    try { await startHiggsfieldOAuthPopup(); setHf(true) } catch (e) { if (e.message !== 'cancelled') setNotice('Could not connect Higgsfield: ' + e.message) }
  }

  async function run(settings = s) {
    if (!isHFConnected()) { setHf(false); setNotice('Connect Higgsfield to generate.'); return }
    if (!settings.prompt.trim() && !settings.shots.some(x => x.trim())) { setNotice('Describe what you want first.'); promptRef.current?.focus(); return }
    setNotice('')
    const who = (influencers || []).find(i => i.id === settings.influencerId)
    let prompt = settings.prompt.trim()
    if (enhance && hasClaude() && prompt && settings === s) {
      try { prompt = await runSkill({ skill: ENHANCE_SKILL, task: prompt, maxTokens: 300 }) } catch (e) { setNotice('Prompt enhance failed; used your prompt as written.') }
    }
    const shots = settings.mode === 'photo' ? settings.shots.map(x => x.trim()).filter(Boolean) : []
    const count = shots.length || settings.count
    const id = newId('job')
    const job = { id, sessionId: SESSION, status: 'running', progress: 2, urls: [], createdAt: Date.now(), credits: estimate({ ...settings, count }),
      settings: { ...settings, prompt, shots, count, refs: settings.refs.filter(r => !r.startsWith('data:')) }, refCount: settings.refs.length, influencerName: who?.name || null }
    setJobs(l => [job, ...l])
    const recipe = toRecipe({ ...job.settings, count: 1 }, estimate({ ...settings, count: 1 }))
    cancels.current[id] = false
    const isCancelled = () => cancels.current[id]
    const onProgress = p => updateJob(id, j => ({ progress: Math.max(j.progress || 0, Math.round(p)) }))
    const refs = settings.refs.map(uploadable)

    try {
      if (settings.mode === 'video') {
        // Start frame (first reference, if any) goes in as @image_1, then the influencer's face.
        const referenceImages = [...refs, who?.mainImage].filter(Boolean).slice(0, 4).map(uploadable)
        const result = await generateVideo({
          prompt: [who && `The person is ${who.name}; keep their exact face and look.`, prompt].filter(Boolean).join(' '),
          aspectRatio: settings.ratio, duration: settings.seconds, count, model: settings.model, resolution: settings.resolution,
          referenceImages, onProgress, isCancelled,
          onPartialResults: urls => updateJob(id, { urls: [...new Set(urls.filter(Boolean))] }),
        })
        const urls = [...new Set((result?.urls || []).filter(Boolean))]
        urls.forEach(url => addToMediaHistory({ url, influencer: who, ratio: settings.ratio, jobId: id, recipe }))
        updateJob(id, { status: urls.length ? 'done' : 'failed', urls, progress: 100, error: urls.length ? '' : 'No video came back. Check your Higgsfield dashboard.' })
      } else {
        const face = who?.mainImage ? uploadable(who.mainImage) : null
        const closeUps = [who?.closeUpImage1, who?.closeUpImage2].filter(Boolean).map(uploadable)
        const base = { prompt, influencer: who, refCount: refs.length, hasFace: !!face, closeUps: closeUps.length }
        const prompts = shots.length
          ? shots.map(shot => buildStudioPrompt({ ...base, shot }))
          : Array.from({ length: count }, (_, i) => buildStudioPrompt({ ...base, shot: count > 1 ? `Variation ${i + 1} of ${count}: vary pose and framing slightly` : '' }))
        await generateNImages({
          prompt: prompts, count, aspectRatio: settings.ratio, resolution: settings.resolution, model: settings.model,
          // Upload order = @image tags in buildStudioPrompt: face, references, close-ups.
          referenceImage: face, outfitImage: refs[0] || null, propImages: [...refs.slice(1), ...closeUps],
          onProgress, isCancelled,
          onResult: url => {
            updateJob(id, j => ({ urls: [...new Set([...(j.urls || []), url])] }))
            addToMediaHistory({ url, influencer: who, ratio: settings.ratio, jobId: id, recipe })
          },
        })
        updateJob(id, j => ({ status: j.urls.length ? 'done' : 'failed', progress: 100, error: j.urls.length ? '' : 'Nothing came back. Check your Higgsfield dashboard.' }))
      }
    } catch (e) {
      const cancelled = /CANCELLED/.test(e.message || '')
      updateJob(id, j => ({ status: cancelled ? (j.urls.length ? 'done' : 'cancelled') : (j.urls.length ? 'done' : 'failed'), error: cancelled ? '' : e.message, progress: 100 }))
    } finally {
      delete cancels.current[id]
    }
  }

  const loadJob = (j, patch = {}) => {
    const st = j.settings
    setS({ ...blankSettings(st.mode), ...st, refs: st.refs || [], shots: st.shots || [], ...patch })
    setEditingShots(!!(st.shots?.length))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => promptRef.current?.focus(), 50)
  }
  const useAsRef = url => { set({ refs: [...new Set([url, ...s.refs])].slice(0, 4) }); setNotice('Added as a reference.') }
  const makeVideo = (url, j) => { const motion = j?.settings?.motion || ''; setS({ ...blankSettings('video'), influencerId: j?.settings?.influencerId || s.influencerId, prompt: motion, refs: [url] }); setParams(p => { p.set('mode', 'video'); return p }, { replace: true }); setNotice(motion ? 'The photo is the start frame, and its motion prompt is filled in.' : 'The photo is the start frame. Describe the motion.') }
  const post = (url, j) => navigate('/content?compose=1', { state: { prefillMedia: url, influencerId: j?.settings?.influencerId } })

  const models = s.mode === 'video' ? VIDEO_MODELS : PHOTO_MODELS
  const ratios = s.mode === 'video' ? VIDEO_RATIOS : PHOTO_RATIOS
  const resList = s.mode === 'video' ? VIDEO_RES : PHOTO_RES
  const maxCount = s.mode === 'video' ? 2 : 4
  const running = jobs.some(j => j.status === 'running')

  return (
    <div className="muse-studio">
      <header className="muse-studio-head">
        <h1>Studio</h1>
        <Seg options={MODES} value={s.mode} onChange={switchMode} label="Mode" />
        <button type="button" className="muse-btn muse-btn-text" onClick={() => setShowRemix(true)}>Remix a video</button>
        <button type="button" className="muse-btn muse-btn-text" onClick={() => setShowTemplates(v => !v)} aria-expanded={showTemplates}>Templates</button>
      </header>

      {(showTemplates || jobs.length === 0) && <TemplateGrid onPick={applyTemplate} />}

      {showRemix && <RemixVideo onClose={() => setShowRemix(false)} defaultInfluencerId={s.influencerId} />}
      <section className="muse-feed" aria-label="Your generations">
        {jobs.map(j => (
          <JobRow key={j.id} job={j}
            onRecreate={() => run({ ...blankSettings(j.settings.mode), ...j.settings, refs: j.settings.refs || [], shots: j.settings.shots || [] })}
            onEdit={() => loadJob(j)}
            onCancel={() => { cancels.current[j.id] = true }}
            onRemove={() => setJobs(l => l.filter(x => x.id !== j.id))}
            onUseRef={useAsRef} onMakeVideo={url => makeVideo(url, j)} onPost={url => post(url, j)}
          />
        ))}
      </section>

      <form className="muse-pbar" onSubmit={e => { e.preventDefault(); run() }}>
        {!hf && (
          <div className="muse-pbar-note">
            <span>Connect your Higgsfield account to generate. Images use your own credits.</span>
            <button type="button" className="muse-btn muse-btn-tonal" onClick={connect}>Connect Higgsfield</button>
          </div>
        )}
        {notice && <p className="muse-pbar-notice" role="status">{notice}</p>}

        {s.refs.length > 0 && (
          <div className="muse-pbar-refs" aria-label="References">
            {s.refs.map((r, i) => (
              <span key={r.slice(0, 64) + i} className="muse-pbar-ref" style={{ backgroundImage: `url(${r})` }} title={s.mode === 'video' && i === 0 ? 'Start frame' : 'Reference'}>
                {s.mode === 'video' && i === 0 && <em>Start</em>}
                <button type="button" aria-label="Remove reference" onClick={() => set({ refs: s.refs.filter((_, k) => k !== i) })}>✕</button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={promptRef}
          className="muse-pbar-input"
          value={s.prompt}
          onChange={e => set({ prompt: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run() } }}
          placeholder={s.mode === 'video' ? `Describe the motion${inf ? ` for ${inf.name}` : ''}: what happens, camera, mood…` : `Describe the shot${inf ? ` of ${inf.name}` : ''}: setting, outfit, light, mood…`}
          rows={2}
          aria-label="Prompt"
        />

        {s.mode === 'photo' && (showMotion || s.motion) && (
          <input
            className="muse-input muse-input-sm"
            value={s.motion}
            onChange={e => set({ motion: e.target.value })}
            placeholder="Motion for when you animate it: slow turn to camera, hair in the wind…"
            aria-label="Motion prompt"
            style={{ marginTop: 2 }}
          />
        )}

        {editingShots && s.mode === 'photo' && (
          <div className="muse-shots" aria-label="Shot list">
            {s.shots.map((shot, i) => (
              <div key={i} className="muse-shot">
                <span>{i + 1}</span>
                <input className="muse-input muse-input-sm" value={shot} onChange={e => set({ shots: s.shots.map((x, k) => k === i ? e.target.value : x) })} placeholder="Pose, outfit or scene for this shot" aria-label={`Shot ${i + 1}`} />
                <button type="button" className="muse-btn muse-btn-text" aria-label={`Remove shot ${i + 1}`} onClick={() => set({ shots: s.shots.filter((_, k) => k !== i) })}>✕</button>
              </div>
            ))}
            {s.shots.length < MAX_SHOTS && <button type="button" className="muse-btn muse-btn-text muse-shot-add" onClick={() => set({ shots: [...s.shots, ''] })}>+ Add shot</button>}
          </div>
        )}

        <div className="muse-pbar-row">
          <button type="button" className="muse-pchip icon" onClick={() => fileRef.current?.click()} aria-label="Add a reference photo" title={s.mode === 'video' ? 'Add a start frame or reference' : 'Add an outfit, product or style reference'}>＋</button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addFiles} />

          <label className="muse-pchip character" title="Character">
            <span className="muse-rail-avatar" style={{ backgroundImage: (inf?.mainImage || inf?.image) ? `url(${inf.mainImage || inf.image})` : undefined }} />
            <select value={s.influencerId || ''} onChange={e => set({ influencerId: e.target.value || null })} aria-label="Character">
              <option value="">No character</option>
              {(influencers || []).map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
            </select>
          </label>

          <label className="muse-pchip"><select value={s.model} onChange={e => set({ model: e.target.value })} aria-label="Model">{models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
          <label className="muse-pchip"><select value={s.ratio} onChange={e => set({ ratio: e.target.value })} aria-label="Aspect ratio">{ratios.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
          <label className="muse-pchip"><select value={s.resolution} onChange={e => set({ resolution: e.target.value })} aria-label="Resolution">{resList.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}</select></label>
          {s.mode === 'video' && <label className="muse-pchip"><select value={s.seconds} onChange={e => set({ seconds: Number(e.target.value) })} aria-label="Length">{VIDEO_SECONDS.map(n => <option key={n} value={n}>{n}s</option>)}</select></label>}

          {s.mode === 'photo' && s.shots.length > 0
            ? <button type="button" className={`muse-pchip${editingShots ? ' on' : ''}`} onClick={() => setEditingShots(v => !v)} aria-expanded={editingShots}>{s.shots.length} shots</button>
            : (
              <span className="muse-pchip stepper" role="group" aria-label="Number of outputs">
                <button type="button" onClick={() => set({ count: Math.max(1, s.count - 1) })} aria-label="Fewer" disabled={s.count <= 1}>−</button>
                <span>{s.count}</span>
                <button type="button" onClick={() => set({ count: Math.min(maxCount, s.count + 1) })} aria-label="More" disabled={s.count >= maxCount}>+</button>
              </span>
            )}
          {s.mode === 'photo' && !s.shots.length && <button type="button" className="muse-pchip" onClick={() => { set({ shots: Array.from({ length: s.count }, () => '') }); setEditingShots(true) }} title="Write a different shot for each image">Shot list</button>}

          {s.mode === 'photo' && <button type="button" className={`muse-pchip${showMotion || s.motion ? ' on' : ''}`} aria-pressed={showMotion || !!s.motion} onClick={() => { if (showMotion || s.motion) { setShowMotion(false); set({ motion: '' }) } else setShowMotion(true) }} title="Save a motion prompt with these photos, used when you animate them">Motion</button>}
          <button type="button" className={`muse-pchip${enhance ? ' on' : ''}`} aria-pressed={enhance} disabled={!hasClaude()} onClick={() => setEnhance(v => !v)} title={hasClaude() ? 'Rewrite the prompt with Claude before generating' : 'Add your Anthropic key in Settings → Connections to use this'}>✦ Enhance</button>

          <button type="submit" className="muse-pbar-go" disabled={!hf}>
            Generate{credits != null && <small>~{credits} credits</small>}
          </button>
        </div>
        <p className="muse-pbar-hint">{running ? 'You can start another while this one runs. ' : ''}Estimates only; Higgsfield bills the real amount. ⌘/Ctrl + Enter to generate.</p>
      </form>
    </div>
  )
}

function TemplateGrid({ onPick }) {
  return (
    <section className="muse-templates" aria-label="Templates">
      <div className="muse-section-head"><h2>Start from a template</h2><Link to="/workflows" className="muse-text-btn">Multi-step workflows</Link></div>
      <div className="muse-template-grid">
        {STUDIO_TEMPLATES.map(t => (
          <button key={t.id} type="button" className="muse-template" onClick={() => onPick(t)}>
            <strong>{t.label}</strong><small>{t.hint}</small>
            <span className="muse-template-meta">{t.mode === 'video' ? `Video · ${t.seconds || 5}s` : `${t.shots?.length || t.count} photos`}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function JobRow({ job: j, onRecreate, onEdit, onCancel, onRemove, onUseRef, onMakeVideo, onPost }) {
  const st = j.settings
  const total = st.count || 1
  const pending = j.status === 'running' ? Math.max(0, total - j.urls.length) : 0
  const label = [MODEL_LABELS[st.model] || st.model, st.ratio, String(st.resolution).toUpperCase(), st.mode === 'video' ? `${st.seconds}s` : null, `${total} ${st.mode === 'video' ? (total > 1 ? 'videos' : 'video') : (total > 1 ? 'images' : 'image')}`, j.credits != null ? `~${j.credits} credits` : null].filter(Boolean).join(' · ')
  return (
    <article className={`muse-job ${j.status}`}>
      <div className="muse-job-meta">
        <strong>{st.prompt || st.shots?.[0] || 'Untitled'}</strong>
        <small>{[j.influencerName, label].filter(Boolean).join(' · ')}</small>
        <small>{j.status === 'running' ? `Generating… ${j.progress || 0}%` : j.status === 'failed' ? 'Failed' : j.status === 'cancelled' ? 'Cancelled' : j.status === 'interrupted' ? 'Interrupted (page was closed)' : ago(j.createdAt)}</small>
        {j.error && <small className="muse-error">{j.error}</small>}
        {j.refCount > 0 && st.refs?.length < j.refCount && <small>Uploaded references aren’t kept; add them again to recreate exactly.</small>}
        <div className="muse-job-acts">
          {j.status === 'running'
            ? <button type="button" className="muse-chip" onClick={onCancel}>Cancel</button>
            : <><button type="button" className="muse-chip" onClick={onRecreate}>Recreate</button><button type="button" className="muse-chip" onClick={onEdit}>Edit</button><button type="button" className="muse-chip" onClick={onRemove} aria-label="Remove from feed">Remove</button></>}
        </div>
      </div>
      <div className="muse-job-tiles" style={{ '--ratio': (st.ratio || '4:5').replace(':', '/') }}>
        {j.urls.map(url => (
          <div key={url} className="muse-tile-media">
            {isVideoUrl(url) || st.mode === 'video'
              ? <video src={url} controls playsInline preload="metadata" />
              : <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" loading="lazy" /></a>}
            <div className="muse-tile-acts">
              {st.mode !== 'video' && <button type="button" onClick={() => onUseRef(url)}>Use as reference</button>}
              {st.mode !== 'video' && <button type="button" onClick={() => onMakeVideo(url)}>Make video</button>}
              <button type="button" onClick={() => onPost(url)}>Post</button>
              <button type="button" onClick={() => downloadImage(url, `muse-${j.id}`)}>Download</button>
            </div>
          </div>
        ))}
        {Array.from({ length: pending }, (_, i) => <div key={`p${i}`} className="muse-tile-media pending"><span>Generating…</span></div>)}
      </div>
    </article>
  )
}
