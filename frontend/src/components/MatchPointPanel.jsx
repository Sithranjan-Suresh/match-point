import EventSummary from './EventSummary'

function MatchPointPanel({ matchpoint, homeTeam, children }) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <EventSummary matchpoint={matchpoint} homeTeam={homeTeam} />
      {children}
    </div>
  )
}

export default MatchPointPanel
