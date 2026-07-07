import { useParams } from 'react-router-dom'

function MatchView() {
  const { matchId } = useParams()
  return (
    <div className="min-h-screen p-8">
      <p className="text-slate-500">Match view for match {matchId} coming next.</p>
    </div>
  )
}

export default MatchView
