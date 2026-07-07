import { useEffect, useRef } from 'react'

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

  return (
    <div
      ref={panelRef}
      className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm relative"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
      >
        ✕
      </button>
      <p className="text-xs font-medium text-slate-400">{event.minute}' — {event.event_type}</p>
      <p className="mt-1 font-semibold text-slate-900">
        {event.player} {event.team ? `(${event.team})` : ''}
      </p>
      <div className="mt-2 flex gap-6 text-sm text-slate-600">
        <span>Before: {prevProbHome}%</span>
        <span>After: {event.prob_home}%</span>
        <span className="font-medium text-slate-900">Δ {event.delta >= 0 ? '+' : ''}{event.delta}%</span>
      </div>
    </div>
  )
}

export default EventDetailPanel
