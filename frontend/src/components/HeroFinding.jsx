function HeroFinding({ summary }) {
  return (
    <header className="pt-16 pb-20 md:pt-24 md:pb-28">
      <p className="eyebrow hero-rise" style={{ animationDelay: '0ms' }}>
        Qatar 2022 · 64 matches · 10,000 simulated futures per moment
      </p>
      <h1 className="display mt-8 text-[clamp(3.4rem,10vw,8.5rem)]">
        <span className="hero-rise block" style={{ animationDelay: '120ms' }}>
          The match was
        </span>
        <span className="hero-rise block" style={{ animationDelay: '240ms' }}>
          decided before
        </span>
        <span
          className="hero-rise block italic text-gold"
          style={{ animationDelay: '360ms', fontWeight: 600 }}
        >
          you knew it.
        </span>
      </h1>
      <p
        className="hero-rise mt-8 max-w-xl text-base leading-relaxed text-rose md:text-lg"
        style={{ animationDelay: '500ms' }}
      >
        MatchPoint re-simulates every shot, card, and substitution of the 2022 World Cup to find
        the single event each match could not come back from
        {summary ? (
          <>
            {' '}
            — and {summary.pct_matchpoints_before_60}% of them arrived before the hour mark.
          </>
        ) : (
          '.'
        )}
      </p>
    </header>
  )
}

export default HeroFinding
