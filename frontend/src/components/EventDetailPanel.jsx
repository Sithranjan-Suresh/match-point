import { useEffect, useRef } from 'react'
import { eventFillColor } from '../eventColors'

function EventDetailPanel({ event, prevProbHome, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    function handleClickAway(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickAway)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickAway)
    }
  }, [onClose])

  if (!event) return null
  const color = eventFillColor(event.event_type)

  return (
    <div
      ref={panelRef}
      className="relative mt-4 border bg-surface p-5"
      style={{ borderColor: `${color}66` }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 cursor-pointer font-mono text-rose transition-colors hover:text-chalk"
      >
        ✕
      </button>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color }}>
        {event.minute}' · {event.event_type}
      </p>
      <p className="display mt-2 text-2xl text-chalk">
        {event.player} {event.team ? <span className="text-rose">· {event.team}</span> : ''}
      </p>
      <div className="mt-4 flex flex-wrap gap-8 font-mono text-sm tabular-nums text-rose">
        <span>
          before <span className="text-chalk">{prevProbHome}%</span>
        </span>
        <span>
          after <span className="text-chalk">{event.prob_home}%</span>
        </span>
        <span>
          Δ{' '}
          <span className="text-gold">
            {event.delta >= 0 ? '+' : ''}
            {event.delta}%
          </span>
        </span>
      </div>
    </div>
  )
}

export default EventDetailPanel
