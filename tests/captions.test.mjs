import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wordsFrom, captionLines, toSRT, toVTT, spokenSeconds, wordBudget, countWords } from '../src/utils/captions.js'

const align = text => {
  const characters = [...text], starts = [], ends = []
  characters.forEach((_, i) => { starts.push(i * 0.1); ends.push(i * 0.1 + 0.1) })
  return { characters, starts, ends }
}

test('wordsFrom splits on whitespace and keeps timing', () => {
  const w = wordsFrom(align('Hi there you'))
  assert.deepEqual(w.map(x => x.text), ['Hi', 'there', 'you'])
  assert.equal(Math.round(w[1].start * 10) / 10, 0.3)
  assert.equal(Math.round(w[1].end * 10) / 10, 0.8)
})

test('captionLines groups up to 4 words and breaks at sentence ends', () => {
  const lines = captionLines(wordsFrom(align('One two. Three four five six seven')))
  assert.deepEqual(lines.map(l => l.text), ['One two.', 'Three four five six', 'seven'])
})

test('SRT and VTT formats', () => {
  const lines = [{ text: 'Hello', start: 0, end: 1.25 }, { text: 'world', start: 61.5, end: 3725.004 }]
  assert.equal(toSRT(lines), '1\n00:00:00,000 --> 00:00:01,250\nHello\n\n2\n00:01:01,500 --> 01:02:05,004\nworld\n')
  assert.match(toVTT(lines), /^WEBVTT\n\n00:00:00\.000 --> 00:00:01\.250\nHello\n/)
})

test('helpers', () => {
  assert.equal(spokenSeconds(align('abcd')), 0.4)
  assert.equal(spokenSeconds(null), 0)
  assert.equal(wordBudget(10), 24)
  assert.equal(wordBudget(1), 5)
  assert.equal(countWords('  a b\nc  '), 3)
})
