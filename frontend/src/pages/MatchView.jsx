import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatch } from '../api'
import MatchHeader from '../components/MatchHeader'

function MatchView() {
  const { matchId } = useParams()
  const [match, setMatch] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setMatch(null)
    setError(null)
    getMatch(matchId)
      .then(setMatch)
      .catch((err) => setError(err.message))
  }, [matchId])

  if (error) {
    return <div className="min-h-screen p-8 text-red-600">Failed to load match: {error}</div>
  }

  if (!match) {
    return <div className="min-h-screen p-8 text-slate-500">Loading match...</div>
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-8">
      <MatchHeader match={match} />
    </div>
  )
}

export default MatchView
