import { eventFillColor } from '../eventColors'

function EventSummary({ matchpoint, homeTeam }) {
  // matchpoint.delta is the change in the HOME team's win probability. Flip
  // the sign when the scoring/impacted team is the away team, so the badge
  // reads correctly as "+X% for {team}" regardless of home/away.
  const rawDelta = matchpoint.delta
  const delta = matchpoint.team === homeTeam ? rawDelta : -rawDelta
  const sign = delta >= 0 ? '+' : ''

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-slate-400">MatchPoint Moment</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {matchpoint.minute}' — {matchpoint.event_type}
        </p>
        <p className="text-sm text-slate-500">
          {matchpoint.player} ({matchpoint.team})
        </p>
      </div>
      <div className="text-right">
        <span
          className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: eventFillColor(matchpoint.event_type) }}
        >
          {sign}{delta.toFixed(1)}% for {matchpoint.team}
        </span>
      </div>
    </div>
  )
}

export default EventSummary
