import { useEffect, useRef } from 'react'
// Plan card — shown before every generation so the user sees what will run and
// roughly what it costs. Pattern: a tonal card listing the steps, then
// "Edit plan" (tonal) and "Start" (solid accent).
//
// rows: [{ key, label, value, hint? }]  — value may be a string or an array of strings (chips)
// credits: number | null                — estimated Higgsfield credits; null hides the line

const ICONS = {
  poses: 'M12 4a2 2 0 1 0 0-.01M8 21l2-7-3-3 2-4h6l2 4-3 3 2 7',
  outfit: 'M8 3l4 2 4-2 4 4-3 3v11H7V10L4 7z',
  model: 'M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z',
  aspect: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
  resolution: 'M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4',
  location: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  count: 'M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z',
  refs: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4',
}

function RowIcon({ name }) {
  const d = ICONS[name] || ICONS.model
  return (
    <span className="muse-plan-icon" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </span>
  )
}

export default function PlanCard({ title = 'Here’s the plan', subtitle, rows = [], credits = null, creditNote, onEdit, onStart, startLabel = 'Start', editLabel = 'Edit plan', busy = false, autoFocus = true }) {
  const startRef = useRef(null)
  useEffect(() => { if (autoFocus) startRef.current?.focus({ preventScroll: true }) }, [autoFocus])

  return (
    <section className="muse-plan" aria-label="Generation plan">
      <header className="muse-plan-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </header>

      <ol className="muse-plan-rows">
        {rows.filter(r => r && r.value != null && r.value !== '' && !(Array.isArray(r.value) && !r.value.length)).map(r => (
          <li key={r.key || r.label} className="muse-plan-row">
            <RowIcon name={r.key} />
            <div className="muse-plan-row-body">
              <span className="muse-plan-label">{r.label}</span>
              {Array.isArray(r.value)
                ? <span className="muse-plan-chips">{r.value.map((v, i) => <span key={i} className="muse-plan-chip">{v}</span>)}</span>
                : <span className="muse-plan-value">{r.value}</span>}
              {r.hint && <span className="muse-plan-hint">{r.hint}</span>}
            </div>
          </li>
        ))}
      </ol>

      {credits != null && (
        <div className="muse-plan-cost">
          <span>Estimated cost</span>
          <strong>≈ {credits} credits</strong>
        </div>
      )}
      {credits != null && (
        <p className="muse-plan-note">{creditNote || 'Estimate only. Higgsfield charges the final amount to your own account.'}</p>
      )}

      <div className="muse-plan-actions">
        <button type="button" className="muse-btn muse-btn-tonal" onClick={onEdit} disabled={busy}>{editLabel}</button>
        <button type="button" ref={startRef} className="muse-btn muse-btn-filled" onClick={onStart} disabled={busy}>{busy ? 'Starting…' : startLabel}</button>
      </div>
    </section>
  )
}

