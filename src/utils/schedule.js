// Posting schedules: time slots per influencer, in the influencer's own time zone.
// Pure functions (no React, no storage) so they can be unit-tested with node --test.
//
// influencer.postingSchedule = {
//   tz: 'America/New_York',
//   weeklyGoal: 10,
//   days: { 0: ['10:00', '18:00'], 1: ['07:15', '18:30'], … }   // 0 = Sunday; [] = day off
// }

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Common-practice defaults, labelled "starter times" in the UI (not "best times").
export const STARTER_DAYS = {
  0: ['10:00', '18:00'], 1: ['07:15', '18:30'], 2: ['07:15', '18:30'], 3: ['12:00', '18:30'],
  4: ['12:30', '18:30'], 5: ['07:15', '20:00'], 6: ['11:00', '18:00'],
}

export const localTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

export function starterSchedule(tz = localTimeZone()) {
  return { tz, weeklyGoal: 7, days: structuredClone(STARTER_DAYS) }
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/
export const isValidTime = t => HHMM.test(t || '')

// Wall-clock parts of an instant in a time zone.
function partsIn(ms, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' })
  const o = {}
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: DAY_NAMES.indexOf(o.weekday) }
}
const offsetAt = (ms, tz) => { const p = partsIn(ms, tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000 }

// The instant when the wall clock in `tz` reads y-m-d hh:mm. Handles DST: a time
// skipped by spring-forward moves to the next valid minute; a repeated time takes the first.
export function zonedTime(y, m, d, hhmm, tz) {
  const [h, mi] = hhmm.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, h, mi)
  let ms = guess - offsetAt(guess, tz)
  const second = guess - offsetAt(ms, tz)
  if (second !== ms) ms = Math.min(ms, second)
  return new Date(ms)
}

// Slots between `from` and `from + days`, as [{ at: Date, day, time }], oldest first.
export function upcomingSlots(schedule, { from = new Date(), days = 7 } = {}) {
  if (!schedule?.days) return []
  const tz = schedule.tz || localTimeZone()
  const start = partsIn(from.getTime(), tz)
  const out = []
  for (let i = 0; i <= days; i++) {
    const base = new Date(Date.UTC(start.y, start.m - 1, start.d + i, 12))
    const y = base.getUTCFullYear(), m = base.getUTCMonth() + 1, d = base.getUTCDate(), wd = base.getUTCDay()
    for (const t of [...(schedule.days[wd] || [])].filter(isValidTime).sort()) {
      const at = zonedTime(y, m, d, t, tz)
      if (at > from && at - from <= days * 864e5) out.push({ at, day: wd, time: t })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}

// Posts that hold a slot: anything with a time that is not a draft or a failure.
const HOLDS_SLOT = new Set(['planned', 'approved', 'scheduled', 'posted'])
const sameMinute = (a, b) => Math.abs(new Date(a) - new Date(b)) < 60_000

export function freeSlots(schedule, posts, influencerId, opts = {}) {
  const taken = (posts || []).filter(p => p.influencerId === influencerId && p.scheduledAt && HOLDS_SLOT.has(p.status) && p.id !== opts.exceptId)
  return upcomingSlots(schedule, opts).filter(s => !taken.some(p => sameMinute(p.scheduledAt, s.at)))
}

export function nextFreeSlot(schedule, posts, influencerId, opts = {}) {
  return freeSlots(schedule, posts, influencerId, { days: 28, ...opts })[0] || null
}

export const isSlotTime = (schedule, iso) => !!iso && upcomingSlots(schedule, { from: new Date(new Date(iso) - 60_000), days: 1 }).some(s => sameMinute(s.at, iso))

export const slotsPerWeek = schedule => Object.values(schedule?.days || {}).reduce((n, l) => n + l.filter(isValidTime).length, 0)

// "Sun 10:00 AM" in the viewer's time zone (or a given one).
export const fmtSlot = (at, tz) => new Date(at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) })
export const fmtTime = (at, tz) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) })
