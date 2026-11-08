import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'
import { useInfluencers, generateId } from '../store'
import { Page } from '../components/ui'
import { getHFToken } from '../utils/higgsfieldAuth'
import { hfToolNames, prepareInfluencer, generateInfluencer } from '../utils/higgsfieldGenerate'

// New influencer → Design from traits (Higgsfield AI Influencer). Describe her, get
// Higgsfield's design and price (free), approve, and the character sheet becomes a new
// influencer. Nothing is generated before you approve the price.
const GENDERS = [['female', 'Woman'], ['male', 'Man'], ['non_binary', 'Non-binary']]

export default function DesignInfluencer() {
  const navigate = useNavigate()
  const [, setInfluencers] = useInfluencers()
  const [name, setName] = useState('')
  const [gender, setGender] = useState('female')
  const [brief, setBrief] = useState('')
  const [quote, setQuote] = useState(null)
  const [busy, setBusy] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [sheets, setSheets] = useState(null)
  const cancel = useRef(false)
  const signedIn = !!getHFToken()
  const b = brief.trim()

  async function prepare() {
    setBusy('quote'); setError(''); setQuote(null); setSheets(null)
    try {
      const tools = await hfToolNames()
      if (!tools.has('ai_influencer_prepare') || !tools.has('ai_influencer_generate')) throw new Error('Your Higgsfield account doesn’t offer AI Influencer right now.')
      setQuote(await prepareInfluencer({ brief: `${GENDERS.find(g => g[0] === gender)[1]}. ${b}`, gender }))
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  async function make(useFree) {
    setBusy('make'); setError(''); setProgress(0); cancel.current = false
    try { setSheets(await generateInfluencer({ params: quote.params, maxCredits: quote.price ?? 0, useFree, onProgress: p => setProgress(Math.round(p)), isCancelled: () => cancel.current })) }
    catch (e) { if (!/CANCELLED/.test(e.message || '')) setError(e.message) } finally { setBusy('') }
  }
  function keep(url) {
    const now = Date.now()
    const inf = {
      id: generateId(), name: name.trim() || 'New influencer', gender: gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Non-binary', age: '',
      type: 'Influencer', createdAt: now, niche: '', niches: [], backstory: '', physicalDesc: b, vibeWords: [],
      mainImage: url, characterSheetImage: url, closeUpImage1: null, closeUpImage2: null, prompt: b,
      palette: [], contentPillars: [], videoUrls: [], scripts: [], homeImages: [], wardrobeSlots: [], brandDealImages: [], looks: [],
      generationHistory: [{ id: generateId(), type: 'image', label: 'Character sheet (Higgsfield AI Influencer)', url, date: now }],
      designedWith: 'higgsfield_ai_influencer',
    }
    flushSync(() => setInfluencers(prev => [...prev, inf]))
    navigate('/influencers', { state: { selectId: inf.id } })
  }

  return (
    <Page title="Design from traits">
      <div className="muse-talk">
        {!signedIn ? (
          <section className="muse-talk-step"><p>Sign in to Higgsfield to design a new influencer. <Link to="/settings?section=connections">Connect Higgsfield</Link></p></section>
        ) : (
          <>
            <section className="muse-talk-step" aria-labelledby="dt-who">
              <h2 id="dt-who"><span>1</span> Describe her</h2>
              <input className="muse-input" value={name} onChange={e => setName(e.target.value)} placeholder="Name" aria-label="Name" />
              <div className="muse-chip-row" role="radiogroup" aria-label="Gender">{GENDERS.map(([id, l]) => <button key={id} type="button" role="radio" aria-checked={gender === id} className={`muse-chip${gender === id ? ' on' : ''}`} onClick={() => { setGender(id); setQuote(null) }}>{l}</button>)}</div>
              <textarea className="muse-input" rows={4} value={brief} onChange={e => { setBrief(e.target.value); setQuote(null) }} placeholder="Age, look, hair, style and vibe. For example: mid-twenties, freckles, copper curls, oversized vintage knits, warm and a little nerdy." aria-label="Traits" />
              <div className="muse-assist-row">
                <button type="button" className="muse-btn muse-btn-tonal" disabled={b.length < 10 || !!busy} onClick={prepare}>{busy === 'quote' ? 'Asking Higgsfield…' : quote ? 'Get a new design' : 'Get the design and price'}</button>
                <small className="muse-muted">Free: nothing is made yet.</small>
              </div>
            </section>
            {quote && (
              <section className="muse-talk-step" aria-labelledby="dt-make">
                <h2 id="dt-make"><span>2</span> Make her character sheet</h2>
                {quote.summary && <p className="muse-muted">{quote.summary}</p>}
                <p>{quote.price != null ? `Higgsfield’s price: ${quote.price} credits.` : 'Higgsfield didn’t return a price, so Muse won’t spend credits on this one.'}{quote.free > 0 ? ` You have ${quote.free} free generation${quote.free > 1 ? 's' : ''}.` : ''}</p>
                <div className="muse-assist-row">
                  {quote.free > 0 && <button type="button" className="muse-btn muse-btn-tonal" disabled={!!busy} onClick={() => make(true)}>Use a free generation</button>}
                  <button type="button" className="muse-btn muse-btn-filled" disabled={!!busy || quote.price == null} onClick={() => make(false)}>{busy === 'make' ? `Making… ${progress}%` : `Make it · ${quote.price ?? '?'} credits`}</button>
                  {busy === 'make' && <button type="button" className="muse-btn muse-btn-text" onClick={() => { cancel.current = true }}>Stop waiting</button>}
                </div>
                <small className="muse-muted">Capped at this price: if Higgsfield’s price goes up before it starts, nothing is charged.</small>
              </section>
            )}
            {error && <p className="muse-error" role="alert">{error}</p>}
            {sheets && (
              <section className="muse-talk-step" aria-labelledby="dt-keep">
                <h2 id="dt-keep"><span>3</span> Keep her</h2>
                <div className="muse-dt-sheets">
                  {sheets.map(u => <figure key={u}><img src={u} alt="Character sheet" /><button type="button" className="muse-btn muse-btn-filled" onClick={() => keep(u)}>Make her an influencer</button></figure>)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Page>
  )
}
