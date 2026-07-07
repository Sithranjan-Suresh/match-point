import { useEffect, useState } from 'react'
import { getMatches, getTournamentSummary } from '../api'
import HeroFinding from '../components/HeroFinding'
import TournamentStats from '../components/TournamentStats'
import MinuteStrip from '../components/MinuteStrip'
import Findings from '../components/Findings'
import Methodology from '../components/Methodology'
import MatchGrid from '../components/MatchGrid'
import Skeleton from '../components/Skeleton'
import { popScrollPosition } from '../scrollMemory'

function TournamentSkeleton() {
  return (
    <div className="pt-16">
      <Skeleton className="h-4 w-72" />
      <Skeleton className="mt-8 h-24 w-full max-w-3xl" />
      <Skeleton className="mt-3 h-24 w-2/3 max-w-2xl" />
      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className="mt-16 grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
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
    return (
      <div className="mx-auto min-h-screen max-w-6xl px-6 py-24 md:px-10">
        <p className="eyebrow">Something went wrong</p>
        <p className="mt-4 text-rose">
          Couldn't load tournament data ({error}). Refresh the page to try again.
        </p>
      </div>
    )
  }

  const loading = !tournamentSummary || matches.length === 0
  const query = search.trim().toLowerCase()
  const filteredMatches = query
    ? matches.filter(
        (m) => m.home_team.toLowerCase().includes(query) || m.away_team.toLowerCase().includes(query)
      )
    : matches

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 md:px-10">
      {loading ? (
        <TournamentSkeleton />
      ) : (
        <>
          <HeroFinding summary={tournamentSummary} />
          <TournamentStats summary={tournamentSummary} />

          <section className="py-20">
            <MinuteStrip
              matches={matches}
              highlightIds={query ? new Set(filteredMatches.map((m) => m.match_id)) : null}
            />
          </section>

          <Findings summary={tournamentSummary} />

          <section className="py-20 pb-24">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="eyebrow">All 64 fixtures</div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by team"
                  className="w-56 border border-maroon-soft bg-surface px-4 py-2.5 font-mono text-sm text-chalk placeholder:text-rose/60 focus:border-gold focus:outline-none"
                />
                <span className="font-mono text-xs tabular-nums text-rose">
                  {filteredMatches.length}/64
                </span>
              </div>
            </div>
            <MatchGrid matches={filteredMatches} />
          </section>

          <Methodology />
        </>
      )}
    </div>
  )
}

export default TournamentView
