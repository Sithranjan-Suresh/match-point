import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { eventFillColor, EVENT_FILL_COLORS } from '../eventColors'

const AXIS_TICK = { fill: '#c08a9b', fontFamily: '"Spline Sans Mono", monospace', fontSize: 11 }

function makeEventDot(matchpointEventId, onEventClick) {
  return function EventDot(props) {
    const { cx, cy, payload } = props
    if (cx == null || cy == null) return null
    const isMatchPoint = payload.event_id === matchpointEventId
    const color = eventFillColor(payload.event_type)
    const handleClick = () => onEventClick?.(payload)

    if (isMatchPoint) {
      return (
        <g onClick={handleClick} style={{ cursor: 'pointer' }}>
          <circle cx={cx} cy={cy} r={8} className="matchpoint-ring" fill="none" stroke="#e8b54a" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={8} fill="#e8b54a" stroke="#160409" strokeWidth={2} />
        </g>
      )
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill={color}
        stroke="#160409"
        strokeWidth={1.5}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
    )
  }
}

function makeChartTooltip(homeTeam, awayTeam) {
  return function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const e = payload[0].payload
    return (
      <div className="border border-maroon bg-surface px-3 py-2 font-mono text-[11px] text-chalk">
        <span className="text-gold">{e.minute}'</span>
        {e.event_type && e.event_type !== 'Kick Off' && <> · {e.event_type}</>}
        {e.player && <> · {e.player}</>}
        <div className="mt-1 tabular-nums text-rose">
          {homeTeam} {e.prob_home}%
          {e.prob_draw != null && <> · draw {e.prob_draw}%</>}
          {e.prob_away != null && <> · {awayTeam} {e.prob_away}%</>}
        </div>
      </div>
    )
  }
}

const LEGEND = ['Goal', 'Missed Shot', 'Yellow Card', 'Substitution']

function ProbabilityTimeline({
  timeline,
  maxMinute,
  matchpointEventId,
  matchpointMinute,
  counterfactualData,
  onEventClick,
  homeTeam,
  awayTeam,
}) {
  const annotatedEvents = timeline.filter((e) => e.annotate)
  const EventDot = makeEventDot(matchpointEventId, onEventClick)
  const ChartTooltip = makeChartTooltip(homeTeam, awayTeam)

  return (
    <div className="border border-maroon-soft bg-night-2/60 p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-rose">
          {homeTeam} win probability · 0–120'
        </span>
        <span className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-rose">
          {LEGEND.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: EVENT_FILL_COLORS[type] }}
              />
              {type}
            </span>
          ))}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: 620, height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline} margin={{ top: 14, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,21,56,0.3)" />
              <XAxis
                dataKey="minute"
                type="number"
                domain={[0, maxMinute]}
                tickFormatter={(m) => `${m}'`}
                tick={AXIS_TICK}
                stroke="rgba(138,21,56,0.6)"
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={AXIS_TICK}
                stroke="rgba(138,21,56,0.6)"
              />
              <ReferenceLine y={50} stroke="rgba(192,138,155,0.45)" strokeDasharray="4 4" />
              {matchpointMinute != null && (
                <ReferenceLine
                  x={matchpointMinute}
                  stroke="#e8b54a"
                  strokeDasharray="5 4"
                  strokeOpacity={0.75}
                  label={{
                    value: 'MATCHPOINT',
                    position: 'insideBottomRight',
                    dy: -6,
                    fill: '#e8b54a',
                    fontFamily: '"Spline Sans Mono", monospace',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                  }}
                />
              )}
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(232,181,74,0.35)' }} />
              <Line
                type="monotone"
                dataKey="prob_home"
                stroke="#f6eee3"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={1600}
                animationEasing="ease-out"
              />
              <Scatter data={annotatedEvents} dataKey="prob_home" shape={EventDot} isAnimationActive={false} />
              {counterfactualData && (
                <Line
                  type="monotone"
                  data={counterfactualData}
                  dataKey="prob_home"
                  stroke="#9cd3c4"
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={900}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-rose/70">
        Click any moment on the curve for its full swing
      </p>
    </div>
  )
}

export default ProbabilityTimeline
