import Reveal from './Reveal'

const STEPS = [
  {
    n: '01',
    title: 'Ingest',
    body: 'Every event of all 64 matches — 280,000+ passes, shots, cards, and substitutions — from StatsBomb open data.',
  },
  {
    n: '02',
    title: 'Simulate',
    body: 'At every shot, card, and substitution, 10,000 Poisson-sampled futures of the remaining match are played out from the live xG state.',
  },
  {
    n: '03',
    title: 'Detect',
    body: 'The MatchPoint is the event with the single largest swing in win probability — the moment the match tipped past return.',
  },
  {
    n: '04',
    title: 'Flip',
    body: 'The counterfactual reverses that one moment — goal to miss, miss to goal — and re-simulates the rest of the match from the flipped state.',
  },
]

/* The steps are numbered because this is the actual pipeline order:
   each stage consumes the previous stage's output. */
function Methodology() {
  return (
    <section className="border-t border-maroon-soft py-20">
      <div className="eyebrow eyebrow-rule mb-12">How MatchPoint works</div>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 100}>
            <div>
              <p className="font-mono text-sm text-gold">{step.n}</p>
              <h3 className="display mt-3 text-2xl text-chalk">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-rose">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-12 max-w-[70ch] font-mono text-[11px] leading-relaxed tracking-wide text-rose/80">
        Every number on this site is traceable to public event data — no black box. The full
        pipeline is open source and re-runnable from the repository.
      </p>
    </section>
  )
}

export default Methodology
