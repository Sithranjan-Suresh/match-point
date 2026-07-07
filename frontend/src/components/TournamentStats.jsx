import Reveal from './Reveal'
import CountUp from './CountUp'

function StatBoard({ value, decimals, suffix, label, detail, delay }) {
  return (
    <Reveal delay={delay}>
      <div className="border-l-2 border-gold py-1 pl-6">
        <p className="display text-6xl text-chalk md:text-7xl">
          <CountUp value={value} decimals={decimals} />
          <span className="text-[0.45em] text-rose">{suffix}</span>
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{label}</p>
        <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-rose">{detail}</p>
      </div>
    </Reveal>
  )
}

function TournamentStats({ summary }) {
  if (!summary) return null

  return (
    <section className="grid grid-cols-1 gap-10 border-y border-maroon-soft py-14 sm:grid-cols-3 sm:gap-6">
      <StatBoard
        value={summary.pct_matchpoints_before_60}
        decimals={1}
        suffix="%"
        label="Decided before 60'"
        detail="Most matches tipped past the point of return with half an hour still to play."
        delay={0}
      />
      <StatBoard
        value={summary.pct_matchpoints_not_goals}
        decimals={1}
        suffix="%"
        label="Not goals at all"
        detail="Missed sitters, cards, and substitutions — the moment often never made the highlight reel."
        delay={120}
      />
      <StatBoard
        value={summary.avg_delta}
        decimals={1}
        suffix=" pts"
        label="Average swing"
        detail="How far win probability moved, on average, in the single most decisive moment."
        delay={240}
      />
    </section>
  )
}

export default TournamentStats
