import { weekProgress, goalStreak } from '../utils/goals'

// Weekly posting goal for one influencer: sent + queued this week against her goal,
// and how many weeks in a row she met it. Counts real posts only.
export default function GoalBar({ influencer, posts, compact = false }) {
  const s = influencer?.postingSchedule
  if (!s) return null
  const w = weekProgress(s, posts, influencer.id)
  const streak = goalStreak(s, posts, influencer.id)
  const pct = Math.min(100, Math.round((w.total / w.goal) * 100))
  const sentPct = Math.min(100, Math.round((w.sent / w.goal) * 100))
  const name = influencer.name || 'Untitled'
  return (
    <div className={`muse-goal${compact ? ' compact' : ''}${w.met ? ' met' : ''}`}>
      <div className="muse-goal-top">
        <strong>{compact ? name : 'This week'}</strong>
        <span>{w.total} of {w.goal}{w.queued ? <small> · {w.sent} sent, {w.queued} queued</small> : null}</span>
      </div>
      <div className="muse-goal-track" role="progressbar" aria-label={`${name}: ${w.total} of ${w.goal} posts this week`} aria-valuemin={0} aria-valuemax={w.goal} aria-valuenow={w.total}>
        <i className="queued" style={{ width: `${pct}%` }} />
        <i className="sent" style={{ width: `${sentPct}%` }} />
      </div>
      <small className="muse-goal-sub">
        {w.met ? 'Goal met' : `${w.short} more to reach the goal · ${w.daysLeft} day${w.daysLeft === 1 ? '' : 's'} left`}
        {streak > 0 && <> · <b>{streak}-week streak</b></>}
      </small>
    </div>
  )
}
