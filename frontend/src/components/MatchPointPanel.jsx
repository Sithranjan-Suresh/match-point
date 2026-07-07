import EventSummary from './EventSummary'
import NarrativeCard from './NarrativeCard'

function MatchPointPanel({ matchpoint, homeTeam, narrative, children }) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <EventSummary matchpoint={matchpoint} homeTeam={homeTeam} />
      <NarrativeCard narrative={narrative} />
      {children}
    </div>
  )
}

export default MatchPointPanel
