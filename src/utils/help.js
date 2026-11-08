// Help Center content: Markdown articles in src/help/*.md with a small front matter
// (title, collection, summary, cta, to). Edit the .md files to change the guides.
import COLLECTIONS from '../help/collections.json'

const RAW = import.meta.glob('../help/*.md', { eager: true, query: '?raw', import: 'default' })

function parse(path, text) {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/)
  const meta = {}
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) { try { meta[line.slice(0, i).trim()] = JSON.parse(line.slice(i + 1).trim()) } catch { meta[line.slice(0, i).trim()] = line.slice(i + 1).trim() } } }
  return { slug, body: m ? text.slice(m[0].length) : text, ...meta }
}

export const ARTICLES = Object.entries(RAW).map(([p, t]) => parse(p, t))
export { COLLECTIONS }
export const articleBySlug = slug => ARTICLES.find(a => a.slug === slug)
export const articlesIn = id => ARTICLES.filter(a => a.collection === id)
export const collectionById = id => COLLECTIONS.find(c => c.id === id)
export const POPULAR = ['first-photoshoot', 'plans-and-credits', 'posting-routes', 'looks', 'post-failed', 'system-check']

// Plain search: every word must appear in the title, summary or body (titles rank first).
export function searchHelp(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return ARTICLES
    .map(a => {
      const hay = `${a.title} ${a.summary} ${a.body}`.toLowerCase()
      if (!words.every(w => hay.includes(w))) return null
      const score = words.reduce((n, w) => n + (a.title.toLowerCase().includes(w) ? 3 : 0) + (a.summary.toLowerCase().includes(w) ? 1 : 0), 0)
      return { a, score }
    })
    .filter(Boolean).sort((x, y) => y.score - x.score).map(x => x.a)
}

// Markdown subset → HTML: ## headings, paragraphs, - and 1. lists, **bold**, *italic*,
// `code`. Everything is escaped first, so article text can't inject markup.
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
export function renderMarkdown(md) {
  const out = []
  let list = null
  const close = () => { if (list) { out.push(`</${list}>`); list = null } }
  for (const block of md.trim().split(/\n{2,}/)) {
    const lines = block.split('\n')
    if (/^##\s/.test(lines[0]) && lines.length === 1) { close(); out.push(`<h2>${inline(lines[0].replace(/^##\s+/, ''))}</h2>`); continue }
    if (lines.every(l => /^(-|\d+\.)\s/.test(l))) {
      const tag = /^\d+\./.test(lines[0]) ? 'ol' : 'ul'
      close(); out.push(`<${tag}>${lines.map(l => `<li>${inline(l.replace(/^(-|\d+\.)\s+/, ''))}</li>`).join('')}</${tag}>`); continue
    }
    if (/^(-|\d+\.)\s/.test(lines[1] || '') && !/^(-|\d+\.)\s/.test(lines[0])) {
      const items = lines.slice(1); const tag = /^\d+\./.test(items[0]) ? 'ol' : 'ul'
      close(); out.push(`<p>${inline(lines[0])}</p><${tag}>${items.map(l => `<li>${inline(l.replace(/^(-|\d+\.)\s+/, ''))}</li>`).join('')}</${tag}>`); continue
    }
    close(); out.push(`<p>${lines.map(inline).join('<br>')}</p>`)
  }
  close()
  return out.join('\n')
}
