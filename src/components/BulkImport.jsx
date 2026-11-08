import { useMemo, useState } from 'react'
import { Dialog } from './ui'
import { parseCSV, rowsToPosts, templateCSV } from '../utils/bulkImport'
import { newId } from '../utils/localJson'
import { downloadImage } from '../utils/imageUtils'

// Content → Import: a CSV of posts, a review table (each row valid or why not), then
// add the valid rows as drafts or to the queue. Nothing is sent to a posting service
// here; queued posts go out when you send them from the queue.
export default function BulkImport({ influencers, accounts, onImport, onClose }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState('')
  const rows = useMemo(() => (text.trim() ? rowsToPosts(parseCSV(text), { influencers, accounts }) : []), [text, influencers, accounts])
  const ok = rows.filter(r => r.ok)
  const timed = ok.filter(r => r.post.scheduledAt && r.post.accountIds.length)
  const infName = id => influencers.find(i => i.id === id)?.name || '—'
  async function pick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f.name); setText(await f.text())
  }
  function add(asQueue) {
    const at = Date.now()
    onImport(ok.map((r, n) => ({
      ...r.post, id: newId('post'), createdAt: at + n, updatedAt: at + n,
      status: asQueue && r.post.scheduledAt && r.post.accountIds.length ? 'planned' : 'draft',
      platforms: [...new Set(accounts.filter(a => r.post.accountIds.includes(a.id)).map(a => a.platform))],
    })))
    onClose()
  }
  return (
    <Dialog title="Import posts from a CSV" wide onClose={onClose} actions={<>
      <button type="button" className="muse-btn muse-btn-text" onClick={onClose}>Cancel</button>
      <button type="button" className="muse-btn muse-btn-tonal" disabled={!ok.length} onClick={() => add(false)}>Add {ok.length || ''} as drafts</button>
      <button type="button" className="muse-btn muse-btn-filled" disabled={!timed.length} onClick={() => add(true)} title="Rows with a time and accounts go in the queue as Planned; the rest become drafts">Add to queue{timed.length ? ` (${timed.length} timed)` : ''}</button>
    </>}>
      <p className="muse-muted" style={{ fontSize: 13 }}>Columns: date (YYYY-MM-DD), time (HH:MM), influencer, accounts, caption, media (https links), first_comment, instagram_as. Times use this device’s time zone. <button type="button" className="muse-btn muse-btn-text" style={{ padding: 0 }} onClick={() => downloadImage(`data:text/csv;base64,${btoa(templateCSV())}`, 'muse-posts-template.csv')}>Download the template</button></p>
      <div className="muse-assist-row">
        <label className="muse-btn muse-btn-tonal">Choose a CSV file<input type="file" accept=".csv,text/csv" onChange={pick} hidden /></label>
        <span className="muse-muted">{file || 'or paste it below'}</span>
      </div>
      <textarea className="muse-input" rows={4} value={text} onChange={e => { setText(e.target.value); setFile('') }} placeholder={templateCSV()} aria-label="CSV" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
      {rows.length > 0 && (
        <>
          <p className="muse-muted" style={{ fontSize: 13 }}>{ok.length} of {rows.length} rows ready{rows.length - ok.length ? `, ${rows.length - ok.length} with errors (they’re skipped)` : ''}.</p>
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            <table className="muse-ins-table" aria-label="Review">
              <thead><tr><th>Row</th><th>When</th><th>Influencer</th><th>Caption</th><th>Media</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.line}>
                    <td className="num">{r.line}</td>
                    <td>{r.post?.scheduledAt ? new Date(r.post.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                    <td>{r.post ? infName(r.post.influencerId) : '—'}</td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.post?.caption || ''}</td>
                    <td className="num">{r.post?.mediaUrls.length ?? ''}</td>
                    <td>{r.ok ? <span className="muse-badge approved">Ready</span> : <span className="muse-error" style={{ fontSize: 12 }}>{r.errors.join(' ')}</span>}{r.warnings.length > 0 && <small className="muse-muted" style={{ display: 'block' }}>{r.warnings.join(' ')}</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Dialog>
  )
}
