import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConnectorLogo from './ConnectorLogo'
import { CONNECTORS } from '../utils/connectors'
import { CHECK_KEY, systemChecks, saveCheckResult } from '../utils/systemCheck'
import { useLocalJSON } from '../utils/localJson'

// Settings → System check: runs one small real request per connection and keeps the
// result, so "connected" means "works" before you rely on it.
const ago = t => {
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString()
}
const connector = id => CONNECTORS.find(c => c.id === id)

export default function SystemCheck() {
  const [, setParams] = useSearchParams()
  const [results] = useLocalJSON(CHECK_KEY, {})
  const [running, setRunning] = useState({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checks = useMemo(() => systemChecks(), [results])
  const live = checks.filter(c => c.connected())
  const off = checks.filter(c => !c.connected())
  const busy = Object.values(running).some(Boolean)
  const done = live.filter(c => results[c.id])
  const failed = live.filter(c => results[c.id]?.state === 'fail')
  const allGood = live.length > 0 && done.length === live.length && !failed.length

  async function run(c) {
    setRunning(r => ({ ...r, [c.id]: true }))
    try { saveCheckResult(c.id, { state: 'ok', detail: await c.run(), at: Date.now() }) }
    catch (e) { saveCheckResult(c.id, { state: 'fail', detail: e?.message || 'Failed.', at: Date.now() }) }
    setRunning(r => ({ ...r, [c.id]: false }))
  }
  const runAll = () => Promise.all(live.map(run))
  const openConnection = id => setParams({ section: 'connections', c: id })

  const row = c => {
    const r = results[c.id]
    const isRunning = running[c.id]
    const on = c.connected()
    return (
      <li key={c.id}>
        <div className="muse-sc-row">
          <ConnectorLogo c={connector(c.id)} size={36} />
          <div className="muse-conn-text">
            <strong>{c.name}</strong>
            <small>{c.what}</small>
            {on && r && !isRunning && (
              <small className={r.state === 'fail' ? 'muse-sc-fail' : 'muse-sc-ok'} role={r.state === 'fail' ? 'alert' : undefined}>
                {r.detail} <span className="muse-muted">· {ago(r.at)}</span>
              </small>
            )}
          </div>
          {on ? (
            <>
              <span className={`muse-sc-dot ${isRunning ? 'run' : r?.state || ''}`} aria-label={isRunning ? 'Checking' : r ? (r.state === 'ok' ? 'Passed' : 'Failed') : 'Not checked yet'} />
              {r?.state === 'fail' && !isRunning && <button type="button" className="muse-btn muse-btn-text" onClick={() => openConnection(c.id)}>Fix</button>}
              <button type="button" className="muse-btn muse-btn-tonal" disabled={isRunning} onClick={() => run(c)}>{isRunning ? 'Checking…' : r ? 'Check again' : 'Check'}</button>
            </>
          ) : (
            <button type="button" className="muse-btn muse-btn-text" onClick={() => openConnection(c.id)}>Connect</button>
          )}
        </div>
      </li>
    )
  }

  return (
    <>
      <div className="muse-sc-summary" role="status">
        <div>
          <strong>{!live.length ? 'Nothing connected yet' : busy ? 'Checking…' : allGood ? 'Everything you use works' : failed.length ? `${failed.length} connection${failed.length > 1 ? 's' : ''} need${failed.length > 1 ? '' : 's'} attention` : `${live.length - done.length} not checked yet`}</strong>
          <small>Each check sends one small real request. No Higgsfield credits or ElevenLabs characters are used; the Claude check uses a few tokens.</small>
        </div>
        <button type="button" className="muse-btn muse-btn-filled" disabled={!live.length || busy} onClick={runAll}>Run all checks</button>
      </div>
      {live.length > 0 && <ul className="muse-conn-group">{live.map(row)}</ul>}
      {off.length > 0 && (
        <>
          <h3 className="muse-group-title muse-sc-subhead">Not connected</h3>
          <ul className="muse-conn-group">{off.map(row)}</ul>
        </>
      )}
    </>
  )
}
