function CounterfactualPanel({ matchpoint, homeTeam, active, onToggle }) {
  const isHome = matchpoint.team === homeTeam
  const actualProb = isHome ? matchpoint.prob_home_after : matchpoint.prob_away_after
  const counterfactualProb = isHome
    ? matchpoint.counterfactual_prob_home_at_moment
    : 100 - matchpoint.counterfactual_prob_home_at_moment

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="text-sm font-medium text-purple-600 hover:underline"
      >
        {active ? 'Hide counterfactual' : 'What if this had gone the other way?'}
      </button>
      {active && (
        <div className="mt-2">
          <p className="text-slate-700">
            If {matchpoint.player}'s {matchpoint.event_type.toLowerCase()} had gone the other
            way, {matchpoint.team}'s win probability at that moment would have been{' '}
            <strong>{counterfactualProb.toFixed(1)}%</strong> instead of{' '}
            <strong>{actualProb.toFixed(1)}%</strong>.
          </p>
        </div>
      )}
    </div>
  )
}

export default CounterfactualPanel
