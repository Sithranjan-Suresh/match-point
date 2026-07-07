import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

function ProbabilityTimeline({ timeline, maxMinute }) {
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ProbabilityTimeline
