import { useEffect, useState } from 'react'
import { getMatches, getTournamentSummary } from '../api'

function TournamentView() {
  const [tournamentSummary, setTournamentSummary] = useState(null)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getTournamentSummary(), getMatches()])
      .then(([summary, matchList]) => {
        setTournamentSummary(summary)
        setMatches(matchList)
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <div className="min-h-screen p-8 text-red-600">Failed to load: {error}</div>
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold text-slate-900">MatchPoint</h1>
      <p className="text-slate-500">
        {tournamentSummary ? `${tournamentSummary.total_matches} matches loaded` : 'Loading tournament data...'}
      </p>
      <p className="text-slate-500">{matches.length} match summaries loaded</p>
    </div>
  )
}

export default TournamentView
