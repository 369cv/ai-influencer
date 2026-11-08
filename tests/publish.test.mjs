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

test('ayrshare: stats map each network onto views/reach/likes/comments/shares/saves', async () => {
  const calls = mockFetch(() => ({ status: 200, body: {
    status: 'partial',
    instagram: { id: '1', postUrl: 'https://www.instagram.com/p/x/', analytics: { likeCount: 12, commentsCount: 2, reachCount: 300, savedCount: 9, viewsCount: 500, sharesCount: 1 } },
    twitter: { id: '2', analytics: { likeCount: 4, replyCount: 1, retweetCount: 3, impressionCount: 90 } },
    errors: [{ platform: 'tiktok', message: 'Analytics not ready' }],
  } }))
  const r = await handlePublish({ ...ayr, stats: { ids: ['ayr1'] } })
  assert.equal(calls[0].method, 'POST')
  assert.match(calls[0].url, /\/api\/analytics\/post$/)
  assert.deepEqual(calls[0].body, { id: 'ayr1' })
  const p = r.json.posts.ayr1
  assert.deepEqual(p.platforms.instagram, { views: 500, reach: 300, likes: 12, comments: 2, shares: 1, saves: 9, url: 'https://www.instagram.com/p/x/' })
  assert.deepEqual(p.platforms.twitter, { views: 90, likes: 4, comments: 1, shares: 3 })
  assert.equal(p.error, 'tiktok: Analytics not ready')
})

test('stats are refused for webhook routes', async () => {
  mockFetch()
  const r = await handlePublish({ provider: 'webhook', credentials: { webhookUrl: 'https://example.com/h' }, stats: { ids: ['ayr1'] } })
  assert.equal(r.json.ok, false)
})

test('ayrshare comments: read one post and flatten by platform', async () => {
  const calls = mockFetch(() => ({ status: 200, body: { instagram: [{ comment: 'Love this', commentId: 'c1', created: '2026-11-07T10:00:00Z', username: 'ana', likeCount: 3 }], tiktok: [{ comment: 'Where is it from?', commentId: 'c2', created: '2026-11-08T10:00:00Z', displayName: 'Bo', owner: false }], status: 'success' } }))
  const out = await handlePublish({ ...ayr, comments: { id: 'ayr123' } })
  assert.equal(calls[0].url, 'https://api.ayrshare.com/api/comments/ayr123')
  assert.deepEqual(out.json.comments.map(c => [c.id, c.platform, c.author]), [['c2', 'tiktok', 'Bo'], ['c1', 'instagram', 'ana']])
})

test('ayrshare reply: posts to the reply endpoint with the platform comment id', async () => {
  const calls = mockFetch(() => ({ status: 200, body: { status: 'success', instagram: { status: 'success', commentId: 'r9' } } }))
  const out = await handlePublish({ ...ayr, reply: { commentId: '17890000', platform: 'instagram', comment: 'Thank you!' } })
  assert.equal(calls[0].url, 'https://api.ayrshare.com/api/comments/reply/17890000')
  assert.deepEqual(calls[0].body, { comment: 'Thank you!', platforms: ['instagram'], searchPlatformId: true })
  assert.equal(out.json.commentId, 'r9')
  assert.equal((await handlePublish({ ...ayr, reply: { commentId: 'x', platform: 'instagram', comment: '' } })).status, 400)
  assert.equal((await handlePublish({ provider: 'webhook', credentials: {}, reply: { commentId: '17890000', platform: 'instagram', comment: 'Hi' } })).status, 400)
})
