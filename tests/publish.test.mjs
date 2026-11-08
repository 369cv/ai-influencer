import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePublish } from '../api/publish.js'

// Records the requests the publish proxy makes and answers each with `reply`.
function mockFetch(reply = () => ({ status: 200, body: { status: 'success', id: 'ayr123' } })) {
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : undefined })
    const r = reply(url, init)
    return new Response(JSON.stringify(r.body), { status: r.status })
  }
  return calls
}
const ayr = { provider: 'ayrshare', credentials: { apiKey: 'k' } }

test('ayrshare: Reel, Story and first comment map to the documented fields', async () => {
  const calls = mockFetch()
  await handlePublish({ ...ayr, post: { caption: 'Hi', platforms: ['instagram'], mediaUrls: ['https://x.test/a.mp4'], instagramFormat: 'reel', firstComment: '#tags' } })
  assert.deepEqual(calls[0].body.instagramOptions, { reels: true, shareReelsFeed: true })
  assert.deepEqual(calls[0].body.firstComment, { comment: '#tags' })
  await handlePublish({ ...ayr, post: { caption: 'Hi', platforms: ['instagram'], mediaUrls: ['https://x.test/a.jpg'], instagramFormat: 'story' } })
  assert.deepEqual(calls[1].body.instagramOptions, { stories: true })
  assert.equal(calls[1].body.firstComment, undefined)
  await handlePublish({ ...ayr, post: { caption: 'Hi', platforms: ['twitter'], instagramFormat: 'reel' } })
  assert.equal(calls[2].body.instagramOptions, undefined)
})

test('ayrshare: cancel deletes by id (one id, or bulk), rejects junk ids', async () => {
  const calls = mockFetch(() => ({ status: 200, body: { status: 'success' } }))
  const one = await handlePublish({ ...ayr, cancel: { ids: ['abc123'] } })
  assert.equal(one.json.ok, true)
  assert.equal(calls[0].method, 'DELETE')
  assert.match(calls[0].url, /\/api\/post$/)
  assert.deepEqual(calls[0].body, { id: 'abc123' })
  await handlePublish({ ...ayr, cancel: { ids: ['abc123', 'def456'] } })
  assert.deepEqual(calls[1].body, { bulk: ['abc123', 'def456'] })
  const bad = await handlePublish({ ...ayr, cancel: { ids: ['../x'] } })
  assert.equal(bad.json.ok, false)
  assert.equal(calls.length, 2)
})

test('ayrshare: a failed cancel reports the provider message', async () => {
  mockFetch(() => ({ status: 400, body: { status: 'error', message: 'Post not found' } }))
  const r = await handlePublish({ ...ayr, cancel: { ids: ['abc123'] } })
  assert.equal(r.json.ok, false)
  assert.equal(r.json.error, 'Post not found')
})
