import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readScores } from '../src/utils/viralityScores.js'

test('readScores picks named scores, scales 0–1, finds summary and link', () => {
  const r = readScores({ status: 'completed', results: { virality_score: 0.82, hook_strength: 71, duration: 12, nested: { retention_score: 64.4 } }, summary: 'Strong hook.', link: 'see https://higgsfield.ai/virality/abc' })
  assert.deepEqual(r.scores, [{ key: 'virality score', value: 82 }, { key: 'hook strength', value: 71 }, { key: 'retention score', value: 64 }])
  assert.equal(r.summary, 'Strong hook.')
  assert.equal(r.url, 'https://higgsfield.ai/virality/abc')
})

test('readScores never invents scores', () => {
  assert.deepEqual(readScores('Analysis started').scores, [])
  assert.deepEqual(readScores({ duration: 3, width: 1080 }).scores, [])
})
