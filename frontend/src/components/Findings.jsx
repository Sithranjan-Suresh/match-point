import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { saveScrollPosition } from '../scrollMemory'

function BarRow({ label, value, max, color }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-rose">{label}</span>
        <span className="tabular-nums text-chalk">{value}</span>
      </div>
      <div className="h-2 bg-maroon-soft/50">
        <div
          className="bar-fill h-full"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}

/* Tournament-wide findings, straight from the pre-computed summary:
   when matches tip, what kind of moment tips them, and the five
   biggest swings of the whole World Cup. */
function Findings({ summary }) {
  if (!summary) return null

  const minuteEntries = Object.entries(summary.minute_distribution)
  const minuteMax = Math.max(...minuteEntries.map(([, v]) => v))
  const typeEntries = Object.entries(summary.event_type_distribution).sort((a, b) => b[1] - a[1])
  const typeMax = Math.max(...typeEntries.map(([, v]) => v))

  return (
    <section className="border-t border-maroon-soft py-20">
      <div className="eyebrow eyebrow-rule mb-12">What the data says</div>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
        <Reveal>
          <h3 className="display mb-6 text-2xl text-chalk">When matches tip</h3>
          {minuteEntries.map(([bucket, count]) => (
            <BarRow
              key={bucket}
              label={`${bucket}'`}
              value={count}
              max={minuteMax}
              color="var(--color-gold)"
            />
          ))}
          <p className="mt-5 text-sm leading-relaxed text-rose">
            Only 2 of 64 matches were decided after the 90th minute. The drama usually ends long
            before the whistle.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <h3 className="display mb-6 text-2xl text-chalk">What kind of moment</h3>
          {typeEntries.map(([type, count]) => (
            <BarRow
              key={type}
              label={type}
              value={count}
              max={typeMax}
              color={type === 'Goal' ? 'var(--color-gold)' : 'var(--color-rose)'}
            />
          ))}
          <p className="mt-5 text-sm leading-relaxed text-rose">
            1 in 6 matches turned on a chance that was missed — the decisive moment never made
            the scoreboard.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <h3 className="display mb-6 text-2xl text-chalk">Biggest swings</h3>
          <ol>
            {summary.top_delta_matches.map((m, i) => (
              <li key={m.match_id}>
                <Link
                  to={`/match/${m.match_id}`}
                  onClick={saveScrollPosition}
                  className="group flex items-baseline justify-between gap-3 border-b border-maroon-soft/60 py-3 transition-colors hover:border-gold/50"
                >
                  <span className="font-mono text-[11px] tabular-nums text-rose">0{i + 1}</span>
                  <span className="flex-1 text-sm text-chalk/90 transition-colors group-hover:text-gold">
                    {m.home_team} v {m.away_team}
                    <span className="font-mono text-[11px] text-rose"> · {m.stage}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums text-gold">
                    {Math.abs(m.matchpoint_delta).toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-relaxed text-rose">
            Win-probability points moved in a single moment. The Final makes the list — Mbappé's
            117th-minute equaliser.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export default Findings
