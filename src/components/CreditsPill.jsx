import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getElevenKey, getUsage } from '../utils/elevenlabs'
import { fmtNum } from '../utils/publishing'

// Sidebar balance: ElevenLabs characters left this period, read from your account.
// Hidden without a key or when the read fails; never an estimate. (Higgsfield's
// sign-in has no balance read, so its cost shows on each button instead.)
const CACHE = 'muse_el_usage'
const TTL = 10 * 60e3

export default function CreditsPill() {
  const key = getElevenKey()
  const [u, setU] = useState(() => { try { const c = JSON.parse(sessionStorage.getItem(CACHE) || 'null'); return c && Date.now() - c.at < TTL ? c : null } catch { return null } })
  useEffect(() => {
    if (!key || u) return
    let live = true
    getUsage().then(d => {
      if (!live || d.used == null || d.limit == null) return
      const v = { ...d, at: Date.now() }
      try { sessionStorage.setItem(CACHE, JSON.stringify(v)) } catch {}
      setU(v)
    }).catch(() => {})
    return () => { live = false }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!key || !u) return null
  const left = Math.max(0, u.limit - u.used)
  const low = u.limit > 0 && left / u.limit < 0.1
  return (
    <Link to="/settings?section=connections" className={`muse-credits${low ? ' low' : ''}`} title={`ElevenLabs ${u.tier || ''}: ${u.used.toLocaleString()} of ${u.limit.toLocaleString()} characters used${u.resetsAt ? `, resets ${new Date(u.resetsAt).toLocaleDateString()}` : ''}`}>
      <span className="muse-credits-dot" aria-hidden />
      <span className="muse-rail-label">ElevenLabs · {fmtNum(left)} chars left</span>
    </Link>
  )
}
