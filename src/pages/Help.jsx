import { useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ARTICLES, COLLECTIONS, POPULAR, articleBySlug, articlesIn, collectionById, searchHelp, renderMarkdown } from '../utils/help'
import { useLocalJSON } from '../utils/localJson'

// Help Center: /help (search, collections, popular), /help/c/:id (a collection),
// /help/a/:slug (an article with a "do it now" button, feedback and related guides).
const FEEDBACK_FORM_URL = 'https://forms.gle/p5cBXw4sYaHPdcANA'
const VOTES_KEY = 'muse_help_votes'

function Search({ autoFocus = false }) {
  const [q, setQ] = useState('')
  const results = useMemo(() => searchHelp(q).slice(0, 8), [q])
  return (
    <div className="muse-help-search">
      <input className="muse-input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search guides: posting, looks, credits…" aria-label="Search help" autoFocus={autoFocus} />
      {q.trim() && (
        <ul className="muse-help-results" aria-label="Search results">
          {results.length ? results.map(a => <li key={a.slug}><Link to={`/help/a/${a.slug}`}><b>{a.title}</b><small>{a.summary}</small></Link></li>)
            : <li className="muse-muted" style={{ padding: '12px 16px' }}>No guides match “{q}”. Try other words, or send us feedback below.</li>}
        </ul>
      )}
    </div>
  )
}

const Crumbs = ({ items }) => (
  <nav className="muse-help-crumbs" aria-label="Breadcrumb">
    <Link to="/help">Help</Link>
    {items.map(([label, to]) => <span key={label}> / {to ? <Link to={to}>{label}</Link> : label}</span>)}
  </nav>
)

function Contact() {
  return (
    <section className="muse-help-contact">
      <div><b>Still stuck?</b><p className="muse-muted">Test your connections, or tell us what went wrong. We read every message.</p></div>
      <div className="muse-chip-row">
        <Link className="muse-btn muse-btn-tonal" to="/settings?section=check">Run System check</Link>
        <a className="muse-btn muse-btn-filled" href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">Send feedback</a>
      </div>
    </section>
  )
}

function HelpHome() {
  return (
    <div className="muse-help">
      <header className="muse-help-hero">
        <h1>How can we help?</h1>
        <p className="muse-muted">Guides for every part of Muse, from your first photoshoot to posting and brand deals.</p>
        <Search autoFocus />
      </header>
      <section aria-labelledby="help-topics">
        <h2 id="help-topics" className="muse-group-title">Topics</h2>
        <div className="muse-help-grid">
          {COLLECTIONS.map(c => (
            <Link key={c.id} to={`/help/c/${c.id}`} className="muse-help-coll">
              <b>{c.title}</b><small>{c.summary}</small><span className="muse-muted">{articlesIn(c.id).length} guide{articlesIn(c.id).length === 1 ? "" : "s"}</span>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="help-popular">
        <h2 id="help-popular" className="muse-group-title">Popular</h2>
        <ul className="muse-help-list">
          {POPULAR.map(articleBySlug).filter(Boolean).map(a => <li key={a.slug}><Link to={`/help/a/${a.slug}`}><b>{a.title}</b><small>{a.summary}</small></Link></li>)}
        </ul>
      </section>
      <Contact />
    </div>
  )
}

function Collection({ id }) {
  const c = collectionById(id)
  if (!c) return <NotFound />
  return (
    <div className="muse-help">
      <Crumbs items={[[c.title]]} />
      <header className="muse-help-head"><h1>{c.title}</h1><p className="muse-muted">{c.summary}</p></header>
      <ul className="muse-help-list">
        {articlesIn(id).map(a => <li key={a.slug}><Link to={`/help/a/${a.slug}`}><b>{a.title}</b><small>{a.summary}</small></Link></li>)}
      </ul>
      <Contact />
    </div>
  )
}

function Article({ slug }) {
  const navigate = useNavigate()
  const a = articleBySlug(slug)
  const [votes, setVotes] = useLocalJSON(VOTES_KEY, {})
  const html = useMemo(() => (a ? renderMarkdown(a.body) : ''), [a])
  if (!a) return <NotFound />
  const c = collectionById(a.collection)
  const related = articlesIn(a.collection).filter(x => x.slug !== a.slug).slice(0, 4)
  const vote = votes[slug]
  return (
    <div className="muse-help">
      <Crumbs items={[[c?.title || 'Guides', c ? `/help/c/${c.id}` : null], [a.title]]} />
      <article className="muse-help-article">
        <h1>{a.title}</h1>
        <p className="muse-help-summary">{a.summary}</p>
        {a.to && <button type="button" className="muse-btn muse-btn-filled muse-help-cta" onClick={() => navigate(a.to)}>{a.cta || 'Open'} →</button>}
        <div className="muse-help-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <section className="muse-help-vote" aria-label="Was this helpful?">
        {vote ? <span className="muse-muted" role="status">{vote === 'yes' ? 'Thanks! Glad it helped.' : <>Thanks. <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">Tell us what was missing</a>.</>}</span> : (
          <><span>Was this helpful?</span>
            <button type="button" className="muse-chip" onClick={() => setVotes({ ...votes, [slug]: 'yes' })}>Yes</button>
            <button type="button" className="muse-chip" onClick={() => setVotes({ ...votes, [slug]: 'no' })}>No</button></>
        )}
      </section>
      {related.length > 0 && (
        <section aria-labelledby="help-related">
          <h2 id="help-related" className="muse-group-title">Related guides</h2>
          <ul className="muse-help-list">{related.map(r => <li key={r.slug}><Link to={`/help/a/${r.slug}`}><b>{r.title}</b><small>{r.summary}</small></Link></li>)}</ul>
        </section>
      )}
    </div>
  )
}

const NotFound = () => (
  <div className="muse-help"><Crumbs items={[['Not found']]} /><header className="muse-help-head"><h1>Guide not found</h1><p className="muse-muted">It may have moved. Search below.</p></header><Search /></div>
)

export default function Help() {
  const { slug, id } = useParams()
  if (slug) return <Article slug={slug} />
  if (id) return <Collection id={id} />
  return <HelpHome />
}

export const HELP_ARTICLE_COUNT = ARTICLES.length
