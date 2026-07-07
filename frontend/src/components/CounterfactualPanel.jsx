function CounterfactualPanel({ matchpoint, homeTeam, active, onToggle }) {
  const isHome = matchpoint.team === homeTeam
  const actualProb = isHome ? matchpoint.prob_home_after : matchpoint.prob_away_after
  const counterfactualProb = isHome
    ? matchpoint.counterfactual_prob_home_at_moment
    : 100 - matchpoint.counterfactual_prob_home_at_moment

  return (
    <div className="mt-10 border-t border-maroon-soft pt-8">
      <p className="eyebrow mb-4" style={{ color: 'var(--color-ice)' }}>
        The other timeline
      </p>
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer border border-ice/60 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-ice transition-colors hover:bg-ice/10"
      >
        {active ? 'Hide the other timeline' : 'Show the other timeline'}
      </button>
      {active && (
        <div className="mt-6">
          <p className="max-w-[58ch] text-base leading-relaxed text-chalk/90">
            If {matchpoint.player}'s {matchpoint.event_type.toLowerCase()} had gone the other way,{' '}
            {matchpoint.team}'s win probability at that moment would have been{' '}
            <strong className="font-mono text-ice">{counterfactualProb.toFixed(1)}%</strong>{' '}
            instead of <strong className="font-mono text-ice">{actualProb.toFixed(1)}%</strong>.
            {matchpoint.counterfactual_methodology === 'proxy_shift'
              ? ' This moment wasn’t a shot, so no score can be flipped — the figure uses a documented ±5-point adjustment rather than a full re-simulation.'
              : ' The dashed line above traces how the rest of the match would have projected from that flipped state.'}
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-rose">
            Based on xG-state Monte Carlo simulation using StatsBomb open data
          </p>
        </div>
      )}
    </div>
  )
}

export default CounterfactualPanel
