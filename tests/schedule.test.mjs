import { test } from 'node:test'
import assert from 'node:assert/strict'
import { zonedTime, upcomingSlots, nextFreeSlot, freeSlots, isSlotTime, slotsPerWeek, starterSchedule } from '../src/utils/schedule.js'

const iso = d => d.toISOString()

test('zonedTime: plain offsets', () => {
  assert.equal(iso(zonedTime(2026, 11, 8, '10:00', 'America/New_York')), '2026-11-08T15:00:00.000Z') // EST
  assert.equal(iso(zonedTime(2026, 7, 8, '10:00', 'America/New_York')), '2026-07-08T14:00:00.000Z')  // EDT
  assert.equal(iso(zonedTime(2026, 11, 8, '10:00', 'Europe/London')), '2026-11-08T10:00:00.000Z')
  assert.equal(iso(zonedTime(2026, 11, 8, '10:00', 'Asia/Kolkata')), '2026-11-08T04:30:00.000Z')
})

test('zonedTime: DST edges never land on the wrong day', () => {
  // 2026-03-08 02:30 does not exist in New York (spring forward): must be within an hour of 07:30Z
  const gap = zonedTime(2026, 3, 8, '02:30', 'America/New_York')
  assert.ok(Math.abs(gap - Date.parse('2026-03-08T07:30:00Z')) <= 3600e3, iso(gap))
  // 2026-11-01 01:30 happens twice (fall back): either instant is a valid 01:30
  const rep = zonedTime(2026, 11, 1, '01:30', 'America/New_York')
  assert.ok(['2026-11-01T05:30:00.000Z', '2026-11-01T06:30:00.000Z'].includes(iso(rep)), iso(rep))
  // Day after the change uses the new offset
  assert.equal(iso(zonedTime(2026, 11, 2, '09:00', 'America/New_York')), '2026-11-02T14:00:00.000Z')
})

const sched = { tz: 'America/New_York', weeklyGoal: 5, days: { 0: ['10:00', '18:00'], 1: ['07:15'], 2: [], 3: [], 4: [], 5: [], 6: ['18:00', 'bad'] } }
const from = new Date('2026-11-07T20:00:00Z') // Sat 3:00 PM New York

test('upcomingSlots: future only, sorted, invalid times ignored, days off skipped', () => {
  const s = upcomingSlots(sched, { from, days: 3 }).map(x => iso(x.at))
  assert.deepEqual(s, ['2026-11-07T23:00:00.000Z', '2026-11-08T15:00:00.000Z', '2026-11-08T23:00:00.000Z', '2026-11-09T12:15:00.000Z'])
})

test('nextFreeSlot skips slots held by this influencer only', () => {
  const posts = [
    { id: 'a', influencerId: 'k', status: 'scheduled', scheduledAt: '2026-11-07T23:00:00.000Z' },
    { id: 'b', influencerId: 'm', status: 'scheduled', scheduledAt: '2026-11-08T15:00:00.000Z' }, // other influencer
    { id: 'c', influencerId: 'k', status: 'draft', scheduledAt: '2026-11-08T15:00:00.000Z' },     // drafts don't hold slots
  ]
  assert.equal(iso(nextFreeSlot(sched, posts, 'k', { from }).at), '2026-11-08T15:00:00.000Z')
  // the post being edited doesn't block its own slot
  assert.equal(iso(nextFreeSlot(sched, posts, 'k', { from, exceptId: 'a' }).at), '2026-11-07T23:00:00.000Z')
  assert.equal(freeSlots(sched, posts, 'k', { from, days: 3 }).length, 3)
})

test('helpers', () => {
  assert.equal(slotsPerWeek(sched), 4)
  assert.ok(isSlotTime(sched, '2026-11-08T15:00:00.000Z'))
  assert.ok(!isSlotTime(sched, '2026-11-08T15:30:00.000Z'))
  assert.equal(nextFreeSlot({ tz: 'UTC', days: {} }, [], 'k', { from }), null)
  assert.equal(slotsPerWeek(starterSchedule('UTC')), 14)
})
