import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { saveScrollPosition } from '../scrollMemory'

function SubRow({ sub, positive }) {
  return (
    <Link
      to={`/match/${sub.match_id}`}
      onClick={saveScrollPosition}
      className="group flex items-baseline justify-between gap-3 border-b border-maroon-soft/60 py-3 transition-colors hover:border-gold/50"
    >
      <span className="flex-1 text-sm text-chalk/90 transition-colors group-hover:text-gold">
        {sub.player}
        <span className="font-mono text-[11px] text-rose">
          {' '}
          · {sub.team} · {sub.minute}' · {sub.home_team} v {sub.away_team}
        </span>
      </span>
      <span
        className="font-mono text-sm tabular-nums"
        style={{ color: positive ? 'var(--color-gold)' : 'var(--color-ice)' }}
      >
        {sub.impact > 0 ? '+' : ''}
        {sub.impact.toFixed(1)}
      </span>
    </Link>
  )
}

/* Practical-application angle: not "when was the match decided" but "which
   specific decisions and players produced value," aggregated the way a
   coach or scout would actually want to see it — tournament-wide, not
   match-by-match. */
function Dugout({ impact }) {
  if (!impact) return null

  return (
    <section className="border-t border-maroon-soft py-20">
      <div className="eyebrow eyebrow-rule mb-3">For the dugout</div>
      <p className="mb-12 max-w-[65ch] text-sm leading-relaxed text-rose">
        The same win-probability model, sliced for a different reader: which substitutions
        actually paid off, which backfired, and which players moved the game beyond what the
        scoresheet shows.
      </p>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
        <Reveal>
          <h3 className="display mb-1 text-2xl text-chalk">Subs that paid off</h3>
          <p className="mb-5 text-xs text-rose">Biggest win-probability gain right after the change</p>
          {impact.best_substitutions.map((s) => (
            <SubRow key={`${s.match_id}-${s.player}`} sub={s} positive />
          ))}
        </Reveal>

        <Reveal delay={120}>
          <h3 className="display mb-1 text-2xl text-chalk">Subs that backfired</h3>
          <p className="mb-5 text-xs text-rose">Biggest win-probability drop right after the change</p>
          {impact.worst_substitutions.map((s) => (
            <SubRow key={`${s.match_id}-${s.player}`} sub={s} />
          ))}
        </Reveal>

        <Reveal delay={240}>
          <h3 className="display mb-1 text-2xl text-chalk">Impact index</h3>
          <p className="mb-5 text-xs text-rose">Win-probability swing across their events, all 64 matches</p>
          <ol>
            {impact.top_impact_players.slice(0, 5).map((p, i) => (
              <li
                key={p.player}
                className="flex items-baseline justify-between gap-3 border-b border-maroon-soft/60 py-3"
              >
                <span className="font-mono text-[11px] tabular-nums text-rose">0{i + 1}</span>
                <span className="flex-1 text-sm text-chalk/90">
                  {p.player}
                  <span className="font-mono text-[11px] text-rose"> · {p.team}</span>
                </span>
                <span className="font-mono text-sm tabular-nums text-gold">
                  {p.total_abs_impact.toFixed(0)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-relaxed text-rose">
            Messi and Mbappé lead the tournament — the two finalists were on the ball for the
            largest cumulative swings, goals or not.
          </p>
        </Reveal>
      </div>
      <p className="mt-12 max-w-[70ch] font-mono text-[11px] leading-relaxed tracking-wide text-rose/80">
        The Impact Index sums the size of the win-probability swing at every shot, card, and
        substitution a player was directly involved in — correlation with the moment, not proof
        they alone caused it. Treat it as "who was present for the biggest swings," not a final
        word on individual quality.
      </p>
    </section>
  )
}

export default Dugout
