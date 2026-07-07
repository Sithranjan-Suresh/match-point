import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Reveal from './Reveal'
import { saveScrollPosition } from '../scrollMemory'

const MAX_MINUTE = 125
const GOAL_TYPES = ['Goal', 'Own Goal']

const MARKERS = [
  { minute: 0, label: "0'" },
  { minute: 45, label: 'HT' },
  { minute: 60, label: "60'", gold: true },
  { minute: 90, label: 'FT' },
  { minute: 120, label: 'AET' },
]

function pct(minute) {
  return `${(Math.min(minute, MAX_MINUTE) / MAX_MINUTE) * 100}%`
}

/* Every one of the 64 decisive moments, plotted on the minute axis.
   Tick height encodes the size of the win-probability swing;
   gold ticks are goals, rose ticks are everything else. When a search
   filter is active, non-matching ticks fade instead of disappearing —
   so the signature visualization stays honest about the filter state
   the fixture list below is already showing. */
function MinuteStrip({ matches, highlightIds }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)

  const maxDelta = Math.max(...matches.map((m) => Math.abs(m.matchpoint_delta)), 1)

  return (
    <div>
      <div className="eyebrow eyebrow-rule mb-8">Every decisive moment, by the minute</div>
      <Reveal>
        <div className="relative h-28 select-none">
          {/* axis markers */}
          {MARKERS.map((mark) => (
            <div
              key={mark.label}
              className="absolute top-0 bottom-5 border-l border-dashed"
              style={{
                left: pct(mark.minute),
                borderColor: mark.gold ? 'rgba(232,181,74,0.5)' : 'rgba(138,21,56,0.5)',
              }}
            >
              <span
                className="absolute -bottom-5 -translate-x-1/2 font-mono text-[10px] tracking-widest"
                style={{ color: mark.gold ? 'var(--color-gold)' : 'var(--color-rose)' }}
              >
                {mark.label}
              </span>
            </div>
          ))}

          {/* baseline */}
          <div className="absolute bottom-5 left-0 right-0 h-px bg-maroon" />

          {/* one tick per match — the button is a wider invisible tap target;
              the visible 3px bar is a centered child so mobile tapping isn't
              precision-limited to the bar's own width */}
          {matches.map((match, i) => {
            const isGoal = GOAL_TYPES.includes(match.matchpoint_event_type)
            const height = 14 + (Math.abs(match.matchpoint_delta) / maxDelta) * 68
            const isDimmed = highlightIds != null && !highlightIds.has(match.match_id)
            return (
              <button
                key={match.match_id}
                type="button"
                aria-label={`${match.home_team} vs ${match.away_team}, minute ${match.matchpoint_minute}`}
                className="absolute bottom-5 w-4 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-0"
                style={{ left: pct(match.matchpoint_minute), height }}
                onMouseEnter={() => setHovered(match)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(match)}
                onBlur={() => setHovered(null)}
                onClick={() => {
                  saveScrollPosition()
                  navigate(`/match/${match.match_id}`)
                }}
              >
                <span
                  className="strip-tick absolute bottom-0 left-1/2 block w-[3px] -translate-x-1/2 transition-opacity duration-300"
                  style={{
                    height,
                    background: isGoal ? 'var(--color-gold)' : 'var(--color-rose)',
                    opacity: isDimmed ? 0.12 : isGoal ? 0.95 : 0.75,
                    transitionDelay: `${i * 18}ms`,
                  }}
                />
              </button>
            )
          })}

          {/* hover readout */}
          {hovered && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 whitespace-nowrap border border-maroon bg-surface px-3 py-1.5 font-mono text-[11px] text-chalk"
              style={{
                left: pct(hovered.matchpoint_minute),
              }}
            >
              {hovered.home_team} {hovered.score_home}–{hovered.score_away} {hovered.away_team}
              <span className="text-gold"> · {hovered.matchpoint_minute}'</span>
            </div>
          )}
        </div>
      </Reveal>

      <div className="mt-10 flex gap-6 font-mono text-[10px] uppercase tracking-[0.18em] text-rose">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-[3px] bg-gold" /> goal
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-[3px] bg-rose" /> not a goal
        </span>
        <span className="hidden sm:inline">taller tick = bigger swing</span>
      </div>
    </div>
  )
}

export default MinuteStrip
