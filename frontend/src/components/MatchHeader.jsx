import { useState } from 'react'
import { Link } from 'react-router-dom'

function MatchHeader({ match }) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
      .catch(() => window.prompt('Copy this link:', window.location.href))
      .finally(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  return (
    <header className="pt-10 pb-12">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em]">
        <Link to="/" className="text-rose transition-colors hover:text-gold">
          ← All fixtures
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="cursor-pointer border border-maroon-soft px-3 py-1.5 text-rose transition-colors hover:border-gold hover:text-gold"
        >
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>

      <p className="eyebrow hero-rise mt-12" style={{ animationDelay: '0ms' }}>
        {match.stage} · Qatar 2022
      </p>
      <h1
        className="display hero-rise mt-4 flex flex-wrap items-baseline gap-x-5 text-[clamp(2.6rem,7vw,5.5rem)]"
        style={{ animationDelay: '120ms' }}
      >
        <span>{match.home_team}</span>
        <span className="font-mono text-[0.55em] font-semibold tabular-nums text-gold">
          {match.score_home}–{match.score_away}
        </span>
        <span>{match.away_team}</span>
      </h1>
      {match.decided_on_penalties && (
        <p
          className="hero-rise mt-4 font-mono text-xs uppercase tracking-[0.16em] text-rose"
          style={{ animationDelay: '220ms' }}
        >
          Decided on penalties — the MatchPoint below is the highest-impact moment of
          regulation and extra time.
        </p>
      )}
    </header>
  )
}

export default MatchHeader
