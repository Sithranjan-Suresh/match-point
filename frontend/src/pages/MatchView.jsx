import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatch } from '../api'
import MatchHeader from '../components/MatchHeader'
import ProbabilityTimeline from '../components/ProbabilityTimeline'
import MatchPointPanel from '../components/MatchPointPanel'
import CounterfactualPanel from '../components/CounterfactualPanel'
import EventDetailPanel from '../components/EventDetailPanel'
import Skeleton from '../components/Skeleton'

function MatchView() {
  const { matchId } = useParams()
  const [match, setMatch] = useState(null)
  const [error, setError] = useState(null)
  const [counterfactualActive, setCounterfactualActive] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    setMatch(null)
    setError(null)
    setCounterfactualActive(false)
    setSelectedEvent(null)
    window.scrollTo(0, 0)
    getMatch(matchId)
      .then(setMatch)
      .catch((err) => setError(err.message))
  }, [matchId])

  if (error) {
    return (
      <div className="mx-auto min-h-screen max-w-6xl px-6 py-24 md:px-10">
        <p className="eyebrow">Something went wrong</p>
        <p className="mt-4 text-rose">Couldn't load this match ({error}). Refresh to try again.</p>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="mx-auto min-h-screen max-w-6xl px-6 pt-10 md:px-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-14 h-4 w-56" />
        <Skeleton className="mt-5 h-20 w-2/3" />
        <Skeleton className="mt-10 h-[420px] w-full" />
      </div>
    )
  }

  const counterfactualData = counterfactualActive
    ? [
        { minute: match.matchpoint.minute, prob_home: match.matchpoint.counterfactual_prob_home_at_moment },
        ...match.counterfactual_timeline.map((e) => ({ minute: e.minute, prob_home: e.prob_home })),
      ]
    : null

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 md:px-10">
      <MatchHeader match={match} />
      <ProbabilityTimeline
        timeline={match.timeline}
        maxMinute={match.timeline[match.timeline.length - 1]?.minute || 90}
        matchpointEventId={match.matchpoint.event_id}
        matchpointMinute={match.matchpoint.minute}
        counterfactualData={counterfactualData}
        onEventClick={setSelectedEvent}
        homeTeam={match.home_team}
      />
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          prevProbHome={
            match.timeline[match.timeline.findIndex((e) => e.event_id === selectedEvent.event_id) - 1]
              ?.prob_home ?? match.timeline[0].prob_home
          }
          onClose={() => setSelectedEvent(null)}
        />
      )}
      <MatchPointPanel matchpoint={match.matchpoint} homeTeam={match.home_team} narrative={match.narrative}>
        <CounterfactualPanel
          matchpoint={match.matchpoint}
          homeTeam={match.home_team}
          active={counterfactualActive}
          onToggle={() => setCounterfactualActive((prev) => !prev)}
        />
      </MatchPointPanel>
      <div className="pb-16" />
    </div>
  )
}

export default MatchView
