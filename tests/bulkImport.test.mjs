import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCSV, rowsToPosts, templateCSV } from '../src/utils/bulkImport.js'

test('parseCSV handles quotes, escaped quotes, commas and newlines', () => {
  const rows = parseCSV('a,b,c\r\n"x, y","he said ""hi""","line1\nline2"\n\n')
  assert.deepEqual(rows, [['a', 'b', 'c'], ['x, y', 'he said "hi"', 'line1\nline2']])
})

const influencers = [{ id: 'i1', name: 'Kayla' }]
const accounts = [{ id: 'a1', influencerId: 'i1', platform: 'instagram', handle: '@kayla' }, { id: 'a2', influencerId: 'i1', platform: 'tiktok', handle: 'kayla.tt' }, { id: 'a3', influencerId: 'i2', platform: 'instagram', handle: '@other' }]
const now = new Date(2026, 10, 8, 12).getTime()

test('rowsToPosts builds posts and reports errors per row', () => {
  const csv = [
    'Date,Time,Influencer,Accounts,Caption,Media,First comment,Instagram as',
    '2026-11-10,18:30,kayla,@kayla,Hello,https://x.com/a.jpg|https://x.com/b.jpg,#tags,reel',
    '2026-11-10,,Kayla,,Just text,,,',
    '2026-11-01,10:00,Kayla,,Past,,,',
    '2026-11-10,10:00,Nobody,,Hi,,,',
    '2026-11-10,25:00,Kayla,@other,Hi,http://insecure.jpg,,square',
    ',,,,,,,',
  ].join('\n')
  const out = rowsToPosts(parseCSV(csv), { influencers, accounts, now })
  assert.equal(out.length, 5) // the empty row is dropped by the parser
  const [a, b, c, d, e] = out
  assert.equal(a.ok, true)
  assert.deepEqual(a.post.accountIds, ['a1'])
  assert.deepEqual(a.post.mediaUrls, ['https://x.com/a.jpg', 'https://x.com/b.jpg'])
  assert.equal(a.post.igFormat, 'reel')
  assert.equal(a.post.firstComment, '#tags')
  assert.equal(new Date(a.post.scheduledAt).getHours(), 18)
  assert.equal(b.ok, true)
  assert.deepEqual(b.post.accountIds, ['a1', 'a2']) // all of hers
  assert.ok(b.warnings.includes('No time: 9:00 AM.'))
  assert.deepEqual(c.errors, ['That time has already passed.'])
  assert.deepEqual(d.errors, ['No influencer named “Nobody”.'])
  assert.equal(e.ok, false)
  assert.ok(e.errors.some(x => /https/.test(x)) && e.errors.some(x => /HH:MM/.test(x)) && e.errors.some(x => /@other/.test(x)) && e.errors.some(x => /instagram_as/.test(x)))
  assert.equal(e.line, 6)
})

test('rowsToPosts needs a usable header; template has it', () => {
  assert.equal(rowsToPosts([['foo'], ['bar']])[0].ok, false)
  assert.match(templateCSV(), /^date,time,influencer,accounts,caption,media,first_comment,instagram_as\n$/)
})
