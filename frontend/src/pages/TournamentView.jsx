import { useEffect, useState } from 'react'
import { getMatches, getTournamentSummary } from '../api'
import HeroFinding from '../components/HeroFinding'
import TournamentStats from '../components/TournamentStats'
import MatchGrid from '../components/MatchGrid'
import Skeleton from '../components/Skeleton'
import { popScrollPosition } from '../scrollMemory'

function TournamentSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-64 mb-3" />
      <Skeleton className="h-10 w-full max-w-2xl mb-2" />
      <Skeleton className="h-10 w-3/4 max-w-xl mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}

function TournamentView() {
  const [tournamentSummary, setTournamentSummary] = useState(null)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getTournamentSummary(), getMatches()])
      .then(([summary, matchList]) => {
        setTournamentSummary(summary)
        setMatches(matchList)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (matches.length === 0) return
    const savedY = popScrollPosition()
    if (savedY != null) {
      // Wait a frame so the full grid has laid out before scrolling — otherwise
      // the page may not yet be tall enough and the scroll gets clamped short.
      requestAnimationFrame(() => window.scrollTo(0, savedY))
    }
  }, [matches])

  if (error) {
    return <div className="min-h-screen p-8 text-red-600">Failed to load: {error}</div>
  }

  const loading = !tournamentSummary || matches.length === 0
  const query = search.trim().toLowerCase()
  const filteredMatches = query
    ? matches.filter(
        (m) => m.home_team.toLowerCase().includes(query) || m.away_team.toLowerCase().includes(query)
      )
    : matches

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-8 animate-fade-in">
      {loading ? (
        <TournamentSkeleton />
      ) : (
        <>
          <HeroFinding summary={tournamentSummary} />
          <TournamentStats summary={tournamentSummary} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name..."
            className="mb-4 w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
          <MatchGrid matches={filteredMatches} />
        </>
      )}
    </div>
  )
}

export default TournamentView
