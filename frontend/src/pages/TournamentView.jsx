import { useEffect, useState } from 'react'
import { getMatches, getTournamentSummary } from '../api'
import HeroFinding from '../components/HeroFinding'
import TournamentStats from '../components/TournamentStats'

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
    <div className="min-h-screen max-w-5xl mx-auto p-8">
      <HeroFinding summary={tournamentSummary} />
      <TournamentStats summary={tournamentSummary} />
      {!tournamentSummary && <p className="text-slate-500">Loading tournament data...</p>}
      <p className="text-slate-400 text-sm">{matches.length} match summaries loaded</p>
    </div>
  )
}

export default TournamentView
