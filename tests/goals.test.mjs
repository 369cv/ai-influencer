import { test } from 'node:test'
import assert from 'node:assert/strict'
import { weekStart, weekProgress, goalStreak, bestTimes, isBestTime, engagementOf } from '../src/utils/goals.js'

const tz = 'UTC'
const sched = { tz, weeklyGoal: 2, days: {} }
// Wednesday 2026-11-11 12:00 UTC
const now = Date.UTC(2026, 10, 11, 12)
const at = (d, h = 10) => new Date(Date.UTC(2026, 10, d, h)).toISOString()
const post = (id, status, iso, extra = {}) => ({ id, influencerId: 'a', status, scheduledAt: iso, ...(status === 'posted' ? { postedAt: iso } : {}), ...extra })

test('weekStart is Monday 00:00 in the time zone', () => {
  assert.equal(new Date(weekStart(now, tz)).toISOString(), '2026-11-09T00:00:00.000Z')
  assert.equal(new Date(weekStart(Date.UTC(2026, 10, 15, 23), tz)).toISOString(), '2026-11-09T00:00:00.000Z') // Sunday night
  assert.equal(new Date(weekStart(now, 'America/New_York')).toISOString(), '2026-11-09T05:00:00.000Z')
})

test('weekProgress counts sent and queued posts in this week only', () => {
  const posts = [
    post('1', 'posted', at(9)),            // sent this week
    post('2', 'scheduled', at(10)),        // scheduled, time passed → sent
    post('3', 'scheduled', at(13)),        // queued later this week
    post('4', 'draft', at(14)),            // drafts don't count
    post('5', 'posted', at(2)),            // last week
    post('6', 'planned', at(17)),          // next week
    { ...post('7', 'posted', at(10)), influencerId: 'b' },
  ]
  const w = weekProgress(sched, posts, 'a', now)
  assert.deepEqual([w.sent, w.queued, w.total, w.goal, w.met, w.short], [2, 1, 3, 2, true, 0])
  assert.equal(w.daysLeft, 5)
})

test('goalStreak counts weeks in a row that met the goal', () => {
  const posts = [
    post('1', 'posted', at(2)), post('2', 'posted', at(3)),        // week of Nov 2: 2 ✓
  ]
  // Week of Oct 26: two posts; week of Oct 19: one (breaks).
  posts.push({ ...post('4', 'posted', new Date(Date.UTC(2026, 9, 27, 9)).toISOString()) }, { ...post('5', 'posted', new Date(Date.UTC(2026, 9, 28, 9)).toISOString()) })
  posts.push({ ...post('6', 'posted', new Date(Date.UTC(2026, 9, 20, 9)).toISOString()) })
  assert.equal(goalStreak(sched, posts, 'a', now), 2)
  // Meeting this week's goal adds the current week.
  posts.push(post('7', 'posted', at(9)), post('8', 'posted', at(10)))
  assert.equal(goalStreak(sched, posts, 'a', now), 3)
  assert.equal(goalStreak(sched, [], 'a', now), 0)
})

test('bestTimes needs enough measured posts and never guesses', () => {
  const few = [post('1', 'posted', at(2), { stats: { totals: { likes: 10 } } })]
  assert.deepEqual(bestTimes(sched, few, 'a', { min: 3 }), { ready: false, have: 1, need: 3 })
})

test('bestTimes picks day-hours that beat her average', () => {
  const s = likes => ({ stats: { totals: { likes, comments: 0 } } })
  const posts = [
    post('1', 'posted', at(2, 18), s(100)),  // Mon 18
    post('2', 'posted', at(9, 18), s(120)),  // Mon 18
    post('3', 'posted', at(3, 9), s(10)),    // Tue 9
    post('4', 'posted', at(4, 9), s(12)),    // Wed 9
    post('5', 'posted', at(5, 12), s(15)),   // Thu 12
    post('6', 'posted', at(6, 12), s(20)),   // Fri 12
  ]
  const b = bestTimes(sched, posts, 'a', { min: 6 })
  assert.equal(b.ready, true)
  assert.equal(b.slots.length, 1)
  assert.deepEqual([b.slots[0].day, b.slots[0].hour, b.slots[0].n], [1, 18, 2])
  assert.equal(isBestTime(b, at(16, 18)), true)   // next Monday 18:xx
  assert.equal(isBestTime(b, at(16, 9)), false)
})

test('engagementOf sums interactions only', () => {
  assert.equal(engagementOf({ views: 1000, likes: 5, comments: 2, shares: 1, saves: 3 }), 11)
  assert.equal(engagementOf(undefined), 0)
})
