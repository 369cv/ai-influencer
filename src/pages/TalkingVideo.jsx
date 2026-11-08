import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useInfluencers } from '../store'
import { Page } from '../components/ui'
import { getElevenKey, voiceover } from '../utils/elevenlabs'
import { getHFToken } from '../utils/higgsfieldAuth'
import { generateVideo, elementFor } from '../utils/higgsfieldGenerate'
import { hasClaude, runSkill, influencerContext } from '../utils/claudeAssist'
import { addToMediaHistory, uploadable, VIDEO_SECONDS } from '../utils/studio'
import { VIDEO_CREDITS_PER_SECOND } from '../utils/creditEstimate'
import { wordsFrom, captionLines, toSRT, toVTT, spokenSeconds, wordBudget, countWords } from '../utils/captions'
import { downloadImage } from '../utils/imageUtils'

// Talking video: script (with a word budget for the length) → her ElevenLabs voice
// (with timing) → Higgsfield Seedance lip-synced to that audio → captions from the
// timing → post. Each paid step shows what it uses before it runs.
const MODEL = 'seedance_2_0'
const RESOLUTIONS = ['720p', '1080p']
const RATIOS = ['9:16', '1:1', '16:9']

export default function TalkingVideo() {
  const [influencers] = useInfluencers()
  const location = useLocation()
  const navigate = useNavigate()
  const list = influencers || []
  const [infId, setInfId] = useState(() => location.state?.influencerId || list[0]?.id || '')
  const inf = list.find(i => i.id === infId) || null
  const looks = useMemo(() => [inf?.mainImage || inf?.image, ...(inf?.looks || []).map(l => l.url)].filter(Boolean), [inf])
  const [look, setLook] = useState('')
  const [seconds, setSeconds] = useState(() => VIDEO_SECONDS.includes(location.state?.seconds) ? location.state.seconds : 10)
  const [ratio, setRatio] = useState(() => RATIOS.includes(location.state?.ratio) ? location.state.ratio : '9:16')
  const [resolution, setResolution] = useState('720p')
  const [topic, setTopic] = useState(location.state?.topic || '')
  const [script, setScript] = useState(location.state?.script || '')
  const [direction, setDirection] = useState('Speaking straight to camera, natural hand gestures, relaxed and warm.')
  const [audio, setAudio] = useState(null)      // { url, alignment, text }
  const [video, setVideo] = useState(null)      // { url, vtt, srt }
  const [busy, setBusy] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const cancel = useRef(false)
  // A look picked in the Home box (Attach) wins on first load; switching influencer resets to her main photo.
  const handedLook = useRef(location.state?.look || '')
  useEffect(() => { setLook(handedLook.current || looks[0] || ''); handedLook.current = ''; setAudio(null); setVideo(null) }, [infId]) // eslint-disable-line react-hooks/exhaustive-deps

  const vp = inf?.voiceProfile
  const budget = wordBudget(seconds)
  const words = countWords(script)
  const over = words > budget
  const spoken = audio ? spokenSeconds(audio.alignment) : 0
  const audioStale = audio && audio.text !== script.trim()
  const credits = (VIDEO_CREDITS_PER_SECOND[MODEL]?.[resolution] ?? 0) * seconds
  const missing = !inf ? 'Pick an influencer.' : !look ? `${inf.name} needs a photo or a look first.` : !getElevenKey() ? 'connect-el' : !vp?.voiceId ? 'voice' : !getHFToken() ? 'connect-hf' : ''

  async function write() {
    setBusy('write'); setError('')
    try {
      const out = await runSkill({ task: `Write a ${seconds}-second talking-to-camera script for a short video${topic.trim() ? ` about: ${topic.trim()}` : ''}. At most ${budget} words. Spoken, first person, in her voice. Open with a hook in the first line. Return only the words she says, no stage directions, no hashtags.`, context: influencerContext(inf), maxTokens: 400 })
      setScript(out.replace(/^["']|["']$/g, '').trim())
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  async function speak() {
    setBusy('voice'); setError(''); setVideo(null)
    try {
      const r = await voiceover({ voiceId: vp.voiceId, text: script.trim(), model: 'eleven_v4', settings: vp.settings, seed: vp.seed })
      setAudio({ ...r, text: script.trim() })
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  async function make() {
    setBusy('video'); setError(''); setProgress(0); cancel.current = false
    try {
      const prompt = `@image1 is ${inf.name}: keep this exact face, identity, outfit and setting. ${inf.name} talks to camera. ${direction.trim()} Lip-sync driven by @audio_1: mouth movement matches every word. Natural blinks and small head movements. No on-screen text.`
      const { urls } = await generateVideo({
        prompt, aspectRatio: ratio, duration: seconds, count: 1, model: MODEL, resolution,
        referenceImages: [uploadable(look)], audioRef: audio.url, elementId: elementFor(inf),
        onProgress: p => setProgress(Math.round(p)), isCancelled: () => cancel.current,
      })
      const url = urls?.[0]
      if (!url) throw new Error('No video came back. Check your Higgsfield dashboard.')
      const lines = captionLines(wordsFrom(audio.alignment))
      setVideo({ url, srt: toSRT(lines), vtt: URL.createObjectURL(new Blob([toVTT(lines)], { type: 'text/vtt' })) })
      addToMediaHistory({ url, influencer: inf, ratio, jobId: `talk_${Date.now()}`, recipe: { mode: 'video', prompt, model: MODEL, ratio, resolution, seconds, influencerId: inf.id, script: audio.text, credits } })
    } catch (e) { if (!/CANCELLED/.test(e?.message || '')) setError(e.message) } finally { setBusy('') }
  }

  const post = () => navigate('/content?compose=1', { state: { influencerId: inf.id, prefillMedia: video.url, prefillCaption: audio.text, igFormat: 'reel' } })
  const srtFile = () => downloadImage(`data:text/plain;base64,${btoa(unescape(encodeURIComponent(video.srt)))}`, `${(inf.name || 'talk').toLowerCase().replace(/\W+/g, '-')}-captions.srt`)

  return (
    <Page title="Talking video" wide>
      <div className="muse-talk">
        <section className="muse-talk-step" aria-labelledby="talk-who">
          <h2 id="talk-who"><span>1</span> Who and how long</h2>
          <div className="muse-chip-row" role="radiogroup" aria-label="Influencer">
            {list.map(i => <button key={i.id} type="button" role="radio" aria-checked={i.id === infId} className={`muse-chip${i.id === infId ? ' on' : ''}`} onClick={() => setInfId(i.id)}>{i.name || 'Untitled'}</button>)}
          </div>
          {looks.length > 0 && (
            <div className="muse-talk-looks" role="radiogroup" aria-label="Look">
              {(look && !looks.includes(look) ? [look, ...looks] : looks).map((u, n) => <button key={u} type="button" role="radio" aria-checked={u === look} className={`muse-thumb lg${u === look ? ' on' : ''}`} style={{ backgroundImage: `url(${u})` }} onClick={() => { setLook(u); setVideo(null) }} aria-label={u === looks[0] ? 'Main photo' : `Look ${n}`} />)}
            </div>
          )}
          <div className="muse-chip-row">
            <span className="muse-field-label">Length</span>
            {VIDEO_SECONDS.map(n => <button key={n} type="button" className={`muse-chip${seconds === n ? ' on' : ''}`} aria-pressed={seconds === n} onClick={() => setSeconds(n)}>{n}s</button>)}
            <span className="muse-field-label">Shape</span>
            {RATIOS.map(r => <button key={r} type="button" className={`muse-chip${ratio === r ? ' on' : ''}`} aria-pressed={ratio === r} onClick={() => setRatio(r)}>{r}</button>)}
          </div>
        </section>

        <section className="muse-talk-step" aria-labelledby="talk-script">
          <h2 id="talk-script"><span>2</span> What she says</h2>
          {hasClaude() && (
            <div className="muse-assist-row">
              <input className="muse-input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic: my morning routine, a product, a hot take…" aria-label="Topic" />
              <button type="button" className="muse-btn muse-btn-tonal" disabled={!inf || !!busy} onClick={write}>{busy === 'write' ? 'Writing…' : 'Write it for me'}</button>
            </div>
          )}
          {(inf?.scripts || []).filter(x => (x.script || '').trim()).length > 0 && (
            <div className="muse-chip-row" aria-label="Saved scripts">
              <span className="muse-field-label">Saved scripts</span>
              {inf.scripts.filter(x => (x.script || '').trim()).slice(0, 8).map(x => <button key={x.id} type="button" className="muse-chip" title={x.script.slice(0, 200)} onClick={() => { setScript(x.script.trim()); setAudio(null); setVideo(null) }}>{x.title || 'Script'}</button>)}
            </div>
          )}
          <textarea className="muse-input" rows={5} value={script} onChange={e => setScript(e.target.value)} placeholder={`The words ${inf?.name || 'she'} says. About ${budget} words fit in ${seconds} seconds.`} aria-label="Script" />
          <small className={over ? 'muse-error' : 'muse-muted'}>{words} of {budget} words for {seconds}s{over ? '. Too long: cut it or choose a longer video.' : ''}</small>
          <label className="muse-field-label" htmlFor="talk-dir">Direction <span className="muse-muted">· optional</span></label>
          <input id="talk-dir" className="muse-input" value={direction} onChange={e => setDirection(e.target.value)} />
        </section>

        <section className="muse-talk-step" aria-labelledby="talk-voice">
          <h2 id="talk-voice"><span>3</span> Her voice</h2>
          {missing === 'connect-el' ? <p className="muse-muted">Add your ElevenLabs key to make the voiceover. <Link to="/settings?section=connections">Connect ElevenLabs</Link></p>
            : missing === 'voice' ? <p className="muse-muted">{inf.name} has no voice yet. <Link to="/influencers" state={{ selectId: inf.id }}>Pick or design one</Link></p>
            : (
              <>
                <p className="muse-muted">{vp?.voiceName || 'Her voice'} · Eleven v4 · uses about {script.trim().length.toLocaleString()} ElevenLabs characters.</p>
                <div className="muse-assist-row">
                  <button type="button" className="muse-btn muse-btn-tonal" disabled={!script.trim() || over || !!busy || (missing && missing !== 'connect-hf')} onClick={speak}>{busy === 'voice' ? 'Making the voiceover…' : audio && !audioStale ? 'Make it again' : 'Make the voiceover'}</button>
                  {audio && <audio src={audio.url} controls aria-label="Voiceover" />}
                </div>
                {audio && <small className={spoken > seconds ? 'muse-error' : 'muse-muted'}>{spoken.toFixed(1)}s spoken{spoken > seconds ? ` — longer than the ${seconds}s video; shorten the script or pick a longer length.` : ''}{audioStale ? ' The script has changed since; make it again.' : ''}</small>}
              </>
            )}
        </section>

        <section className="muse-talk-step" aria-labelledby="talk-make">
          <h2 id="talk-make"><span>4</span> Make the video</h2>
          {missing === 'connect-hf' ? <p className="muse-muted">Sign in to Higgsfield to make the video. <Link to="/settings?section=connections">Connect Higgsfield</Link></p> : (
            <>
              <div className="muse-chip-row">
                <span className="muse-field-label">Quality</span>
                {RESOLUTIONS.map(r => <button key={r} type="button" className={`muse-chip${resolution === r ? ' on' : ''}`} aria-pressed={resolution === r} onClick={() => setResolution(r)}>{r}</button>)}
              </div>
              <div className="muse-assist-row">
                <button type="button" className="muse-btn muse-btn-filled" disabled={!!missing || !audio || audioStale || spoken > seconds || !!busy} onClick={make}>
                  {busy === 'video' ? `Making… ${progress}%` : `Make the video · about ${credits} credits`}
                </button>
                {busy === 'video' && <button type="button" className="muse-btn muse-btn-text" onClick={() => { cancel.current = true }}>Stop</button>}
              </div>
              <small className="muse-muted">Seedance 2.0 on your Higgsfield account. The credit figure is Muse’s estimate; Higgsfield bills the real amount.{elementFor(inf) ? ' Her consistent face is included.' : ''}</small>
            </>
          )}
          {error && <p className="muse-error" role="alert">{error}</p>}
          {video && (
            <div className="muse-talk-result">
              <video src={video.url} controls playsInline crossOrigin="anonymous">
                <track kind="captions" src={video.vtt} srcLang="en" label="Captions" default />
              </video>
              <div className="muse-assist-row">
                <button type="button" className="muse-btn muse-btn-filled" onClick={post}>Post it</button>
                <button type="button" className="muse-btn muse-btn-tonal" onClick={srtFile}>Download captions (.srt)</button>
                <button type="button" className="muse-btn muse-btn-text" onClick={() => downloadImage(video.url, `${(inf.name || 'talk').toLowerCase().replace(/\W+/g, '-')}.mp4`)}>Download video</button>
              </div>
              <small className="muse-muted">Saved to Media. Captions come from the voiceover timing and play here; add the .srt file where your platform accepts captions.</small>
            </div>
          )}
        </section>
      </div>
    </Page>
  )
}
