import Reveal from './Reveal'
import Glossary from './Glossary'

function CalibrationRow({ row, maxCount }) {
  const gap = Math.abs(row.mean_predicted - row.actual_home_win_pct)
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-rose">
          Predicted {row.bucket}
          <span className="ml-2 text-rose/60">n={row.count}</span>
        </span>
        <span className={gap > 10 ? 'text-ice' : 'text-gold'}>
          actual {row.actual_home_win_pct}%
        </span>
      </div>
      <div className="relative h-2 bg-maroon-soft/50">
        <div
          className="absolute inset-y-0 left-0 bg-rose/40"
          style={{ width: `${row.mean_predicted}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 border-r-2 border-gold"
          style={{ width: `${row.actual_home_win_pct}%` }}
        />
      </div>
    </div>
  )
}

/* Analytical rigor, not just a claim: bucket every prediction the model
   ever made by its predicted win probability, then check how often the
   home team actually won at full time (regulation + extra time, the
   model's real target — see calibration.py for why penalties are excluded).
   A trustworthy model's actual rate should track its predicted rate. */
function ModelValidation({ calibration }) {
  if (!calibration) return null
  const maxCount = Math.max(...calibration.curve.map((c) => c.count))

  return (
    <section className="border-t border-maroon-soft py-20">
      <div className="eyebrow eyebrow-rule mb-3">Is this actually reliable?</div>
      <p className="mb-10 max-w-[65ch] text-sm leading-relaxed text-rose">
        Every prediction the model ever made, checked against what actually happened. Across{' '}
        <strong className="text-chalk">{calibration.total_data_points.toLocaleString()}</strong>{' '}
        moments, when the model said a team had, say, a 70–80% chance to win, how often did they
        actually win? The gold line marks the predicted rate; the bar fill shows the real one —
        the closer they sit, the more the <Glossary term="win probability" /> means what it says.
      </p>
      <Reveal>
        <div className="max-w-2xl">
          {calibration.curve.map((row) => (
            <CalibrationRow key={row.bucket} row={row} maxCount={maxCount} />
          ))}
        </div>
      </Reveal>
      <p className="mt-8 max-w-[65ch] text-sm leading-relaxed text-rose">
        Average gap between predicted and actual:{' '}
        <strong className="text-chalk">{calibration.mean_absolute_calibration_error} points</strong>.
        The model runs slightly conservative in the middle of the range — a "coin flip" call
        tends to favor the eventual winner a bit more than 50/50 in practice — and is close to
        exact at the extremes.
      </p>
    </section>
  )
}

export default ModelValidation
