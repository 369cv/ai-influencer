import { useMemo, useState } from 'react'
import { DAY_NAMES, STARTER_DAYS, isValidTime, localTimeZone, slotsPerWeek, starterSchedule } from '../utils/schedule'

// Posting schedule for one influencer: time zone, weekly goal and time slots per
// weekday. "Add to queue" in Content fills the next free slot. Saved on the
// influencer as postingSchedule (see utils/schedule.js).

const ZONES = (() => { try { return Intl.supportedValuesOf('timeZone') } catch { return [] } })()
const card = { background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }
const label = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }
const fmt = t => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }

export default function PostingSchedule({ influencer, onUpdate, bare = false }) {
  const s = influencer.postingSchedule
  const [adding, setAdding] = useState(null) // weekday being added to
  const [draftTime, setDraftTime] = useState('18:00')
  const zones = useMemo(() => (s?.tz && !ZONES.includes(s.tz) ? [s.tz, ...ZONES] : ZONES), [s?.tz])
  const save = patch => onUpdate({ postingSchedule: { ...(s || starterSchedule()), ...patch } })
  const setDay = (d, list) => save({ days: { ...s.days, [d]: [...new Set(list.filter(isValidTime))].sort() } })
  const name = influencer.name || 'this influencer'
  const Wrap = bare ? 'div' : 'section'
  const wrapProps = bare ? { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' } } : { style: card, 'aria-labelledby': `ps-${influencer.id}` }

  if (!s) {
    return (
      <Wrap {...wrapProps}>
        {!bare && <span id={`ps-${influencer.id}`} style={label}>Posting schedule</span>}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Set the times {name} posts. “Add to queue” then picks the next free one, so you never type a date.
        </p>
        <div><button type="button" className="muse-btn muse-btn-filled" onClick={() => onUpdate({ postingSchedule: starterSchedule() })}>Start with starter times</button></div>
        <p className="muse-field-hint">Starter times are common-practice defaults, not data from your accounts. Change them any time.</p>
      </Wrap>
    )
  }

  return (
    <Wrap {...wrapProps}>
      {!bare && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span id={`ps-${influencer.id}`} style={label}>Posting schedule</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{slotsPerWeek(s)} slots a week</span>
        </div>
      )}
      <div className="muse-ps-row">
        <div><strong>Time zone</strong><small>Slots use {name}’s audience time.</small></div>
        <select className="muse-input" value={s.tz || localTimeZone()} onChange={e => save({ tz: e.target.value })} aria-label="Time zone" style={{ maxWidth: 240 }}>
          {zones.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="muse-ps-row">
        <div><strong>Weekly goal</strong><small>Content shows how many are queued against it.</small></div>
        <span className="muse-pchip stepper" role="group" aria-label="Weekly goal">
          <button type="button" onClick={() => save({ weeklyGoal: Math.max(1, (s.weeklyGoal || 1) - 1) })} aria-label="Fewer" disabled={(s.weeklyGoal || 1) <= 1}>−</button>
          <span>{s.weeklyGoal || 1} posts</span>
          <button type="button" onClick={() => save({ weeklyGoal: Math.min(70, (s.weeklyGoal || 1) + 1) })} aria-label="More">+</button>
        </span>
      </div>
      <div className="muse-ps-row">
        <div><strong>Time slots</strong><small>“Add to queue” fills the next free one.</small></div>
        <button type="button" className="muse-btn muse-btn-tonal" onClick={() => { if (confirm(`Replace ${name}’s slots with starter times?`)) save({ days: structuredClone(STARTER_DAYS) }) }}>Use starter times</button>
      </div>
      <div className="muse-ps-grid" role="group" aria-label="Time slots by day">
        {DAY_NAMES.map((d, i) => {
          const list = s.days?.[i] || []
          return (
            <div key={d} className={`muse-ps-day${list.length ? '' : ' off'}`}>
              <b>{d}</b>
              {list.length === 0 && <span className="muse-ps-off">Off</span>}
              {list.map(t => (
                <span key={t} className="muse-ps-slot">
                  {fmt(t)}
                  <button type="button" aria-label={`Remove ${d} ${fmt(t)}`} onClick={() => setDay(i, list.filter(x => x !== t))}>×</button>
                </span>
              ))}
              {adding === i ? (
                <form className="muse-ps-add-form" onSubmit={e => { e.preventDefault(); setDay(i, [...list, draftTime]); setAdding(null) }}>
                  <input type="time" className="muse-input" value={draftTime} onChange={e => setDraftTime(e.target.value)} aria-label={`New ${d} time`} autoFocus required />
                  <button type="submit" className="muse-btn muse-btn-filled">Add</button>
                </form>
              ) : (
                <button type="button" className="muse-ps-add" onClick={() => setAdding(i)} aria-label={`Add a ${d} slot`}>＋</button>
              )}
            </div>
          )
        })}
      </div>
    </Wrap>
  )
}
