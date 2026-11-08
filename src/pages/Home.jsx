import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useInfluencers } from '../store'
import { collectLibrary } from '../utils/library'
import NeedsYou from '../components/NeedsYou'
import SetupSteps from '../components/SetupSteps'
import AttachSheet from '../components/AttachSheet'
import { TEMPLATES } from '../utils/workflows'
import { runnable } from '../utils/workflowRun'
import CreatePlan from '../components/CreatePlan'
import { SESSIONS_KEY, normalizeSessions, startSession, RATIOS } from '../utils/createSessions'
import { useLocalJSON } from '../utils/localJson'

// Home: setup steps for the selected influencer, one create box with a workflow
// dropdown (each workflow sets its own placeholder and chips), workflow cards that
// switch the box, and Recent. Photoshoots become a free, editable plan (?s=<id>);
// the other workflows hand everything typed and attached to the page that runs them.
const nm = i => i?.name || 'your influencer'
const WORKFLOWS = [
  { id: 'talk', label: 'Talking video', desc: 'A script, said in their own voice.', icon: 'M4 9h16v11H4zM4 9l3-5h13l-3 5M8 4l-1 5M14 4l-1 5', placeholder: i => `Write or paste what ${nm(i)} says. About 24 words fit in 10 seconds…`, attach: { max: 1, title: 'Pick the look', hint: 'the photo the video starts from' } },
  { id: 'video', label: 'Video', desc: 'A prompt and a picture, animated by Seedance.', icon: 'M15 4V2M15 10V8M11 6h-2M21 6h-2M5 21l10-10', placeholder: i => `Describe the shot of ${nm(i)}: setting, camera move, mood…`, attach: { max: 1, title: 'Starting picture', hint: 'used as the reference' } },
  { id: 'shoot', label: 'Photoshoot', desc: 'New photos, planned before anything is made.', icon: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', placeholder: i => `Describe the shoot for ${nm(i)}: setting, wardrobe, lighting…`, attach: { max: 1, title: 'Pick a look', hint: 'outfit and setting to keep' } },
  { id: 'post', label: 'Post', desc: 'A caption, media and a slot in the queue.', icon: 'M4 12l16-8-6 16-3-7z', placeholder: i => `Write ${nm(i)}’s caption or describe the post…`, attach: { max: 10, kinds: 'any', title: 'Add to the post', hint: 'up to 10' } },
  { id: 'influencer', label: 'New influencer', desc: 'Describe them, or design from traits.', icon: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M19 8v6M16 11h6', placeholder: () => 'Describe a new influencer: niche, vibe, story…', attach: { max: 1, title: 'Face photo', hint: 'a starting face (optional)' }, noWho: true },
]
const Icon = ({ d, size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
const SECONDS = [5, 8, 10]
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

// Workflow templates that can actually run become "Browse setups" under Photoshoot.
const RECIPES = TEMPLATES.filter(t => runnable(t).ok)

export default function Home() {
  const navigate = useNavigate()
  const [influencers] = useInfluencers()
  const [params, setParams] = useSearchParams()
  const sessionId = params.get('s')
  const [target, setTarget] = useState(() => { try { const v = localStorage.getItem('muse_home_target'); return WORKFLOWS.some(x => x.id === v) ? v : 'shoot' } catch { return 'shoot' } })
  const [menu, setMenu] = useState(false)       // workflow dropdown
  const [attaching, setAttaching] = useState(false)
  const [attached, setAttached] = useState([])
  const [setups, setSetups] = useState(false)   // Browse setups (Photoshoot)
  const [seconds, setSeconds] = useState(10)
  const [who, setWho] = useState(() => { try { return localStorage.getItem('muse_create_who') || '' } catch { return '' } })
  const [ratio, setRatio] = useState('9:16')
  const [drafting, setDrafting] = useState(false)
  const [text, setText] = useState('')
  const [rawSessions] = useLocalJSON(SESSIONS_KEY, [])
  const sessions = normalizeSessions(rawSessions)
  const boxRef = useRef(null)
  // Profile "Create with her" / Add looks → Describe: preselect her and prefill the box.
  const location = useLocation()
  useEffect(() => {
    const st = location.state || {}
    if (!st.createFor && !st.createText) return
    if (st.createFor) { setWho(st.createFor); try { localStorage.setItem('muse_create_who', st.createFor) } catch {} }
    setTarget('shoot')
    if (st.createText) setText(st.createText)
    setTimeout(() => boxRef.current?.focus(), 0)
    navigate(location.pathname + location.search, { replace: true, state: {} })
  }, [location.key]) // eslint-disable-line
  // Sidebar "New" lands here with ?new=1: focus the box.
  useEffect(() => { if (params.get('new')) { boxRef.current?.focus(); setParams(q => { q.delete('new'); return q }, { replace: true }) } }, [params]) // eslint-disable-line
  const media = useMemo(() => collectLibrary(influencers || []).slice(0, 4), [influencers])
  const t = WORKFLOWS.find(x => x.id === target) || WORKFLOWS[2]

  function pick(id) {
    setTarget(id); setMenu(false); setAttached([]); setSetups(false)
    try { localStorage.setItem('muse_home_target', id) } catch {}
    setTimeout(() => boxRef.current?.focus(), 0)
  }

  const list = influencers || []
  const creator = list.find(i => i.id === who) || list[list.length - 1]
  const pickWho = id => { setWho(id); try { localStorage.setItem('muse_create_who', id) } catch {} }

  async function submit(e) {
    e.preventDefault()
    const v = text.trim()
    if (drafting || (!v && target !== 'post')) return
    const influencerId = creator?.id || undefined
    if (target === 'shoot') {
      setDrafting(true)
      try { const id = await startSession({ request: v, influencer: creator, ratio, lookUrl: attached[0] }); setText(''); setAttached([]); setParams({ s: id }) } finally { setDrafting(false) }
      return
    }
    if (target === 'talk') navigate('/talk', { state: { influencerId, script: v, seconds, ratio, look: attached[0] } })
    else if (target === 'video') navigate('/studio?mode=video', { state: { mode: 'video', influencerId, prefillPrompt: v, ref: attached[0] } })
    else if (target === 'post') navigate('/content?compose=1', { state: { influencerId, prefillCaption: v, prefillMediaList: attached } })
    else navigate('/create', { state: { prefillBackstory: v || undefined, prefillFaceRef: attached[0] || undefined } })
  }

  // A request is open: the plan (then its results) gets the whole page.
  if (sessionId) return <div className="muse-home"><CreatePlan id={sessionId} onClose={() => setParams({})} /></div>

  return (
    <div className="muse-home">
      <div className="muse-glow" aria-hidden />
      <section className="muse-hero muse-home2">
        <h1 className="muse-display">{greeting()}</h1>
        {!t.noWho && <SetupSteps influencer={creator} />}

        <form className="muse-composer muse-composer-stack muse-wfbox" onSubmit={submit}>
          <div className="muse-wf-dd">
            <button type="button" className="muse-wf-ddbtn" aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu(m => !m)}>
              <Icon d={t.icon} />{t.label}<Icon d="M6 9l6 6 6-6" size={14} />
            </button>
            {menu && (
              <ul className="muse-wf-menu" role="listbox" aria-label="Workflow">
                {WORKFLOWS.map(w => (
                  <li key={w.id} role="option" aria-selected={w.id === target} className={w.id === 'influencer' ? 'sep' : ''}>
                    <button type="button" onClick={() => pick(w.id)}><Icon d={w.icon} /><span><b>{w.label}</b><small>{w.desc}</small></span></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <textarea
            ref={boxRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
            placeholder={t.placeholder(creator)}
            aria-label={t.placeholder(creator)}
            rows={2}
          />
          {attached.length > 0 && (
            <div className="muse-wf-attached">
              {attached.map(u => <span key={u} className="muse-thumb" style={{ backgroundImage: isVideo(u) ? undefined : `url(${u})` }}>{isVideo(u) && <em>Video</em>}<button type="button" aria-label="Remove" onClick={() => setAttached(a => a.filter(x => x !== u))}>✕</button></span>)}
            </div>
          )}
          <div className="muse-composer-row muse-wf-chips">
            <button type="button" className="muse-chip" onClick={() => setAttaching(true)}><Icon d="M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" size={14} />Attach</button>
            {target === 'video' && <Link to="/inspiration" className="muse-chip">Inspiration</Link>}
            {target === 'shoot' && RECIPES.length > 0 && <button type="button" className={`muse-chip${setups ? ' on' : ''}`} aria-expanded={setups} onClick={() => setSetups(v => !v)}>Browse setups</button>}
            {!t.noWho && list.length > 0 && (
              <label className="muse-chip muse-wf-who">
                <span className="muse-create-av" style={{ width: 20, height: 20, backgroundImage: (creator?.mainImage || creator?.image) ? `url(${creator.mainImage || creator.image})` : undefined }} />
                {creator?.name || 'Influencer'}
                <select value={creator?.id || ''} onChange={e => pickWho(e.target.value)} aria-label="Influencer">
                  {list.map(i => <option key={i.id} value={i.id}>{i.name || 'Untitled'}</option>)}
                </select>
              </label>
            )}
            {target === 'talk' && (creator?.voiceProfile?.voiceId
              ? <span className="muse-chip" title="Set on her profile">Voice: {creator.voiceProfile.voiceName || 'ElevenLabs'}</span>
              : <Link to="/influencers" state={{ selectId: creator?.id }} className="muse-chip">No voice yet · add one</Link>)}
            {target === 'talk' && <label className="muse-chip muse-wf-who">{seconds}s<select value={seconds} onChange={e => setSeconds(Number(e.target.value))} aria-label="Length">{SECONDS.map(n => <option key={n} value={n}>{n}s</option>)}</select></label>}
            {target === 'video' && <span className="muse-chip" title="Video model">Seedance 2.0</span>}
            {(target === 'talk' || target === 'video' || target === 'shoot') && <label className="muse-chip muse-wf-who">{ratio}<select value={ratio} onChange={e => setRatio(e.target.value)} aria-label="Format">{RATIOS.map(r => <option key={r} value={r}>{r}</option>)}</select></label>}
            {target === 'influencer' && <Link to="/design" className="muse-chip">Design from traits instead</Link>}
            <span className="muse-create-hint">{target === 'shoot' ? (drafting ? 'Drafting the plan…' : 'Plan is free') : target === 'talk' ? 'Cost shown first' : ''}</span>
            <button type="submit" className="muse-send" aria-label={`Start: ${t.label}`} title={`Start: ${t.label}`} disabled={drafting || (!text.trim() && target !== 'post')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>
          {setups && target === 'shoot' && (
            <div className="muse-wf-setups" aria-label="Setups">
              {RECIPES.map(r => <Link key={r.id} to={`/workflows/${r.id}`} className="muse-chip" title={r.blurb}>{r.title}</Link>)}
            </div>
          )}
        </form>

        <div className="muse-wf-cards" role="radiogroup" aria-label="What to make">
          {WORKFLOWS.map(w => (
            <button key={w.id} type="button" role="radio" aria-checked={target === w.id} className={`muse-wf-card${target === w.id ? ' on' : ''}`} onClick={() => pick(w.id)}>
              <Icon d={w.icon} size={18} /><b>{w.label}</b><small>{w.desc}</small>
            </button>
          ))}
        </div>

        {sessions.length > 0 && (
          <div className="muse-create-recent" aria-label="Recent requests">
            {sessions.slice(0, 6).map(x => (
              <button key={x.id} type="button" className="muse-chip" onClick={() => setParams({ s: x.id })} title={x.request}>
                {x.plan?.title || x.request.slice(0, 40)} <span className="muse-muted">· {{ plan: 'plan', running: 'making', done: 'ready', failed: 'failed', stopped: 'stopped' }[x.status]}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {media.length > 0 && (
        <section className="muse-recent muse-home-recent-sec" aria-labelledby="home-recent">
          <div className="muse-section-head"><h2 id="home-recent">Recent</h2><Link to="/content?view=media" className="muse-text-btn">See all in Content</Link></div>
          <div className="muse-home-recent">
            {media.map(it => (
              <Link key={it.id} to="/content?view=media" className="muse-home-recent-tile" style={{ backgroundImage: it.kind === 'photo' ? `url(${it.url})` : undefined }}>
                {it.kind === 'video' && <video src={it.url} muted playsInline preload="metadata" />}
                <span className="muse-badge">{it.kind === 'video' ? 'Video' : 'Photo'}</span><span className="muse-badge muse-home-recent-who">{it.influencerName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {attaching && <AttachSheet influencer={t.noWho ? null : creator} max={t.attach.max} kinds={t.attach.kinds || 'photo'} title={t.attach.title} hint={t.attach.hint} onAdd={urls => setAttached(urls)} onClose={() => setAttaching(false)} />}

      <NeedsYou />

    </div>
  )
}
