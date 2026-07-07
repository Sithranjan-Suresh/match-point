import Reveal from './Reveal'
import MatchCard from './MatchCard'

function MatchGrid({ matches }) {
  if (matches.length === 0) {
    return (
      <p className="py-16 text-center font-mono text-sm text-rose">
        No fixtures match that team name. Try another search.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {matches.map((match, i) => (
        <Reveal key={match.match_id} delay={(i % 6) * 60}>
          <MatchCard match={match} />
        </Reveal>
      ))}
    </div>
  )
}

export default MatchGrid
