import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatch } from '../api'
import MatchHeader from '../components/MatchHeader'
import ProbabilityTimeline from '../components/ProbabilityTimeline'
import MatchPointPanel from '../components/MatchPointPanel'
import CounterfactualPanel from '../components/CounterfactualPanel'

function MatchView() {
  const { matchId } = useParams()
  const [match, setMatch] = useState(null)
  const [error, setError] = useState(null)
  const [counterfactualActive, setCounterfactualActive] = useState(false)

  useEffect(() => {
    setMatch(null)
    setError(null)
    setCounterfactualActive(false)
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

  const counterfactualData = counterfactualActive
    ? [
        { minute: match.matchpoint.minute, prob_home: match.matchpoint.counterfactual_prob_home_at_moment },
        ...match.counterfactual_timeline.map((e) => ({ minute: e.minute, prob_home: e.prob_home })),
      ]
    : null

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-8">
      <MatchHeader match={match} />
      <ProbabilityTimeline
        timeline={match.timeline}
        maxMinute={match.timeline[match.timeline.length - 1]?.minute || 90}
        matchpointEventId={match.matchpoint.event_id}
        counterfactualData={counterfactualData}
      />
      <MatchPointPanel matchpoint={match.matchpoint} homeTeam={match.home_team} narrative={match.narrative}>
        <CounterfactualPanel
          matchpoint={match.matchpoint}
          homeTeam={match.home_team}
          active={counterfactualActive}
          onToggle={() => setCounterfactualActive((prev) => !prev)}
        />
      </MatchPointPanel>
    </div>
  )
}

export default MatchView
