// Posting goal, streak and best times (Buffer-style), from real posts only.
// Pure functions (no React, no storage) so they can be unit-tested with node --test.
//
// "Sent" = posted, or scheduled with a time that has passed (the posting service sent it).
// Weeks run Monday to Sunday in the influencer's schedule time zone.
import { DAY_NAMES, zonedTime, localTimeZone } from './schedule.js'

const WEEK = 7 * 864e5
const QUEUED = new Set(['planned', 'approved', 'scheduled'])

function wallClock(ms, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', weekday: 'short' })
  const o = {}
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, wd: DAY_NAMES.indexOf(o.weekday) }
}

// Monday 00:00 of the week containing `now`, in `tz`.
export function weekStart(now = Date.now(), tz = localTimeZone()) {
  const p = wallClock(now, tz)
  return zonedTime(p.y, p.m, p.d - ((p.wd + 6) % 7), '00:00', tz).getTime()
}

const timeOf = p => new Date(p.postedAt || p.scheduledAt || 0).getTime()
export const isSent = (p, now = Date.now()) => p.status === 'posted' || (p.status === 'scheduled' && !!p.scheduledAt && new Date(p.scheduledAt).getTime() <= now)
const isQueued = (p, now) => QUEUED.has(p.status) && !!p.scheduledAt && new Date(p.scheduledAt).getTime() > now

// This week's count against the goal: sent this week plus queued for the rest of it.
export function weekProgress(schedule, posts, influencerId, now = Date.now()) {
  const tz = schedule?.tz || localTimeZone()
  const goal = Math.max(1, schedule?.weeklyGoal || 1)
  const start = weekStart(now, tz), end = start + WEEK
  const mine = (posts || []).filter(p => p.influencerId === influencerId)
  const inWeek = p => { const t = timeOf(p); return t >= start && t < end }
  const sent = mine.filter(p => isSent(p, now) && inWeek(p)).length
  const queued = mine.filter(p => isQueued(p, now) && inWeek(p)).length
  const daysLeft = Math.max(0, Math.ceil((end - now) / 864e5))
  return { goal, sent, queued, total: sent + queued, met: sent + queued >= goal, short: Math.max(0, goal - sent - queued), daysLeft, weekEnd: end }
}

// Weeks in a row the goal was met by sent posts. The current week counts once it is met;
// otherwise the streak is still alive from last week.
export function goalStreak(schedule, posts, influencerId, now = Date.now()) {
  const tz = schedule?.tz || localTimeZone()
  const goal = Math.max(1, schedule?.weeklyGoal || 1)
  const sentTimes = (posts || []).filter(p => p.influencerId === influencerId && isSent(p, now)).map(timeOf)
  const countIn = start => sentTimes.filter(t => t >= start && t < start + WEEK).length
  let start = weekStart(now, tz)
  let n = countIn(start) >= goal ? 1 : 0
  for (let i = 0; i < 520; i++) {
    start = weekStart(start - 864e5, tz)
    if (countIn(start) >= goal) n++
    else break
  }
  return n
}

// Engagement for one post from its read-back stats (likes + comments + shares + saves).
export const engagementOf = totals => ['likes', 'comments', 'shares', 'saves'].reduce((n, k) => n + (typeof totals?.[k] === 'number' ? totals[k] : 0), 0)

// Best times from her own sent posts with stats. Groups by weekday and hour in her time
// zone and keeps hours that beat her average. Needs `min` measured posts; until then it
// says how many more it needs, and nothing is guessed.
export function bestTimes(schedule, posts, influencerId, { min = 6, top = 3 } = {}) {
  const tz = schedule?.tz || localTimeZone()
  const measured = (posts || []).filter(p => p.influencerId === influencerId && isSent(p) && p.stats?.totals && Object.keys(p.stats.totals).length)
  if (measured.length < min) return { ready: false, have: measured.length, need: min }
  const scores = measured.map(p => engagementOf(p.stats.totals))
  const avg = scores.reduce((a, b) => a + b, 0) / measured.length
  const buckets = new Map()
  measured.forEach((p, i) => {
    const w = wallClock(timeOf(p), tz)
    const k = `${w.wd}-${w.h}`
    const b = buckets.get(k) || { day: w.wd, hour: w.h, sum: 0, n: 0 }
    b.sum += scores[i]; b.n++
    buckets.set(k, b)
  })
  const slots = [...buckets.values()].map(b => ({ ...b, avg: b.sum / b.n, lift: avg > 0 ? b.sum / b.n / avg : 0 }))
    .filter(b => avg > 0 && b.lift >= 1.2)
    .sort((a, b) => b.avg - a.avg || b.n - a.n)
    .slice(0, top)
  return { ready: true, have: measured.length, avg, slots, tz }
}

// True when `at` falls on one of the best day-hours.
export function isBestTime(best, at) {
  if (!best?.ready || !best.slots.length) return false
  const w = wallClock(new Date(at).getTime(), best.tz)
  return best.slots.some(s => s.day === w.wd && s.hour === w.h)
}

export const fmtBest = s => `${DAY_NAMES[s.day]} ${((s.hour + 11) % 12) + 1} ${s.hour < 12 ? 'AM' : 'PM'}`
export const bestAsSlot = s => `${String(s.hour).padStart(2, '0')}:00`
