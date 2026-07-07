import { Link } from 'react-router-dom'
import { saveScrollPosition } from '../scrollMemory'
import { eventFillColor } from '../eventColors'

function MatchCard({ match }) {
  const color = eventFillColor(match.matchpoint_event_type)
  const homeWins = match.score_home > match.score_away
  const awayWins = match.score_away > match.score_home

  return (
    <Link to={`/match/${match.match_id}`} onClick={saveScrollPosition} className="fixture">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="text-rose">
          {match.stage}
          {match.decided_on_penalties && ' · pens'}
        </span>
        <span style={{ color }}>
          {match.matchpoint_event_type} · {match.matchpoint_minute}'
        </span>
      </div>

      <div className="display mt-4 flex flex-wrap items-baseline gap-x-3 text-[1.7rem] leading-none">
        <span className={homeWins || (!homeWins && !awayWins) ? 'text-chalk' : 'text-rose/70'}>
          {match.home_team}
        </span>
        <span className="font-mono text-xl font-semibold tabular-nums text-gold">
          {match.score_home}–{match.score_away}
        </span>
        <span className={awayWins || (!homeWins && !awayWins) ? 'text-chalk' : 'text-rose/70'}>
          {match.away_team}
        </span>
      </div>

      <p className="mt-3 text-sm text-rose">
        {match.matchpoint_player}
        <span className="font-mono text-xs tabular-nums">
          {' '}
          · {Math.abs(match.matchpoint_delta).toFixed(1)} pt swing
        </span>
      </p>
    </Link>
  )
}

export default MatchCard
