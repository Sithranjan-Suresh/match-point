import { Link } from 'react-router-dom'

const EVENT_COLORS = {
  Goal: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Own Goal': 'bg-teal-100 text-teal-700 border-teal-300',
  'Missed Shot': 'bg-amber-100 text-amber-700 border-amber-300',
  'Yellow Card': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Second Yellow': 'bg-orange-100 text-orange-700 border-orange-300',
  'Red Card': 'bg-red-100 text-red-700 border-red-300',
  Substitution: 'bg-blue-100 text-blue-700 border-blue-300',
}

const DEFAULT_COLOR = 'bg-slate-100 text-slate-700 border-slate-300'

function MatchCard({ match }) {
  const colorClass = EVENT_COLORS[match.matchpoint_event_type] || DEFAULT_COLOR

  return (
    <Link
      to={`/match/${match.match_id}`}
      className="block rounded-lg border border-slate-200 p-4 bg-white hover:border-purple-400 hover:shadow-sm transition"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{match.stage}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
          {match.matchpoint_event_type} · {match.matchpoint_minute}'
        </span>
      </div>
      <p className="mt-2 font-semibold text-slate-900">
        {match.home_team} {match.score_home} — {match.score_away} {match.away_team}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {match.matchpoint_player} ({Math.abs(match.matchpoint_delta).toFixed(1)} pt swing)
      </p>
    </Link>
  )
}

export default MatchCard
