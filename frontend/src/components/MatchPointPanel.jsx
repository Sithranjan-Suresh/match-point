import Reveal from './Reveal'
import EventSummary from './EventSummary'
import NarrativeCard from './NarrativeCard'

function MatchPointPanel({ matchpoint, homeTeam, narrative, children }) {
  return (
    <Reveal>
      <section className="mt-10 border border-maroon-soft bg-night-2/60 p-6 md:p-10">
        <p className="eyebrow eyebrow-rule mb-8" style={{ color: 'var(--color-gold)' }}>
          The MatchPoint
        </p>
        <EventSummary matchpoint={matchpoint} homeTeam={homeTeam} />
        <NarrativeCard narrative={narrative} />
        {children}
      </section>
    </Reveal>
  )
}

export default MatchPointPanel
