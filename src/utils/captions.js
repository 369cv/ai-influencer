// Captions from ElevenLabs speech timing. Pure functions (tested with node --test).
// alignment = { characters: [...], starts: [...], ends: [...] } in seconds.

export function wordsFrom(alignment) {
  const { characters = [], starts = [], ends = [] } = alignment || {}
  const words = []
  let cur = null
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null } return }
    if (!cur) cur = { text: '', start: starts[i] ?? 0, end: ends[i] ?? 0 }
    cur.text += ch
    cur.end = ends[i] ?? cur.end
  })
  if (cur) words.push(cur)
  return words
}

// Groups words into short caption lines (default: up to 4 words, a break after . ! ?).
export function captionLines(words, { maxWords = 4 } = {}) {
  const lines = []
  let line = []
  for (const w of words) {
    line.push(w)
    if (line.length >= maxWords || /[.!?]["')]?$/.test(w.text)) { lines.push(line); line = [] }
  }
  if (line.length) lines.push(line)
  return lines.map(l => ({ text: l.map(w => w.text).join(' '), start: l[0].start, end: l[l.length - 1].end }))
}

const pad = (n, w = 2) => String(n).padStart(w, '0')
function stamp(sec, sep) {
  const ms = Math.max(0, Math.round(sec * 1000))
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${sep}${pad(ms % 1000, 3)}`
}
export const toSRT = lines => lines.map((l, i) => `${i + 1}\n${stamp(l.start, ',')} --> ${stamp(l.end, ',')}\n${l.text}\n`).join('\n')
export const toVTT = lines => `WEBVTT\n\n${lines.map(l => `${stamp(l.start, '.')} --> ${stamp(l.end, '.')}\n${l.text}\n`).join('\n')}`

// Spoken length from the timing, in seconds.
export const spokenSeconds = alignment => { const e = alignment?.ends || []; return e.length ? e[e.length - 1] : 0 }

// Words that fit in a clip: about 2.5 spoken words a second, a little under for breathing room.
export const wordBudget = seconds => Math.max(5, Math.floor(seconds * 2.4))
export const countWords = text => (String(text || '').trim().match(/\S+/g) || []).length
