function NarrativeCard({ narrative }) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="text-xs font-medium text-slate-400 mb-1">Why it mattered</p>
      {narrative ? (
        <p className="text-slate-700 leading-relaxed">{narrative}</p>
      ) : (
        <p className="text-slate-400 italic">Narrative unavailable for this match.</p>
      )}
    </div>
  )
}

export default NarrativeCard
