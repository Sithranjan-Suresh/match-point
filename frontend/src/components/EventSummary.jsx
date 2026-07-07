function EventSummary({ matchpoint, homeTeam }) {
  // matchpoint.delta is the change in the HOME team's win probability. Flip
  // the sign when the impacted team is the away side, so the badge reads
  // correctly as "+X% for {team}" regardless of home/away.
  const rawDelta = matchpoint.delta
  const delta = matchpoint.team === homeTeam ? rawDelta : -rawDelta
  const sign = delta >= 0 ? '+' : '−'

  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex items-end gap-5">
        <span className="display text-[5.5rem] leading-[0.8] text-gold md:text-[7rem]">
          {matchpoint.minute}'
        </span>
        <div className="pb-1.5">
          <p className="display text-2xl text-chalk md:text-3xl">{matchpoint.event_type}</p>
          <p className="mt-1 text-sm text-rose">
            {matchpoint.player} · {matchpoint.team}
          </p>
        </div>
      </div>
      <div className="border border-gold/60 bg-gold/10 px-4 py-2.5 font-mono text-sm tabular-nums text-gold">
        {sign}
        {Math.abs(delta).toFixed(1)}% for {matchpoint.team}
      </div>
    </div>
  )
}

export default EventSummary
