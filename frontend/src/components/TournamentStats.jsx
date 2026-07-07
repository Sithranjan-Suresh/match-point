function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 bg-white">
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  )
}

function TournamentStats({ summary }) {
  if (!summary) return null

  const topMatch = summary.top_delta_matches?.[0]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
      <StatCard
        label="MatchPoint moments were not goals"
        value={`${summary.pct_matchpoints_not_goals}%`}
        detail="Missed shots, cards, and substitutions occasionally swing a match more than the eventual goal"
      />
      <StatCard
        label="Average win-probability swing"
        value={`${summary.avg_delta} pts`}
        detail="Per MatchPoint moment, tournament-wide"
      />
      {topMatch && (
        <StatCard
          label="Biggest swing of the tournament"
          value={`${Math.abs(topMatch.matchpoint_delta).toFixed(1)} pts`}
          detail={`${topMatch.home_team} vs ${topMatch.away_team} — ${topMatch.stage}`}
        />
      )}
    </div>
  )
}

export default TournamentStats
