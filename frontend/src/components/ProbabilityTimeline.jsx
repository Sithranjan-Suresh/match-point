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
import { eventFillColor } from '../eventColors'

function makeEventDot(matchpointEventId) {
  return function EventDot(props) {
    const { cx, cy, payload } = props
    if (cx == null || cy == null) return null
    const isMatchPoint = payload.event_id === matchpointEventId
    const color = eventFillColor(payload.event_type)

    if (isMatchPoint) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} className="matchpoint-ring" fill="none" stroke={color} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={8} fill={color} stroke="#fff" strokeWidth={2} />
        </g>
      )
    }

    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
  }
}

function ProbabilityTimeline({ timeline, maxMinute, matchpointEventId }) {
  const annotatedEvents = timeline.filter((e) => e.annotate)
  const EventDot = makeEventDot(matchpointEventId)

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: 600, height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeline} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="minute"
              type="number"
              domain={[0, maxMinute]}
              tickFormatter={(m) => `${m}'`}
              stroke="#94a3b8"
            />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#94a3b8" />
            <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Tooltip
              formatter={(value) => `${value}%`}
              labelFormatter={(minute) => `Minute ${minute}`}
            />
            <Line
              type="monotone"
              dataKey="prob_home"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Scatter data={annotatedEvents} dataKey="prob_home" shape={EventDot} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ProbabilityTimeline
