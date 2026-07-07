function NarrativeCard({ narrative }) {
  return (
    <div className="mt-10 border-t border-maroon-soft pt-8">
      <p className="eyebrow mb-4">Why it mattered</p>
      {narrative ? (
        <p className="max-w-[62ch] text-base leading-relaxed text-chalk/90 md:text-lg">
          {narrative}
        </p>
      ) : (
        <p className="font-mono text-sm text-rose">No narrative available for this match yet.</p>
      )}
    </div>
  )
}

export default NarrativeCard
