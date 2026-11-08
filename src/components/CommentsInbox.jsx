import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { canHaveStats, loadComments, replyToComment, platformName } from '../utils/publishing'
import { isRouteConnected } from '../utils/connections'
import { hasClaude, runSkill, influencerContext } from '../utils/claudeAssist'

// Content → Inbox: comments on posts sent through Ayrshare, by post. Suggest reply drafts
// one in her voice (Claude); nothing is posted until you press Reply.
const isVideo = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || '')

export default function CommentsInbox({ posts, influencers, onPatchPost }) {
  const sent = useMemo(() => posts.filter(canHaveStats).sort((a, b) => new Date(b.postedAt || b.scheduledAt || 0) - new Date(a.postedAt || a.scheduledAt || 0)).slice(0, 40), [posts])
  const [openId, setOpenId] = useState(sent[0]?.id || '')
  const [state, setState] = useState({}) // postId → { busy, error, comments, at }
  const post = sent.find(p => p.id === openId)
  const inf = influencers.find(i => i.id === post?.influencerId)
  if (!isRouteConnected('ayrshare')) return <div className="muse-empty"><h2>Connect Ayrshare to read comments</h2><p>Comments are read from the posts Ayrshare sent. Zapier, Make, n8n and webhooks can’t report them back.</p><Link className="muse-btn muse-btn-filled" to="/settings?section=connections&c=ayrshare">Connect Ayrshare</Link></div>
  if (!sent.length) return <div className="muse-empty"><h2>No sent posts yet</h2><p>Comments show up here for posts sent through Ayrshare.</p></div>
  const st = state[openId] || {}
  async function load(p) {
    setState(s => ({ ...s, [p.id]: { ...s[p.id], busy: true, error: '' } }))
    try { const comments = await loadComments(p); setState(s => ({ ...s, [p.id]: { busy: false, comments, at: Date.now() } })) }
    catch (e) { setState(s => ({ ...s, [p.id]: { ...s[p.id], busy: false, error: e.message } })) }
  }
  return (
    <div className="muse-inbox">
      <ul className="muse-inbox-posts" aria-label="Sent posts">
        {sent.map(p => (
          <li key={p.id}>
            <button type="button" className={p.id === openId ? 'on' : ''} onClick={() => { setOpenId(p.id); if (!state[p.id]) load(p) }}>
              <span className="muse-thumb" style={{ backgroundImage: p.mediaUrls?.[0] && !isVideo(p.mediaUrls[0]) ? `url(${p.mediaUrls[0]})` : undefined }}>{isVideo(p.mediaUrls?.[0]) && <em>Video</em>}</span>
              <span><b>{p.caption?.split('\n')[0]?.slice(0, 60) || 'No caption'}</b><small>{(p.platforms || []).map(platformName).join(', ')}{state[p.id]?.comments ? ` · ${state[p.id].comments.length} comments` : ''}</small></span>
            </button>
          </li>
        ))}
      </ul>
      <section className="muse-inbox-thread" aria-label="Comments">
        <div className="muse-assist-row">
          <strong style={{ flex: 1 }}>{post?.caption?.split('\n')[0]?.slice(0, 80) || 'Post'}</strong>
          {st.at && <small className="muse-muted">Read {new Date(st.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>}
          <button type="button" className="muse-btn muse-btn-tonal" disabled={st.busy} onClick={() => load(post)}>{st.busy ? 'Reading…' : st.comments ? 'Refresh' : 'Read comments'}</button>
        </div>
        {st.error && <p className="muse-error">{st.error}</p>}
        {st.comments && !st.comments.length && <p className="muse-muted">No comments yet.</p>}
        <ul className="muse-inbox-list">
          {(st.comments || []).map(c => <Comment key={`${c.platform}-${c.id}`} c={c} post={post} inf={inf} replied={(post.replied || {})[c.id]} onReplied={text => onPatchPost(post.id, { replied: { ...(post.replied || {}), [c.id]: { text, at: Date.now() } } })} />)}
        </ul>
      </section>
    </div>
  )
}

function Comment({ c, post, inf, replied, onReplied }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  async function suggest() {
    setBusy('suggest'); setError('')
    try { setText((await runSkill({ task: `Write a short reply (one or two sentences) to this ${platformName(c.platform)} comment on her post. Warm, in her voice, no hashtags. Return only the reply.\n\nHer post: ${post.caption || '(no caption)'}\nComment from ${c.author || 'a follower'}: ${c.text}`, context: influencerContext(inf), maxTokens: 200 })).replace(/^["']|["']$/g, '')) }
    catch (e) { setError(e.message) } finally { setBusy('') }
  }
  async function send() {
    setBusy('send'); setError('')
    try { await replyToComment(c, text.trim()); onReplied(text.trim()); setText('') } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  return (
    <li className="muse-inbox-c">
      <div><b>{c.author || 'Someone'}</b> <small className="muse-muted">{platformName(c.platform)}{c.at ? ` · ${new Date(c.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}{c.likes ? ` · ${c.likes} likes` : ''}{c.own ? ' · you' : ''}</small></div>
      <p>{c.text}</p>
      {replied ? <small className="muse-muted">You replied: “{replied.text}”</small> : !c.own && (
        <>
          <div className="muse-assist-row">
            <input className="muse-input" value={text} onChange={e => setText(e.target.value)} placeholder="Reply…" aria-label={`Reply to ${c.author || 'comment'}`} />
            {hasClaude() && <button type="button" className="muse-btn muse-btn-text" disabled={!!busy} onClick={suggest}>{busy === 'suggest' ? 'Writing…' : 'Suggest reply'}</button>}
            <button type="button" className="muse-btn muse-btn-filled" disabled={!text.trim() || !!busy} onClick={send}>{busy === 'send' ? 'Replying…' : 'Reply'}</button>
          </div>
          {error && <small className="muse-error">{error}</small>}
        </>
      )}
    </li>
  )
}
