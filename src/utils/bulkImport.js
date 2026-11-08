// Bulk import (Buffer-style): a CSV of posts → a review table (valid or error per row)
// → drafts or queued posts. Pure functions (tested with node --test).
//
// Columns (header row, any order, case-insensitive):
//   date (YYYY-MM-DD), time (HH:MM, 24h, viewer's time zone), caption, media
//   (https links separated by spaces or |), influencer (name), accounts (handles or
//   platform names separated by spaces, commas or |; empty = all of hers),
//   first_comment, instagram_as (post | reel | story)

export const TEMPLATE_HEADERS = ['date', 'time', 'influencer', 'accounts', 'caption', 'media', 'first_comment', 'instagram_as']

// RFC 4180: quoted fields, "" escapes, commas and newlines inside quotes.
export function parseCSV(text) {
  const rows = []
  let row = [], field = '', q = false
  const s = String(text || '').replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(x => x.trim() !== ''))
}

const norm = v => String(v || '').trim()
const split = v => norm(v).split(/[\s,|]+/).filter(Boolean)

// rows → [{ line, ok, errors: [], warnings: [], post }]
export function rowsToPosts(rows, { influencers = [], accounts = [], now = Date.now() } = {}) {
  if (!rows.length) return []
  const head = rows[0].map(h => norm(h).toLowerCase().replace(/\s+/g, '_'))
  const col = name => head.indexOf(name)
  if (col('caption') < 0 && col('media') < 0) return [{ line: 1, ok: false, errors: ['The first row must be a header with at least caption or media.'], warnings: [], post: null }]
  return rows.slice(1).map((r, i) => {
    const get = name => (col(name) >= 0 ? norm(r[col(name)]) : '')
    const errors = [], warnings = []
    const caption = get('caption')
    const media = split(get('media').replace(/\|/g, ' '))
    const bad = media.filter(u => !/^https:\/\//i.test(u))
    if (bad.length) errors.push(`Media must be https links (${bad[0].slice(0, 40)}).`)
    if (!caption && !media.length) errors.push('Needs a caption or media.')
    // Influencer by name
    const who = get('influencer')
    const inf = who ? influencers.find(x => norm(x.name).toLowerCase() === who.toLowerCase()) : null
    if (who && !inf) errors.push(`No influencer named “${who}”.`)
    // Accounts: handles (with or without @) or platform names, limited to hers when known
    const pool = inf ? accounts.filter(a => a.influencerId === inf.id) : accounts
    const wanted = split(get('accounts'))
    let accountIds = []
    if (wanted.length) {
      for (const w of wanted) {
        const k = w.replace(/^@/, '').toLowerCase()
        const hits = pool.filter(a => norm(a.handle).replace(/^@/, '').toLowerCase() === k || a.platform === k)
        if (!hits.length) errors.push(`No account “${w}”${inf ? ` for ${inf.name}` : ''}.`)
        accountIds.push(...hits.map(a => a.id))
      }
    } else if (inf) accountIds = pool.map(a => a.id)
    accountIds = [...new Set(accountIds)]
    if (!accountIds.length && !errors.length) warnings.push('No accounts: it will be a draft until you pick some.')
    // When
    const date = get('date'), time = get('time')
    let scheduledAt = ''
    if (date || time) {
      const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date), tm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time || '')
      if (!dm) errors.push('Date must be YYYY-MM-DD.')
      else if (time && !tm) errors.push('Time must be HH:MM (24-hour).')
      else {
        const d = new Date(+dm[1], +dm[2] - 1, +dm[3], tm ? +tm[1] : 9, tm ? +tm[2] : 0)
        if (Number.isNaN(d.getTime()) || d.getMonth() !== +dm[2] - 1) errors.push('That date doesn’t exist.')
        else if (d.getTime() <= now) errors.push('That time has already passed.')
        else scheduledAt = d.toISOString()
        if (!tm && dm) warnings.push('No time: 9:00 AM.')
      }
    }
    const igAs = get('instagram_as').toLowerCase()
    if (igAs && !['post', 'reel', 'story'].includes(igAs)) errors.push('instagram_as must be post, reel or story.')
    const post = errors.length ? null : {
      caption, mediaUrls: media.slice(0, 10), accountIds, influencerId: inf?.id || null, scheduledAt,
      ...(get('first_comment') ? { firstComment: get('first_comment') } : {}),
      ...(igAs && igAs !== 'post' ? { igFormat: igAs } : {}),
      importedAt: now,
    }
    if (media.length > 10) warnings.push('Only the first 10 media links are kept.')
    return { line: i + 2, ok: !errors.length, errors, warnings, post }
  })
}

export const templateCSV = () => `${TEMPLATE_HEADERS.join(',')}\n`
